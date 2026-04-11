/**
 * Interface para opções de cache (L2).
 */
export interface OpcoesCacheL2 {
    /** Tempo de vida em milissegundos (TTL) */
    ttl?: number;
    /** Tamanho máximo do cache em número de registros */
    tamanhMaximo?: number;
}
