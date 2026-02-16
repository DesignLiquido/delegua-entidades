/**
 * Interface para transações de banco de dados com suporte a savepoints.
 */
export interface TransacaoInterface {
    /**
     * Confirma a transação.
     */
    confirmar(): Promise<void>;

    /**
     * Reverte a transação.
     */
    reverter(): Promise<void>;

    /**
     * Indica se a transação está ativa.
     */
    estaAtiva(): boolean;

    /**
     * Cria um savepoint com o nome especificado.
     * Permite reverter para este ponto sem descartar toda a transação.
     */
    criarPontoDeConfirmacao(nome: string): Promise<void>;

    /**
     * Reverte a transação para um ponto de confirmação anterior.
     */
    reverterParaPontoDeConfirmacao(nome: string): Promise<void>;

    /**
     * Libera (remove) um ponto de confirmação criado anteriormente.
     */
    liberarPontoDeConfirmacao(nome: string): Promise<void>;

    /**
     * Obtém lista de pontos de confirmação ativos.
     */
    obterPontosDeConfirmacao(): string[];
}
