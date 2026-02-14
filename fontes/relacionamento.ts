import { AcaoCascata, RelacionamentoInterface, TipoRelacionamento } from "./interfaces-tipos/relacionamento-interface";

export class Relacionamento implements RelacionamentoInterface {
    tipo: TipoRelacionamento;
    nomePropriedade: string;
    entidadeDestino: string;
    colunaOrigem: string;
    colunaDestino: string;
    cascata?: AcaoCascata[];

    constructor(
        tipo: TipoRelacionamento,
        nomePropriedade: string,
        entidadeDestino: string,
        colunaOrigem: string,
        colunaDestino: string,
        cascata?: AcaoCascata[]
    ) {
        this.tipo = tipo;
        this.nomePropriedade = nomePropriedade;
        this.entidadeDestino = entidadeDestino;
        this.colunaOrigem = colunaOrigem;
        this.colunaDestino = colunaDestino;
        this.cascata = cascata;
    }
}
