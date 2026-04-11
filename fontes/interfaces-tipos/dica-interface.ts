export enum TipoDica {
    INDICE_AUSENTE = "INDICE_AUSENTE",
    N_MAIS_1 = "N_MAIS_1",
    SELECAO_DESNECESSARIA = "SELECAO_DESNECESSARIA",
    JUNCAO_REDUNDANTE = "JUNCAO_REDUNDANTE",
    PAGINACAO_FALTANTE = "PAGINACAO_FALTANTE",
    ORDEM_INEFICIENTE = "ORDEM_INEFICIENTE",
    USAR_CARGA_ANTECIPADA = "USAR_CARGA_ANTECIPADA",
    USAR_CARGA_EM_LOTE = "USAR_CARGA_EM_LOTE",
    CACHE_RECOMENDADA = "CACHE_RECOMENDADA"
}

export enum NivelSeveridade {
    CRITICO = "CRITICO",
    ALTO = "ALTO",
    MEDIO = "MEDIO",
    BAIXO = "BAIXO",
    INFO = "INFO"
}

export interface DicaInterface {
    tipo: TipoDica;
    severidade: NivelSeveridade;
    mensagem: string;
    sugestao: string;
    metrica?: {
        nome: string;
        valor: number;
        unidade: string;
    };
}
