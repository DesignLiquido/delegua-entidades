import { Criar, Alterar, RemoverEntidade, TecnologiaLinconesInterface, OperacaoAlteracaoTabela } from "@designliquido/lincones-js";

import { Taquigrafo } from "../taquigrafia";
import { Migracao, OperacaoMigracao } from "./migracao";

export class ExecutorMigracoes {
    private tecnologia: TecnologiaLinconesInterface;
    private logger?: Taquigrafo;

    constructor(tecnologia: TecnologiaLinconesInterface, logger?: Taquigrafo) {
        this.tecnologia = tecnologia;
        this.logger = logger;
    }

    async executar(migracao: Migracao): Promise<void> {
        this.logger?.info(`Executando migração ${migracao.versao}: ${migracao.descricao}`);
        const inicio = Date.now();

        for (const operacao of migracao.operacoes) {
            await this.executarOperacao(operacao);
        }

        const duracao = Date.now() - inicio;
        this.logger?.info(`Migração ${migracao.versao} concluída em ${duracao}ms`);
    }

    async executarTodas(migracoes: Migracao[]): Promise<void> {
        this.logger?.info(`Executando ${migracoes.length} migração(ões)`);

        for (const migracao of migracoes) {
            await this.executar(migracao);
        }

        this.logger?.info(`Todas as migrações concluídas`);
    }

    async reverter(migracao: Migracao): Promise<void> {
        this.logger?.info(`Revertendo migração ${migracao.versao}: ${migracao.descricao}`);
        const inicio = Date.now();

        const operacoesReversas = [...migracao.operacoes].reverse().map((operacao) => {
            return this.obterOperacaoReversa(operacao);
        });

        for (const operacao of operacoesReversas) {
            await this.executarOperacao(operacao);
        }

        const duracao = Date.now() - inicio;
        this.logger?.info(`Reversão ${migracao.versao} concluída em ${duracao}ms`);
    }

    private async executarOperacao(operacao: OperacaoMigracao): Promise<void> {
        switch (operacao.tipo) {
            case 'criarTabela': {
                this.logger?.depuracao(`Criando tabela ${operacao.tabela}`);
                const comando = new Criar(-1, operacao.tabela, operacao.colunas, true);
                await this.tecnologia.executarComando(comando);
                break;
            }
            case 'excluirTabela': {
                this.logger?.depuracao(`Excluindo tabela ${operacao.tabela}`);
                const comando = new RemoverEntidade(-1, operacao.tabela, 'TABELA');
                await this.tecnologia.executarComando(comando);
                break;
            }
            case 'adicionarColuna': {
                this.logger?.depuracao(`Adicionando coluna em ${operacao.tabela}`);
                const op = new OperacaoAlteracaoTabela('ADICIONAR', operacao.coluna);
                const comando = new Alterar(-1, operacao.tabela, 'TABELA', [op]);
                await this.tecnologia.executarComando(comando);
                break;
            }
            case 'alterarColuna': {
                this.logger?.depuracao(`Alterando coluna em ${operacao.tabela}`);
                const op = new OperacaoAlteracaoTabela('ALTERAR', operacao.coluna);
                const comando = new Alterar(-1, operacao.tabela, 'TABELA', [op]);
                await this.tecnologia.executarComando(comando);
                break;
            }
            case 'removerColuna': {
                this.logger?.depuracao(`Removendo coluna ${operacao.nomeColuna} de ${operacao.tabela}`);
                const sql = `ALTER TABLE ${operacao.tabela} DROP COLUMN ${operacao.nomeColuna}`;
                await this.tecnologia.executar(null, sql, []);
                break;
            }
            case 'adicionarIndice': {
                this.logger?.depuracao(`Adicionando índice ${operacao.nomeIndice} em ${operacao.tabela}`);
                if (!operacao.columnasIndice || operacao.columnasIndice.length === 0) {
                    throw new Error(`Índice '${operacao.nomeIndice}' precisa de colunas para criação.`);
                }
                const colunas = operacao.columnasIndice.join(', ');
                const unico = operacao.unico ? 'UNIQUE ' : '';
                const tipo = operacao.tipoIndice ? ` USING ${operacao.tipoIndice}` : '';
                const sql = `CREATE ${unico}INDEX ${operacao.nomeIndice} ON ${operacao.tabela}${tipo} (${colunas})`;
                await this.tecnologia.executar(null, sql, []);
                break;
            }
            case 'removerIndice': {
                this.logger?.depuracao(`Removendo índice ${operacao.nomeIndice} em ${operacao.tabela}`);
                const sql = `DROP INDEX ${operacao.nomeIndice}`;
                await this.tecnologia.executar(null, sql, []);
                break;
            }
            case 'adicionarRestricao': {
                this.logger?.depuracao(`Adicionando restrição ${operacao.nomeRestricao} em ${operacao.tabela}`);
                if (!operacao.sqlRestricao) {
                    throw new Error(`Restrição '${operacao.nomeRestricao}' precisa de SQL para criação.`);
                }
                const sql = `ALTER TABLE ${operacao.tabela} ADD CONSTRAINT ${operacao.nomeRestricao} CHECK (${operacao.sqlRestricao})`;
                await this.tecnologia.executar(null, sql, []);
                break;
            }
            case 'removerRestricao': {
                this.logger?.depuracao(`Removendo restrição ${operacao.nomeRestricao} em ${operacao.tabela}`);
                const sql = `ALTER TABLE ${operacao.tabela} DROP CONSTRAINT ${operacao.nomeRestricao}`;
                await this.tecnologia.executar(null, sql, []);
                break;
            }
            case 'adicionarColunaComputada': {
                this.logger?.depuracao(`Adicionando coluna computada ${operacao.nomeColuna} em ${operacao.tabela}`);
                if (!operacao.nomeColuna || !operacao.tipoColuna || !operacao.expressaoColuna) {
                    throw new Error(`Coluna computada precisa de nome, tipo e expressao.`);
                }
                const sufixoPersistencia = operacao.persistida === true
                    ? ' STORED'
                    : (operacao.persistida === false ? ' VIRTUAL' : '');
                const sql = `ALTER TABLE ${operacao.tabela} ADD COLUMN ${operacao.nomeColuna} ${operacao.tipoColuna} GENERATED ALWAYS AS (${operacao.expressaoColuna})${sufixoPersistencia}`;
                await this.tecnologia.executar(null, sql, []);
                break;
            }
        }
    }

    private obterOperacaoReversa(operacao: OperacaoMigracao): OperacaoMigracao {
        switch (operacao.tipo) {
            case 'criarTabela':
                return { tipo: 'excluirTabela', tabela: operacao.tabela, colunas: operacao.colunas };
            case 'excluirTabela':
                if (!operacao.colunas || operacao.colunas.length === 0) {
                    throw new Error(`Não é possível reverter exclusão da tabela '${operacao.tabela}' sem colunas.`);
                }
                return { tipo: 'criarTabela', tabela: operacao.tabela, colunas: operacao.colunas };
            case 'adicionarColuna':
                if (!operacao.coluna?.nomeColuna) {
                    throw new Error(`Não é possível reverter adição de coluna em '${operacao.tabela}' sem coluna.`);
                }
                return { tipo: 'removerColuna', tabela: operacao.tabela, nomeColuna: operacao.coluna.nomeColuna };
            case 'removerColuna':
                if (!operacao.colunaAnterior) {
                    throw new Error(`Não é possível reverter remoção da coluna '${operacao.nomeColuna}' sem colunaAnterior.`);
                }
                return { tipo: 'adicionarColuna', tabela: operacao.tabela, coluna: operacao.colunaAnterior };
            case 'alterarColuna':
                if (!operacao.colunaAnterior) {
                    throw new Error(`Não é possível reverter alteração da coluna '${operacao.coluna?.nomeColuna}' sem colunaAnterior.`);
                }
                return { tipo: 'alterarColuna', tabela: operacao.tabela, coluna: operacao.colunaAnterior };
            case 'adicionarIndice':
                return { tipo: 'removerIndice', tabela: operacao.tabela, nomeIndice: operacao.nomeIndice };
            case 'removerIndice':
                if (!operacao.columnasIndice || operacao.columnasIndice.length === 0) {
                    throw new Error(`Não é possível reverter remoção do índice '${operacao.nomeIndice}' sem colunas.`);
                }
                return {
                    tipo: 'adicionarIndice',
                    tabela: operacao.tabela,
                    nomeIndice: operacao.nomeIndice,
                    columnasIndice: operacao.columnasIndice,
                    unico: operacao.unico,
                    tipoIndice: operacao.tipoIndice
                };
            case 'adicionarRestricao':
                return { tipo: 'removerRestricao', tabela: operacao.tabela, nomeRestricao: operacao.nomeRestricao };
            case 'removerRestricao':
                if (!operacao.sqlRestricao) {
                    throw new Error(`Não é possível reverter remoção da restrição '${operacao.nomeRestricao}' sem SQL.`);
                }
                return {
                    tipo: 'adicionarRestricao',
                    tabela: operacao.tabela,
                    nomeRestricao: operacao.nomeRestricao,
                    sqlRestricao: operacao.sqlRestricao
                };
            case 'adicionarColunaComputada':
                return { tipo: 'removerColuna', tabela: operacao.tabela, nomeColuna: operacao.nomeColuna };
            default:
                throw new Error(`Tipo de operação de migração não suportado: ${operacao.tipo}`);
        }
    }
}
