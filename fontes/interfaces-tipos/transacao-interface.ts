/**
 * Interface para transações de banco de dados.
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
}
