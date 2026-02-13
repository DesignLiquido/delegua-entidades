import { DescritorTipoClasse, ObjetoDeleguaClasse } from "@designliquido/delegua/estruturas";
import { ColunaEValor, Condicao } from "@designliquido/lincones-js";

export interface EntidadeInterface {
    modelo: DescritorTipoClasse;
    obterNome(): string;
    obterNomeChavePrimaria(): string;
    obterNomesColunas(): string[];
    resolverValoresParaColunas(registro: ObjetoDeleguaClasse, colunas: string[]): any[];
    resolverColunasEValores(registro: ObjetoDeleguaClasse, colunas: string[]): ColunaEValor[];
    resolverCondicaoPorChavePrimaria(registro: ObjetoDeleguaClasse): Condicao;
}
