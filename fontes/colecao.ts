import { Selecionar, Condicao, ReferenciaColuna, Literal, Inserir, Atualizar, Excluir } from "@designliquido/lincones-js";
import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EntidadeInterface } from "./interfaces/entidade-interface";

export class Colecao<TEntidade extends EntidadeInterface> {
    tipoEntidade: TEntidade;

    constructor(tipoEntidade: TEntidade) {
        this.tipoEntidade = tipoEntidade;
    }

    todos(): Selecionar {
        return new Selecionar(
            -1, 
            this.tipoEntidade.obterNome(), 
            this.tipoEntidade.obterNomesColunas(), 
            [], 
            true
        );
    }

    obterPorId(valorId: any): Selecionar {
        const colunaChavePrimaria = this.tipoEntidade.obterNomeChavePrimaria();
        return new Selecionar(
            -1, 
            this.tipoEntidade.obterNome(), 
            this.tipoEntidade.obterNomesColunas(),
            [new Condicao(
                new ReferenciaColuna(colunaChavePrimaria),
                'IGUAL',
                new Literal(valorId, "INTEIRO")
            )], 
            false
        );
    }

    inserir(registro: ObjetoDeleguaClasse): Inserir {
        const nomesColunas = this.tipoEntidade.obterNomesColunas();
        const valoresColunas = this.tipoEntidade.resolverValoresParaColunas(registro, nomesColunas);
        return new Inserir(-1, "Tabela", nomesColunas, valoresColunas);
    }

    atualizar(registro: ObjetoDeleguaClasse, colunas: string[] = []): Atualizar {
        let colunasAtualizacao = colunas;
        if (colunasAtualizacao.length === 0) {
            colunasAtualizacao = this.tipoEntidade.obterNomesColunas();
        }

        const colunasEValores = this.tipoEntidade.resolverColunasEValores(registro, colunas);
        return new Atualizar(-1, "Tabela", colunasEValores, []);
    }

    excluir(registro: ObjetoDeleguaClasse): Excluir {
        return new Excluir(-1, "Tabela", []);
    }
}