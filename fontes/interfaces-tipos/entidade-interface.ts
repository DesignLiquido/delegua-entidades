import { DescritorTipoClasse, ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { ColunaEValor, Condicao, Criar } from "@designliquido/lincones-js";

import { RelacionamentoInterface } from "./relacionamento-interface";
import { IndiceInterface } from "./indice-interface";
import { RestriacaoInterface } from "./restricao-interface";

export interface EntidadeInterface {
    modelo: DescritorTipoClasse;
    obterNome(): string;
    obterNomeChavePrimaria(): string;
    obterNomesChavesPrimarias(): string[];
    obterNomesColunas(): string[];
    obterRelacionamentos(): RelacionamentoInterface[];
    obterIndices(): IndiceInterface[];
    obterRestricoes(): RestriacaoInterface[];
    obterNomeBancoDados(): string;
    obterNomeColunaExclusaoLogica(): string;
    possuiCriadoEm(): boolean;
    possuiAtualizadoEm(): boolean;
    possuiExclusaoLogica(): boolean;
    resolverValoresParaColunas(registro: ObjetoDeleguaClasse, colunas: string[]): any[];
    resolverColunasEValores(registro: ObjetoDeleguaClasse, colunas: string[]): ColunaEValor[];
    resolverCondicaoPorChavePrimaria(registro: ObjetoDeleguaClasse): Condicao;
    gerarComandoCriarTabela(): Criar;
    hidratarRegistro(linha: { [coluna: string]: any }): ObjetoDeleguaClasse;
    hidratarRegistros(linhas: any[]): ObjetoDeleguaClasse[];
}
