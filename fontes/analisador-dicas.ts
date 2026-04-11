/**
 * Sistema de Dicas de Otimização
 * 
 * Fornece recomendações para otimizar consultas baseado em padrões detectados.
 */

import { Dica, TipoDica, NivelSeveridade } from "./interfaces-tipos";

export class AnalisadorDicas {
    /**
     * Analisa consulta e retorna dicas de otimização
     */
    static analisar(
        sql: string,
        metricasExecucao?: {
            tempoMs: number;
            linhas: number;
            contagemJuncoes: number;
        }
    ): Dica[] {
        const dicas: Dica[] = [];

        // Detecta SELECT *
        if (sql.toLowerCase().includes("select *")) {
            dicas.push({
                tipo: TipoDica.SELECAO_DESNECESSARIA,
                severidade: NivelSeveridade.MEDIO,
                mensagem: "Consulta usa SELECT * (todas as colunas)",
                sugestao: "Especifique apenas as colunas necessárias para melhorar performance"
            });
        }

        // Detecta múltiplos JOINs
        const juncoes = (sql.match(/join/gi) || []).length;
        if (juncoes > 2) {
            dicas.push({
                tipo: TipoDica.JUNCAO_REDUNDANTE,
                severidade: NivelSeveridade.ALTO,
                mensagem: `Consulta tem ${juncoes} junções (acima do recomendado)`,
                sugestao: "Considere usar eager loading ou reorganizar a estrutura de dados",
                metrica: {
                    nome: "Junções",
                    valor: juncoes,
                    unidade: "quantidade"
                }
            });
        }

        // Detecta falta de LIMIT
        if (!sql.toLowerCase().includes("limit") && !sql.toLowerCase().includes("top")) {
            dicas.push({
                tipo: TipoDica.PAGINACAO_FALTANTE,
                severidade: NivelSeveridade.ALTO,
                mensagem: "Consulta sem LIMITE pode retornar muitas linhas",
                sugestao: "Adicione paginação com LIMITE e DESLOCAMENTO para dados em larga escala"
            });
        }

        // Análise de desempenho se métricas disponíveis
        if (metricasExecucao) {
            if (metricasExecucao.tempoMs > 1000 && metricasExecucao.linhas > 10000) {
                dicas.push({
                    tipo: TipoDica.CACHE_RECOMENDADA,
                    severidade: NivelSeveridade.ALTO,
                    mensagem: "Consulta lenta com muitos resultados",
                    sugestao: "Use cache para resultados desta consulta ou otimize índices",
                    metrica: {
                        nome: "Tempo",
                        valor: metricasExecucao.tempoMs,
                        unidade: "ms"
                    }
                });
            }

            if (metricasExecucao.tempoMs > 500 && juncoes > 0) {
                dicas.push({
                    tipo: TipoDica.USAR_CARGA_EM_LOTE,
                    severidade: NivelSeveridade.MEDIO,
                    mensagem: "JOINs resultando em consulta lenta",
                    sugestao: "Considere usar carga em lote em vez de junções diretas"
                });
            }
        }

        return dicas;
    }

    /**
     * Formata dicas para exibição
     */
    static formatarDicas(dicas: Dica[]): string {
        if (dicas.length === 0) {
            return "✅ Nenhuma dica de otimização necessária";
        }

        const linhas = [
            `📋 Dicas de Otimização (${dicas.length} encontrada${dicas.length > 1 ? 's' : ''}):`,
            ""
        ];

        // Agrupa por severidade
        const porSeveridade = new Map<NivelSeveridade, Dica[]>();
        for (const dica of dicas) {
            if (!porSeveridade.has(dica.severidade)) {
                porSeveridade.set(dica.severidade, []);
            }
            porSeveridade.get(dica.severidade)!.push(dica);
        }

        // Ordem de severidade
        const ordem = [
            NivelSeveridade.CRITICO,
            NivelSeveridade.ALTO,
            NivelSeveridade.MEDIO,
            NivelSeveridade.BAIXO,
            NivelSeveridade.INFO
        ];

        for (const severidade of ordem) {
            const dicasPorSev = porSeveridade.get(severidade);
            if (!dicasPorSev) continue;

            const icone = {
                [NivelSeveridade.CRITICO]: "🔴",
                [NivelSeveridade.ALTO]: "🟠",
                [NivelSeveridade.MEDIO]: "🟡",
                [NivelSeveridade.BAIXO]: "🔵",
                [NivelSeveridade.INFO]: "ℹ️"
            };

            linhas.push(`\n${icone[severidade]} ${severidade}:`);

            for (const dica of dicasPorSev) {
                linhas.push(`  • ${dica.mensagem}`);
                linhas.push(`    → ${dica.sugestao}`);
                
                if (dica.metrica) {
                    linhas.push(
                        `    | ${dica.metrica.nome}: ${dica.metrica.valor} ${dica.metrica.unidade}`
                    );
                }
            }
        }

        return linhas.join("\n");
    }
}
