import { DescritorTipoClasse } from "@designliquido/delegua/estruturas";
import { Colecao } from "./colecao";
import { EntidadeInterface } from "./interfaces/entidade-interface";

/**
 * O contexto de entidades é usado para manter todas as entidades e seus relacionamentos
 * em um só lugar.
 */
export class ContextoEntidades {
    colecoes: {[key: string]: Colecao<EntidadeInterface>};

    constructor() {
        this.colecoes = {};
    }

    colecao(tipoModelo: DescritorTipoClasse): Colecao<EntidadeInterface> {
        return this.colecoes[tipoModelo.simboloOriginal.lexema];
    }
}
