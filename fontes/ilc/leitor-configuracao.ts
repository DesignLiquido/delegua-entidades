/// <reference types="node" />
import fs from "fs";
import path from "path";

import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

const NOME_ARQUIVO_CONFIGURACAO = "configuracao.delprops";

export interface ConfiguracaoConexao {
    tecnologia?: string;
    caminho?: string;
    host?: string;
    porta?: number;
    usuario?: string;
    senha?: string;
    banco?: string;
    desenvolvimento?: boolean;
}

export interface ConfiguracaoDelprops {
    dados: { [nomeConexao: string]: ConfiguracaoConexao };
}

function analisarValor(valorBruto: string): string | number | boolean {
    const aparado = valorBruto.trim();

    // Texto entre aspas simples ou duplas
    if (
        (aparado.startsWith("'") && aparado.endsWith("'")) ||
        (aparado.startsWith("\"") && aparado.endsWith("\""))
    ) {
        return aparado.slice(1, -1);
    }

    // Booleanos em português
    if (aparado === "verdadeiro") return true;
    if (aparado === "falso") return false;

    // Número
    const numero = Number(aparado);
    if (!isNaN(numero) && aparado !== "") return numero;

    return aparado;
}

/**
 * Lê e analisa o arquivo `configuracao.delprops` no diretório informado.
 * Retorna `null` se o arquivo não existir.
 */
export function lerConfiguracaoDelprops(diretorio: string = process.cwd()): ConfiguracaoDelprops | null {
    const caminhoArquivo = path.join(diretorio, NOME_ARQUIVO_CONFIGURACAO);

    if (!fs.existsSync(caminhoArquivo)) {
        return null;
    }

    const configuracao: ConfiguracaoDelprops = { dados: {} };
    const linhas = fs.readFileSync(caminhoArquivo, "utf-8").split(/\r?\n/);

    for (const linha of linhas) {
        const aparada = linha.trim();

        // Ignorar linhas vazias e comentários
        if (!aparada || aparada.startsWith("//")) continue;

        const indiceSeparador = aparada.indexOf("=");
        if (indiceSeparador === -1) continue;

        const chave = aparada.slice(0, indiceSeparador).trim();
        const valorBruto = aparada.slice(indiceSeparador + 1).trim();
        const valor = analisarValor(valorBruto);

        // Formato obrigatório: `dados.<conexao>.<propriedade>` (ex: `dados.padrao.tecnologia`).
        const partes = chave.split(".");
        if (partes[0] !== "dados" || partes.length < 3) continue;

        const nomeConexao = partes[1];
        const propriedade = partes[2];

        if (!configuracao.dados[nomeConexao]) {
            configuracao.dados[nomeConexao] = {};
        }

        (configuracao.dados[nomeConexao] as Record<string, unknown>)[propriedade] = valor;
    }

    return configuracao;
}

/**
 * Mapeia o nome da tecnologia ao pacote npm correspondente.
 */
function resolverNomePacote(tecnologia: string): string {
    const mapeamento: Record<string, string> = {
        sqlite: "@designliquido/lincones-sqlite",
        postgresql: "@designliquido/lincones-postgresql",
        postgres: "@designliquido/lincones-postgresql",
        mysql: "@designliquido/lincones-mysql",
        mssql: "@designliquido/lincones-mssql",
        mongodb: "@designliquido/lincones-mongodb",
    };

    return mapeamento[tecnologia.toLowerCase()] ?? `@designliquido/lincones-${tecnologia.toLowerCase()}`;
}

/**
 * Instancia o adaptador de tecnologia correspondente à configuração de conexão informada.
 * Retorna `null` se o pacote do adaptador não estiver instalado ou se a tecnologia não for especificada.
 */
export function instanciarAdaptador(configuracaoConexao: ConfiguracaoConexao): TecnologiaLinconesInterface | null {
    const tecnologia = configuracaoConexao.tecnologia ?? "sqlite";
    const nomePacote = resolverNomePacote(tecnologia);

    let moduloAdaptador: Record<string, unknown>;
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        moduloAdaptador = require(nomePacote) as Record<string, unknown>;
    } catch {
        console.error(
            `Adaptador '${nomePacote}' não encontrado. Instale com: yarn add ${nomePacote}`
        );
        return null;
    }

    // Tentar exportação padrão ou primeira exportação nomeada
    const Construtor =
        (moduloAdaptador.default as new (config: ConfiguracaoConexao) => TecnologiaLinconesInterface) ??
        (moduloAdaptador[Object.keys(moduloAdaptador)[0]] as new (config: ConfiguracaoConexao) => TecnologiaLinconesInterface);

    if (!Construtor || typeof Construtor !== "function") {
        console.error(`Não foi possível encontrar o construtor no pacote '${nomePacote}'.`);
        return null;
    }

    return new Construtor(configuracaoConexao);
}

/**
 * Lê `configuracao.delprops` e retorna o adaptador para a primeira conexão configurada em
 * `dados`. Retorna `null` se o arquivo não existir ou o adaptador não puder ser
 * instanciado.
 */
export function obterAdaptadorPadrao(diretorio: string = process.cwd()): TecnologiaLinconesInterface | null {
    const configuracao = lerConfiguracaoDelprops(diretorio);
    if (!configuracao) return null;

    const nomesConexao = Object.keys(configuracao.dados);
    if (nomesConexao.length === 0) {
        console.error("Nenhuma conexão de dados encontrada em configuracao.delprops.");
        return null;
    }

    // Usar a primeira conexão como padrão
    const conexaoPadrao = configuracao.dados[nomesConexao[0]];
    return instanciarAdaptador(conexaoPadrao);
}
