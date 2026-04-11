/**
 * Interface para opções de cache (L2).
 */
export interface OpcoesCacheL2Interface {
    /** Tempo de vida em milissegundos (TTL) */
    ttl?: number;
    /** Tamanho máximo do cache em número de registros */
    tamanhMaximo?: number;
}
