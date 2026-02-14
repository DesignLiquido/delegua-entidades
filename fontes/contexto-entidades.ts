import { DescritorTipoClasse } from "@designliquido/delegua/interpretador/estruturas";
import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

import { Colecao } from "./colecao";
import { Entidade } from "./entidade";
import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";

/**
 * O contexto de entidades é usado para manter todas as entidades e seus relacionamentos
 * em um só lugar.
 */
export class ContextoEntidades {
    tecnologia: TecnologiaLinconesInterface;
    colecoes: {[key: string]: Colecao<EntidadeInterface>};

    constructor(tecnologia: TecnologiaLinconesInterface) {
        this.tecnologia = tecnologia;
        this.colecoes = {};
    }

    registrarColecao(entidade: EntidadeInterface): Colecao<EntidadeInterface> {
        const nome = entidade.obterNome();
        const colecao = new Colecao(entidade, this.tecnologia);
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

    async iniciar(caminho: string): Promise<void> {
        await this.tecnologia.iniciar(caminho);
        for (const nome in this.colecoes) {
            const criar = this.colecoes[nome].tipoEntidade.gerarComandoCriarTabela();
            await this.tecnologia.executarComando(criar);
        }
    }
}
