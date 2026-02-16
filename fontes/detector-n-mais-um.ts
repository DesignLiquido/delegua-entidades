import { InformacaoConsulta } from "./interfaces-tipos";
import { AnaliseN1 } from "./interfaces-tipos/analise-n1-interface";

/**
 * Detector de padrão N+1 em queries. Monitora consultas executadas
 * e identifica quando um único resultado desencadeia N consultas adicionais.
 * 
 * Padrão N+1:
 * 1. consulta principal retorna N registros
 * 2. Seguida imediatamente por N consultas idênticas ou similares
 * 3. Geralmente ocorre ao carregar relacionamentos sem eager loading
 * 
 * Exemplo:
 * ```
 * // 1 query
 * const usuarios = await colecao.todos(); // Retorna 100 usuários
 * 
 * // 100 consultas (1 por usuário)
 * for (const usuario of usuarios) {
 *     const pedidos = await usuario.pedidos.todos(); // N+1!
 * }
 * ```
 * 
 * Solução: Usar eager loading
 * ```
 * const usuarios = await colecao.consulta()
 *     .incluirRelacionados('pedidos')
 *     .todos(); // 1 ou 2 consultas apenas
 * ```
 */
export class DetectorConsultasN1 {
    private consultas: InformacaoConsulta[] = [];
    private limiteJanela: number = 500; // Número de consultas a manter em memória
    private limiarN1: number = 2; // Mínimo de consultas similares para considerar N+1

    /**
     * Registra uma consulta executada.
     */
    registrarConsulta(
        sql: string,
        quantidadeRegistros: number,
        tempoExecucao: number = 0,
        nomeEntidade?: string
    ): void {
        const informacao: InformacaoConsulta = {
            sql: this.normalizarSQL(sql),
            linhaExecucao: new Error(),
            carimboTempo: new Date(),
            tempoExecucao,
            quantidadeRegistros,
            nomeEntidade
        };

        this.consultas.push(informacao);

        // Manter apenas as últimas N queries
        if (this.consultas.length > this.limiteJanela) {
            this.consultas.shift();
        }
    }

    /**
     * Analisa as consultas recentes procurando por padrão N+1.
     */
    analisar(): AnaliseN1 {
        if (this.consultas.length < 2) {
            return { detectado: false };
        }

        // Analisar último conjunto de consultas (último 100)
        const ultimasConsultas = this.consultas.slice(-100);

        // Variáveis para rastrear as melhores análises de cada tipo
        let melhorAnaliseSameTable: AnaliseN1 | null = null;
        let melhorRazaoSameTable = 0;
        
        let melhorAnaliseCrossTable: AnaliseN1 | null = null;
        let melhorRazaoCrossTable = 0;

        for (let i = 0; i < ultimasConsultas.length - 1; i++) {
            const consultaAtual = ultimasConsultas[i];

            // Se a consulta atual retornou múltiplos registros
            if (consultaAtual.quantidadeRegistros >= 2) {
                // Estratégia 1: Procurar por consultas similares (mesmo SELECT pattern, mesma tabela)
                const consultasSimilares = ultimasConsultas.slice(i + 1).filter(q =>
                    this.saoConsultasSimilares(consultaAtual.sql, q.sql)
                );

                // Se encontrada quantidade significativa de consultas similares
                if (consultasSimilares.length >= this.limiarN1) {
                    const razaoN1 = consultasSimilares.length / consultaAtual.quantidadeRegistros;

                    if (razaoN1 > melhorRazaoSameTable) {
                        melhorRazaoSameTable = razaoN1;
                        melhorAnaliseSameTable = {
                            detectado: true,
                            consultaPrincipal: consultaAtual,
                            consultasRelacionadas: consultasSimilares.slice(0, Math.min(consultasSimilares.length, 20)),
                            quantidadeRegistros: consultaAtual.quantidadeRegistros,
                            quantidadeConsultas: 1 + consultasSimilares.length,
                            sugestao: `Detectado padrão N+1: 1 consulta retornou ${consultaAtual.quantidadeRegistros} registros, ` +
                                `seguida por ${consultasSimilares.length} consultas similares. ` +
                                `Use incluirRelacionados() para carregamento antecipado (eager loading).`
                        };
                    }
                }

                // Estratégia 2: Procurar por padrão N+1 cross-table
                // Uma consulta retorna N registros, seguida por ~N consultas de tabela diferente
                const proximasConsultas = ultimasConsultas.slice(i + 1);
                const tabelaAtual = this.extrairTabela(consultaAtual.sql);

                if (proximasConsultas.length >= 2 && tabelaAtual) {
                    // Coletar as próximas consultas de uma tabela diferente
                    const clusterQueries: InformacaoConsulta[] = [];
                    const tabelasPrincipais = new Map<string, number>();

                    for (const proximaQuery of proximasConsultas) {
                        const tabelaProxima = this.extrairTabela(proximaQuery.sql);
                        
                        // Se for de tabela diferente, pode ser N+1 cross-table
                        if (tabelaProxima && tabelaProxima !== tabelaAtual) {
                            clusterQueries.push(proximaQuery);
                            tabelasPrincipais.set(tabelaProxima, (tabelasPrincipais.get(tabelaProxima) || 0) + 1);
                        } else if (tabelaProxima === tabelaAtual) {
                            // Se voltar para a mesma tabela original, para aqui
                            break;
                        }
                    }

                    // Se encontrou um cluster de consultas de uma única tabela diferente
                    // com tamanho próximo a N (entre 70% e 120% de N)
                    if (clusterQueries.length >= consultaAtual.quantidadeRegistros * 0.7 && 
                        clusterQueries.length <= consultaAtual.quantidadeRegistros * 1.2 &&
                        tabelasPrincipais.size === 1) {
                        
                        const razaoN1Cross = clusterQueries.length / consultaAtual.quantidadeRegistros;
                        
                        if (razaoN1Cross > melhorRazaoCrossTable) {
                            melhorRazaoCrossTable = razaoN1Cross;
                            melhorAnaliseCrossTable = {
                                detectado: true,
                                consultaPrincipal: consultaAtual,
                                consultasRelacionadas: clusterQueries.slice(0, Math.min(clusterQueries.length, 20)),
                                quantidadeRegistros: consultaAtual.quantidadeRegistros,
                                quantidadeConsultas: 1 + clusterQueries.length,
                                sugestao: `Detectado padrão N+1 (cross-table): 1 consulta retornou ${consultaAtual.quantidadeRegistros} registros, ` +
                                    `seguida por ${clusterQueries.length} consultas de tabela relacionada. ` +
                                    `Use incluirRelacionados() para carregamento antecipado (eager loading).`
                            };
                        }
                    }
                }
            }
        }

        // Retornar a melhor análise, preferindo cross-table quando existe
        // Cross-table com ratio >= 0.7 é considerado válido (70% dos N registros foram obtidos em N queries)
        if (melhorAnaliseCrossTable && melhorRazaoCrossTable >= 0.7) {
            return melhorAnaliseCrossTable;
        }
        
        // Caso contrário, retornar same-table se encontrado
        if (melhorAnaliseSameTable) {
            return melhorAnaliseSameTable;
        }

        return { detectado: false };
    }

    /**
     * Verifica se duas consultas são similares (mesmo padrão).
     * Para N+1, duas consultas são similares se vêm da mesma tabela.
     */
    private saoConsultasSimilares(sql1: string, sql2: string): boolean {
        // Extrair tabela principal de cada consulta
        const tabela1 = this.extrairTabela(sql1);
        const tabela2 = this.extrairTabela(sql2);
        
        // Se ambas consultam a mesma tabela, são potencialmente similares
        return tabela1 !== null && tabela1 === tabela2;
    }

    /**
     * Extrai o nome da tabela principal de uma consulta SQL.
     */
    private extrairTabela(sql: string): string | null {
        const sqlLower = sql.toLowerCase();
        
        // Procurar por "FROM tabela"
        const match = sqlLower.match(/from\s+([a-z_][a-z0-9_]*)/i);
        if (match && match[1]) {
            return match[1].toLowerCase();
        }
        
        return null;
    }

    /**
     * Normaliza SQL para comparação.
     */
    private normalizarSQL(sql: string): string {
        return sql
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
    }

    /**
     * Retorna todas as consultas registradas.
     */
    obterConsultas(): InformacaoConsulta[] {
        return [...this.consultas];
    }

    /**
     * Retorna as últimas N consultas.
     */
    obterUltimasConsultas(quantidade: number = 10): InformacaoConsulta[] {
        return this.consultas.slice(-quantidade);
    }

    /**
     * Retorna estatísticas de consultas.
     */
    obterEstatisticas(): {
        totalConsultas: number;
        tempoTotalMs: number;
        tempoMedioMs: number;
        totalRegistros: number;
    } {
        const totalConsultas = this.consultas.length;
        const tempoTotal = this.consultas.reduce((sum, q) => sum + q.tempoExecucao, 0);
        const totalRegistros = this.consultas.reduce((sum, q) => sum + q.quantidadeRegistros, 0);

        return {
            totalConsultas,
            tempoTotalMs: tempoTotal,
            tempoMedioMs: totalConsultas > 0 ? tempoTotal / totalConsultas : 0,
            totalRegistros
        };
    }

    /**
     * Limpa o histórico de consultas.
     */
    limpar(): void {
        this.consultas = [];
    }

    /**
     * Define o limiar para considerar padrão N+1.
     * Padrão mínimo: se houver pelo menos N consultas similares.
     */
    definirLimiar(limiar: number): void {
        this.limiarN1 = Math.max(1, limiar);
    }

    /**
     * Define o tamanho máximo da janela de monitoramento.
     */
    definirLimiteJanela(limite: number): void {
        this.limiteJanela = Math.max(10, limite);
    }
}

export type { InformacaoConsulta, AnaliseN1 };
