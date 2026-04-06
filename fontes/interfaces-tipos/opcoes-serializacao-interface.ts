/**
 * Opções de serialização para controlar o comportamento da conversão.
 */
export interface OpcoesSerializacao {
    /** Campos a incluir (se vazio, inclui todos) */
    incluir?: string[];
    /** Campos a excluir */
    excluir?: string[];
    /** Profundidade máxima para serializar relacionamentos (0 = apenas IDs) */
    profundidade?: number;
    /** Se deve incluir registros excluídos logicamente */
    incluirExcluidos?: boolean;
}