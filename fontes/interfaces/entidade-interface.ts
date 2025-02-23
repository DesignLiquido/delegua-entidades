import { DescritorTipoClasse, ObjetoDeleguaClasse } from "@designliquido/delegua/estruturas";

export interface EntidadeInterface {
    modelo: DescritorTipoClasse;
    obterNome(): string;
    obterNomeChavePrimaria(): string;
    obterNomesColunas(): string[];
    resolverValoresParaColunas(registro: ObjetoDeleguaClasse, colunas: string[]): any[];
}
