/**
 * Interface para relacionamentos polimórficos.
 * Um relacionamento polimórfico permite que uma entidade se relacione com múltiplos tipos de entidades
 * através de duas colunas: uma para armazenar o tipo e outra para armazenar o ID.
 * 
 * @example
 * ```typescript
 * // Comentários podem estar associados a Postagens ou Vídeos
 * interface PolimorficoInterface {
 *     tipo: 'polimorfico';
 *     nomePropriedade: 'comentavel';
 *     colunaTipo: 'comentavel_tipo';
 *     colunaId: 'comentavel_id';
 *     entidadesPossiveis: ['Postagem', 'Video'];
 * }
 * ```
 */
export interface PolimorficoInterface {
    /** Tipo de relacionamento */
    tipo: 'polimorfico';
    
    /** Nome da propriedade na entidade filha */
    nomePropriedade: string;
    
    /** Nome da coluna que armazena o tipo da entidade pai */
    colunaTipo: string;
    
    /** Nome da coluna que armazena o ID da entidade pai */
    colunaId: string;
    
    /** Lista de nomes de entidades que podem ser a entidade pai */
    entidadesPossiveis: string[];
    
    /** Se deve deletar quanto remover a entidade pai */
    deletarAoRemover?: boolean;
}
