export type TipoRelacionamento = 'temUm' | 'temMuitos' | 'pertenceA';

export interface RelacionamentoInterface {
    tipo: TipoRelacionamento;
    nomePropriedade: string;
    entidadeDestino: string;
    colunaOrigem: string;
    colunaDestino: string;
}
