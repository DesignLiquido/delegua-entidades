import { DescritorTipoClasse, ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { ColunaEValor, Condicao, Criar } from "@designliquido/lincones-js";

export interface EntidadeInterface {
    modelo: DescritorTipoClasse;
    obterNome(): string;
    obterNomeChavePrimaria(): string;
    obterNomesColunas(): string[];
    resolverValoresParaColunas(registro: ObjetoDeleguaClasse, colunas: string[]): any[];
    resolverColunasEValores(registro: ObjetoDeleguaClasse, colunas: string[]): ColunaEValor[];
    resolverCondicaoPorChavePrimaria(registro: ObjetoDeleguaClasse): Condicao;
    gerarComandoCriarTabela(): Criar;
    hidratarRegistro(linha: { [coluna: string]: any }): ObjetoDeleguaClasse;
    hidratarRegistros(linhas: any[]): ObjetoDeleguaClasse[];
}
