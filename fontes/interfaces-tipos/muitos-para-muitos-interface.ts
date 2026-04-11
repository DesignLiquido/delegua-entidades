/**
 * Interface para relacionamentos muitos-para-muitos (many-to-many).
 * Define a estrutura de uma tabela intermediária e seus relacionamentos.
 * 
 * @example
 * ```typescript
 * interface MuitosParaMuitosInterface {
 *     tipo: 'muitoParaMuitos';
 *     nomePropriedade: 'papeis';
 *     entidadeDestino: 'Papel';
 *     tabelaIntermediaria: 'usuario_papeis';
 *     colunaOrigem: 'usuario_id';
 *     colunaDestino: 'papel_id';
 * }
 * ```
 */
export interface MuitosParaMuitosInterface {
    /** Tipo de relacionamento */
    tipo: 'muitoParaMuitos';
    
    /** Nome da propriedade na entidade origem */
    nomePropriedade: string;
    
    /** Nome da entidade de destino */
    entidadeDestino: string;
    
    /** Nome da tabela intermediária */
    tabelaIntermediaria: string;
    
    /** Nome da coluna que referencia a entidade origem */
    colunaOrigem: string;
    
    /** Nome da coluna que referencia a entidade destino */
    colunaDestino: string;
    
    /** Se deve deletar a entidade quando remover do relacionamento */
    deletarAoRemover?: boolean;
}
