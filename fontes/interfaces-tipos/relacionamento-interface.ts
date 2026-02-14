export type TipoRelacionamento = 'temUm' | 'temMuitos' | 'pertenceA';

export type AcaoCascata = 'inserir' | 'atualizar' | 'excluir';

export interface RelacionamentoInterface {
    tipo: TipoRelacionamento;
    nomePropriedade: string;
    entidadeDestino: string;
    colunaOrigem: string;
    colunaDestino: string;
    cascata?: AcaoCascata[];
}
