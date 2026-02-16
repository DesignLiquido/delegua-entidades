import { DescritorTipoClasse, ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { ColunaEValor, Condicao, Criar } from "@designliquido/lincones-js";

import { RelacionamentoInterface } from "./relacionamento-interface";
import { MuitoParaMuitoInterface } from "./muito-para-muitos-interface";
import { PolimorficInterface } from "./polimorfico-interface";
import { IndiceInterface } from "./indice-interface";
import { RestricaoInterface } from "./restricao-interface";

export interface EntidadeInterface {
    modelo: DescritorTipoClasse;
    obterNome(): string;
    obterNomeChavePrimaria(): string;
    obterNomesChavesPrimarias(): string[];
    obterNomesColunas(): string[];
    obterRelacionamentos(): RelacionamentoInterface[];
    obterIndices(): IndiceInterface[];
    obterRestricoes(): RestricaoInterface[];
    obterMuitosParaMuitos(): MuitoParaMuitoInterface[];
    obterPolimorficos(): PolimorficInterface[];
    obterNomePropriedadeVersao(): string;
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
