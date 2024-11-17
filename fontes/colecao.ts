import { Selecionar } from "@designliquido/lincones-js";
import { EntidadeInterface } from "./interfaces/entidade-interface";

export class Colecao<TEntidade extends EntidadeInterface> {
    tipoEntidade: TEntidade;

    constructor(tipoEntidade: TEntidade) {
        this.tipoEntidade = tipoEntidade;
    }

    todos(): Selecionar {
        return new Selecionar(-1, this.tipoEntidade.obterNome(), [], [], true);
    }

    obterPorId(): Selecionar {
        return new Selecionar(-1, this.tipoEntidade.obterNome(), [], [
            
        ], false);
    }
}