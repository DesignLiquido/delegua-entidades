import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

import { TransacaoInterface } from "./interfaces-tipos/transacao-interface";

/**
 * Interface para informações de savepoint.
 */
interface SavepointInfo {
    nome: string;
    criadoEm: Date;
}

/**
 * Implementação de transação de banco de dados com suporte a savepoints.
 * Mantém controle de operações realizadas durante a transação
 * e permite criar pontos de reversão parcial (savepoints).
 */
export class Transacao implements TransacaoInterface {
    private tecnologia: TecnologiaLinconesInterface;
    private operacoes: any[] = [];
    private ativa: boolean = true;
    private pontosConfirmacao: SavepointInfo[] = [];
    private nomeBancoDados: string = "padrão";

    constructor(tecnologia: TecnologiaLinconesInterface, nomeBancoDados: string = "padrão") {
        this.tecnologia = tecnologia;
        this.nomeBancoDados = nomeBancoDados;
    }

    /**
     * Define o banco de dados para gerar SQL correto.
     */
    definirBancoDados(nome: string): void {
        this.nomeBancoDados = nome;
    }

    /**
     * Registra uma operação na transação.
     * Internamente usada para rastrear mudanças.
     */
    registrarOperacao(comando: any): void {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }
        this.operacoes.push(comando);
    }

    /**
     * Retorna as operações registradas.
     */
    obterOperacoes(): any[] {
        return [...this.operacoes];
    }

    /**
     * Confirma a transação.
     * Todas as operações registradas são consideradas finais.
     */
    async confirmar(): Promise<void> {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }
        
        // Em um provedor real, isso executaria COMMIT no banco de dados
        // Por enquanto, apenas marcamos a transação como finalizada
        this.ativa = false;
        this.operacoes = [];
        this.pontosConfirmacao = [];
    }

    /**
     * Reverte a transação.
     * Todas as operações registradas são descartadas.
     */
    async reverter(): Promise<void> {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }

        // Em um provedor real, isso executaria ROLLBACK no banco de dados
        // Aqui apenas descartamos as operações registradas
        this.ativa = false;
        this.operacoes = [];
        this.pontosConfirmacao = [];
    }

    /**
     * Indica se a transação está ativa.
     */
    estaAtiva(): boolean {
        return this.ativa;
    }

    /**
     * Cria um savepoint com o nome especificado.
     * Permite reverter para este ponto sem descartar toda a transação.
     */
    async criarPontoDeConfirmacao(nome: string): Promise<void> {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }

        // Validar nome de ponto de confirmação
        if (!nome || nome.trim() === '') {
            throw new Error('Nome do ponto de confirmação não pode estar vazio');
        }

        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nome)) {
            throw new Error('Nome do ponto de confirmação contém caracteres inválidos. Use apenas letras, números e underscore');
        }

        // Verificar se ponto de confirmação já existe
        if (this.pontosConfirmacao.some(sp => sp.nome === nome)) {
            throw new Error(`Ponto de confirmação '${nome}' já existe`);
        }

        // Gerar SQL do ponto de confirmação
        const sql = this.gerarSQLPontoDeConfirmacao(nome);

        // Registrar ponto de confirmação
        this.pontosConfirmacao.push({
            nome: nome,
            criadoEm: new Date()
        });

        // Em um provedor real, executaria o SQL
        // Por enquanto, apenas simulamos
        this.registrarOperacao({
            tipo: 'PONTO_DE_CONFIRMACAO',
            nome: nome,
            sql: sql,
            timestamp: new Date()
        });
    }

    /**
     * Reverte a transação para um ponto de confirmação anterior.
     */
    async reverterParaPontoDeConfirmacao(nome: string): Promise<void> {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }

        // Verificar se ponto de confirmação existe
        const indice = this.pontosConfirmacao.findIndex(sp => sp.nome === nome);
        if (indice === -1) {
            throw new Error(`Ponto de confirmação '${nome}' não existe`);
        }

        // Gerar SQL de reversão
        const sql = this.gerarSQLReversaoPontoDeConfirmacao(nome);

        // Remover pontos de confirmação posteriores (não incluindo o ponto de confirmação revertido)
        const pontosRemovidos = this.pontosConfirmacao.splice(indice + 1);

        // Registrar operação
        this.registrarOperacao({
            tipo: 'ROLLBACK_SAVEPOINT',
            nome: nome,
            sql: sql,
            pontosRemovidos: pontosRemovidos.map(sp => sp.nome),
            timestamp: new Date()
        });
    }

    /**
     * Libera (remove) um ponto de confirmação criado anteriormente.
     */
    async liberarPontoDeConfirmacao(nome: string): Promise<void> {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }

        // Verificar se ponto de confirmação existe
        const indice = this.pontosConfirmacao.findIndex(sp => sp.nome === nome);
        if (indice === -1) {
            throw new Error(`Ponto de confirmação '${nome}' não existe`);
        }

        // Gerar SQL de liberação
        const sql = this.gerarSQLLiberacaoPontoDeConfirmacao(nome);

        // Remover ponto de confirmação
        this.pontosConfirmacao.splice(indice, 1);

        // Registrar operação
        this.registrarOperacao({
            tipo: 'RELEASE_SAVEPOINT',
            nome: nome,
            sql: sql,
            timestamp: new Date()
        });
    }

    /**
     * Obtém lista de savepoints ativos.
     */
    obterPontosDeConfirmacao(): string[] {
        return this.pontosConfirmacao.map(sp => sp.nome);
    }

    /**
     * Gera SQL de criação de ponto de confirmação apropriado para o banco de dados.
     */
    private gerarSQLPontoDeConfirmacao(nome: string): string {
        // Todos os bancos suportados usam SAVEPOINT <name>
        return `SAVEPOINT ${this.escaparNomePontoDeConfirmacao(nome)}`;
    }

    /**
     * Gera SQL de reversão para um ponto de confirmação apropriado para o banco de dados.
     */
    private gerarSQLReversaoPontoDeConfirmacao(nome: string): string {
        const nomeSafepoint = this.escaparNomePontoDeConfirmacao(nome);

        switch (this.detectorBancoDados()) {
            case 'sqlserver':
                // SQL Server usa ROLLBACK TRANSACTION
                return `ROLLBACK TRANSACTION ${nomeSafepoint}`;
            case 'mysql':
                // MySQL usa ROLLBACK TO SAVEPOINT
                return `ROLLBACK TO SAVEPOINT ${nomeSafepoint}`;
            case 'postgresql':
            case 'sqlite':
            default:
                // PostgreSQL e SQLite usam ROLLBACK TO
                return `ROLLBACK TO ${nomeSafepoint}`;
        }
    }

    /**
     * Gera SQL de liberação de ponto de confirmação apropriado para o banco de dados.
     */
    private gerarSQLLiberacaoPontoDeConfirmacao(nome: string): string {
        const nomeSafepoint = this.escaparNomePontoDeConfirmacao(nome);

        switch (this.detectorBancoDados()) {
            case 'sqlserver':
                // SQL Server não possui RELEASE, apenas Remove no ROLLBACK
                return ''; // Sem operação necessária
            case 'mysql':
                // MySQL usa RELEASE SAVEPOINT
                return `RELEASE SAVEPOINT ${nomeSafepoint}`;
            case 'postgresql':
                // PostgreSQL usa RELEASE SAVEPOINT
                return `RELEASE SAVEPOINT ${nomeSafepoint}`;
            case 'sqlite':
            default:
                // SQLite usa RELEASE
                return `RELEASE ${nomeSafepoint}`;
        }
    }

    /**
     * Detecta o tipo de banco de dados para gerar SQL apropriado.
     */
    private detectorBancoDados(): string {
        if (!this.nomeBancoDados) return 'sqlite';

        const nomeLowercase = this.nomeBancoDados.toLowerCase();

        if (nomeLowercase.includes('sql server') || nomeLowercase === 'sqlserver') {
            return 'sqlserver';
        }
        if (nomeLowercase.includes('mysql')) {
            return 'mysql';
        }
        if (nomeLowercase.includes('postgres') || nomeLowercase === 'postgresql') {
            return 'postgresql';
        }
        if (nomeLowercase.includes('sqlite')) {
            return 'sqlite';
        }

        return 'sqlite'; // default
    }

    /**
     * Escapa nome do savepoint para uso em SQL.
     * Adiciona backticks ou aspas conforme necessário.
     */
    private escaparNomePontoDeConfirmacao(nome: string): string {
        // Validação já foi feita em criarPontoDeConfirmacao
        // Adicionar backticks para segurança extra (funciona em maioria dos BDs)
        return `\`${nome}\``;
    }
}
