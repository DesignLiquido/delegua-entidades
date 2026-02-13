import { DescritorTipoClasse } from "@designliquido/delegua/interpretador/estruturas";
import { Colecao } from "./colecao";
import { Entidade } from "./entidade";
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

    registrarColecao(entidade: EntidadeInterface): Colecao<EntidadeInterface> {
        const nome = entidade.obterNome();
        const colecao = new Colecao(entidade);
        this.colecoes[nome] = colecao;
        return colecao;
    }

    colecao(tipoModelo: DescritorTipoClasse): Colecao<EntidadeInterface> {
        const nome = tipoModelo.simboloOriginal.lexema;
        if (!this.colecoes[nome]) {
            const entidade = new Entidade(tipoModelo);
            this.registrarColecao(entidade);
        }

        return this.colecoes[nome];
    }
}
