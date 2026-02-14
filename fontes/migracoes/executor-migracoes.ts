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
        }
    }
}
