import { Condicao, Juncao, Literal, ReferenciaColuna, Selecionar, TecnologiaLinconesInterface, TradutorSqlAnsi } from "@designliquido/lincones-js";
import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";

type OperadorCondicao = 'IGUAL' | 'MAIOR' | 'MAIOR_IGUAL' | 'MENOR' | 'MENOR_IGUAL';

interface Ordenacao {
    coluna: string;
    direcao: 'ASC' | 'DESC';
}

/**
 * Construtor de consultas fluente para entidades.
 * Permite encadear condições, ordenações, limites e deslocamentos.
 */
export class ConstrutorConsulta {
    private entidade: EntidadeInterface;
    private tecnologia: TecnologiaLinconesInterface;
    private tradutor: TradutorSqlAnsi;

    private _tabela: string;
    private _colunas: string[];
    private _condicoes: Condicao[];
    private _condicoesOu: Condicao[][];
    private _ordenacoes: Ordenacao[];
    private _limite: number | null;
    private _deslocamento: number | null;
    private _juncoes: Juncao[];
    private _colunasPersonalizadas: boolean;
    private _relacionadosParaCarregar: string[];

    constructor(entidade: EntidadeInterface, tecnologia: TecnologiaLinconesInterface) {
        this.entidade = entidade;
        this.tecnologia = tecnologia;
        this.tradutor = new TradutorSqlAnsi();

        this._tabela = entidade.obterNome();
        this._colunas = entidade.obterNomesColunas();
        this._condicoes = [];
        this._condicoesOu = [];
        this._ordenacoes = [];
        this._limite = null;
        this._deslocamento = null;
        this._juncoes = [];
        this._colunasPersonalizadas = false;
        this._relacionadosParaCarregar = [];
    }

    /**
     * Adiciona uma condição WHERE (AND).
     */
    onde(coluna: string, operador: OperadorCondicao, valor: any): ConstrutorConsulta {
        this._condicoes.push(this.criarCondicao(coluna, operador, valor));
        return this;
    }

    /**
     * Adiciona mais uma condição AND.
     */
    e(coluna: string, operador: OperadorCondicao, valor: any): ConstrutorConsulta {
        return this.onde(coluna, operador, valor);
    }

    /**
     * Adiciona uma condição OR. Internamente cria um grupo separado de condições.
     */
    ou(coluna: string, operador: OperadorCondicao, valor: any): ConstrutorConsulta {
        this._condicoesOu.push([this.criarCondicao(coluna, operador, valor)]);
        return this;
    }

    /**
     * Define as colunas a serem selecionadas.
     */
    selecionar(...colunas: string[]): ConstrutorConsulta {
        this._colunas = colunas;
        this._colunasPersonalizadas = true;
        return this;
    }

    /**
     * Adiciona uma ordenação.
     */
    ordenarPor(coluna: string, direcao: 'ASC' | 'DESC' = 'ASC'): ConstrutorConsulta {
        this._ordenacoes.push({ coluna, direcao });
        return this;
    }

    /**
     * Define o limite de registros retornados.
     */
    limite(valor: number): ConstrutorConsulta {
        this._limite = valor;
        return this;
    }

    /**
     * Define o deslocamento (offset) dos registros.
     */
    deslocamento(valor: number): ConstrutorConsulta {
        this._deslocamento = valor;
        return this;
    }

    /**
     * Adiciona uma junção (JOIN) a partir do nome de um relacionamento definido na entidade.
     * Os relacionamentos são detectados pelos decoradores @temUm, @temMuitos e @pertenceA.
     */
    incluir(nomeRelacionamento: string): ConstrutorConsulta {
        const relacionamentos = this.entidade.obterRelacionamentos();
        const rel = relacionamentos.find(r => r.nomePropriedade === nomeRelacionamento);
        if (!rel) {
            throw new Error(
                `Relacionamento '${nomeRelacionamento}' não encontrado na entidade '${this.entidade.obterNome()}'.`
            );
        }

        const tipoJuncao = rel.tipo === 'pertenceA' ? 'INTERNA' : 'ESQUERDA';
        const juncao = new Juncao(
            tipoJuncao as any,
            rel.entidadeDestino,
            [new Condicao(
                new ReferenciaColuna(`${this._tabela}.${rel.colunaOrigem}`),
                'IGUAL',
                new ReferenciaColuna(`${rel.entidadeDestino}.${rel.colunaDestino}`) as any
            )]
        );

        this._juncoes.push(juncao);
        return this;
    }

    /**
     * Adiciona uma junção (JOIN) diretamente com um objeto Juncao.
     */
    incluirJuncao(juncao: Juncao): ConstrutorConsulta {
        this._juncoes.push(juncao);
        return this;
    }

    /**
     * Marca relacionamentos para carregamento antecipado (eager loading).
     * Os dados relacionados serão carregados em consultas separadas e anexados aos registros pai.
     */
    incluirRelacionados(...nomes: string[]): ConstrutorConsulta {
        this._relacionadosParaCarregar.push(...nomes);
        return this;
    }

    /**
     * Executa a consulta e retorna todos os registros encontrados.
     */
    async todos(): Promise<ObjetoDeleguaClasse[]> {
        const sql = this.gerarSql();
        const resultados = await this.tecnologia.executar(null, sql, []);
        if (resultados.length === 0 || resultados[0].linhasRetornadas.length === 0) {
            return [];
        }
        const registros = this.entidade.hidratarRegistros(resultados[0].linhasRetornadas);

        // Carregamento antecipado de relacionamentos
        if (this._relacionadosParaCarregar.length > 0) {
            await this.carregarRelacionados(registros);
        }

        return registros;
    }

    /**
     * Executa a consulta e retorna o primeiro registro ou null.
     */
    async primeiro(): Promise<ObjetoDeleguaClasse | null> {
        this._limite = 1;
        const resultados = await this.todos();
        return resultados.length > 0 ? resultados[0] : null;
    }

    /**
     * Executa a consulta e retorna a contagem de registros.
     */
    async contar(): Promise<number> {
        const colunasOriginais = this._colunas;
        this._colunas = ['COUNT(*) as contagem'];
        const sql = this.gerarSql();
        this._colunas = colunasOriginais;

        const resultados = await this.tecnologia.executar(null, sql, []);
        if (resultados.length === 0 || resultados[0].linhasRetornadas.length === 0) {
            return 0;
        }
        return resultados[0].linhasRetornadas[0].contagem || 0;
    }

    /**
     * Gera o SQL completo da consulta.
     */
    gerarSql(): string {
        const todasCondicoes = [...this._condicoes];
        const tudo = !this._colunasPersonalizadas && todasCondicoes.length === 0 && this._condicoesOu.length === 0;
        const comandoSelecionar = new Selecionar(
            -1,
            this._tabela,
            this._colunas,
            todasCondicoes,
            tudo,
            this._juncoes
        );

        let sql = this.tradutor.traduzir([comandoSelecionar]);

        // Adicionar condições OR manualmente
        if (this._condicoesOu.length > 0) {
            const partesOu = this._condicoesOu.map(grupo => {
                return grupo.map(c => this.traduzirCondicaoParaSql(c)).join(' AND ');
            });

            if (todasCondicoes.length > 0) {
                sql += '\nOR ' + partesOu.join('\nOR ');
            } else {
                // Se não há condições AND, precisamos adicionar WHERE
                if (!sql.includes('WHERE')) {
                    sql += '\nWHERE ' + partesOu.join('\nOR ');
                } else {
                    sql += '\nOR ' + partesOu.join('\nOR ');
                }
            }
        }

        // Adicionar ORDER BY
        if (this._ordenacoes.length > 0) {
            const ordenacoes = this._ordenacoes.map(o => `${o.coluna} ${o.direcao}`).join(', ');
            sql += `\nORDER BY ${ordenacoes}`;
        }

        // Adicionar LIMIT
        if (this._limite !== null) {
            sql += `\nLIMIT ${this._limite}`;
        }

        // Adicionar OFFSET
        if (this._deslocamento !== null) {
            sql += `\nOFFSET ${this._deslocamento}`;
        }

        return sql;
    }

    private criarCondicao(coluna: string, operador: OperadorCondicao, valor: any): Condicao {
        const tipoLiteral = typeof valor === 'number' ? 'INTEIRO' : 'TEXTO';
        return new Condicao(
            new ReferenciaColuna(coluna),
            operador,
            new Literal(valor, tipoLiteral)
        );
    }

    private traduzirCondicaoParaSql(condicao: Condicao): string {
        const operadores: { [key: string]: string } = {
            'IGUAL': '=',
            'MAIOR': '>',
            'MAIOR_IGUAL': '>=',
            'MENOR': '<',
            'MENOR_IGUAL': '<='
        };

        const esquerda = (condicao.esquerda as ReferenciaColuna).nomeColuna;
        const operador = operadores[condicao.operador] || '=';
        const direita = (condicao.direita as Literal).valor;
        const valorFormatado = typeof direita === 'string' ? `'${direita}'` : direita;

        return `${esquerda} ${operador} ${valorFormatado}`;
    }

    /**
     * Carrega relacionamentos de forma antecipada usando consultas separadas.
     */
    private async carregarRelacionados(registros: ObjetoDeleguaClasse[]): Promise<void> {
        if (registros.length === 0) return;

        const relacionamentos = this.entidade.obterRelacionamentos();

        for (const nomeRelacionamento of this._relacionadosParaCarregar) {
            const rel = relacionamentos.find(r => r.nomePropriedade === nomeRelacionamento);
            if (!rel) {
                throw new Error(
                    `Relacionamento '${nomeRelacionamento}' não encontrado na entidade '${this.entidade.obterNome()}'.`
                );
            }

            // Coletar valores da coluna de origem dos registros pai
            const valoresOrigem = registros
                .map(r => r.propriedades[rel.colunaOrigem])
                .filter(v => v !== undefined && v !== null);

            if (valoresOrigem.length === 0) continue;

            // Construir consulta para entidades relacionadas
            // Como lincones não tem operador IN, usamos múltiplos OR
            const valoresUnicos = Array.from(new Set(valoresOrigem));
            let sqlRelacionados = `SELECT * FROM ${rel.entidadeDestino} WHERE `;
            
            const condicoes = valoresUnicos.map(valor => {
                const valorFormatado = typeof valor === 'string' ? `'${valor}'` : valor;
                return `${rel.colunaDestino} = ${valorFormatado}`;
            });
            sqlRelacionados += condicoes.join(' OR ');

            const resultadosRelacionados = await this.tecnologia.executar(null, sqlRelacionados, []);
            
            if (resultadosRelacionados.length === 0 || resultadosRelacionados[0].linhasRetornadas.length === 0) {
                // Nenhum relacionado encontrado, inicializar vazios
                for (const registro of registros) {
                    if (rel.tipo === 'temMuitos') {
                        registro.propriedades[rel.nomePropriedade] = [];
                    } else {
                        registro.propriedades[rel.nomePropriedade] = null;
                    }
                }
                continue;
            }

            const linhasRelacionadas = resultadosRelacionados[0].linhasRetornadas;

            // Agrupar relacionados por valor da coluna de destino
            const relacionadosPorChave = new Map<any, any[]>();
            for (const linha of linhasRelacionadas) {
                const chave = linha[rel.colunaDestino];
                if (!relacionadosPorChave.has(chave)) {
                    relacionadosPorChave.set(chave, []);
                }
                relacionadosPorChave.get(chave)!.push(linha);
            }

            // Anexar aos registros pai
            for (const registro of registros) {
                const valorOrigem = registro.propriedades[rel.colunaOrigem];
                const relacionados = relacionadosPorChave.get(valorOrigem) || [];

                if (rel.tipo === 'temMuitos') {
                    registro.propriedades[rel.nomePropriedade] = relacionados;
                } else if (rel.tipo === 'temUm' || rel.tipo === 'pertenceA') {
                    registro.propriedades[rel.nomePropriedade] = relacionados.length > 0 ? relacionados[0] : null;
                }
            }
        }
    }
}
