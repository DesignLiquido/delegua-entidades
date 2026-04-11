import { DescritorTipoClasse, ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { ColunaEValor, Condicao, Criar } from "@designliquido/lincones-js";

import { RelacionamentoInterface } from "./relacionamento-interface";
import { MuitosParaMuitosInterface } from "./muitos-para-muitos-interface";
import { PolimorficoInterface } from "./polimorfico-interface";
import { IndiceInterface } from "./indice-interface";
import { RestricaoInterface } from "./restricao-interface";
import { ColunaComputadaInterface } from "./coluna-computada-interface";

export interface EntidadeInterface {
    modelo: DescritorTipoClasse | undefined;
    obterNome(): string;
    obterNomeChavePrimaria(): string;
    obterNomesChavesPrimarias(): string[];
    obterNomesColunas(): string[];
    obterRelacionamentos(): RelacionamentoInterface[];
    obterIndices(): IndiceInterface[];
    obterRestricoes(): RestricaoInterface[];
    obterColunasComputadas(): ColunaComputadaInterface[];
    obterMuitosParaMuitos(): MuitosParaMuitosInterface[];
    obterPolimorficos(): PolimorficoInterface[];
    obterNomePropriedadeVersao(): string;
    obterNomeBancoDados(): string;
    obterNomeColunaExclusaoLogica(): string;
    obterNomesColunasPersistentes(): string[];
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
