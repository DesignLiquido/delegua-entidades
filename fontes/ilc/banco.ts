#!/usr/bin/env node
/// <reference types="node" />

/**
 * CLI para Banco de Dados
 *
 * Uso:
 *   delegua-entidades banco <comando>
 *
 * Comandos:
 *   inicializar   Cria todas as tabelas dos modelos sem usar migrações
 *   eliminar      Apaga todas as tabelas (requer dados.padrao.desenvolvimento = verdadeiro)
 *
 * Exemplos:
 *   delegua-entidades banco inicializar
 *   delegua-entidades banco eliminar
 */

import caminho from "path";
import sistemaArquivos from "fs";
import readline from "readline";

import { Criar, RemoverEntidade, Coluna } from "@designliquido/lincones-js";
import { Simbolo } from "@designliquido/lincones-js/lexador/simbolo";
import { lerConfiguracaoDelprops, instanciarAdaptador } from "./leitor-configuracao";
import { CampoSnapshot, ModeloSnapshot } from "../interfaces-tipos/migracao";

type NomeComando = "inicializar" | "eliminar";

const MAPEAMENTO_TIPOS_LINCONES: { [tipo: string]: string } = {
    numero: "INTEIRO",
    inteiro: "INTEIRO",
    texto: "TEXTO",
    caracteres: "TEXTO",
    logico: "LOGICO",
    booleano: "LOGICO",
    decimal: "NUMERO",
    real: "NUMERO",
    flutuante: "NUMERO",
};

const DIRETORIO_MODELOS = caminho.join(process.cwd(), "modelos");

function mostrarAjuda(): void {
    console.log(`
delegua-entidades: Gerenciamento do Banco de Dados

USO:
  delegua-entidades banco <comando>

COMANDOS:
  inicializar   Cria todas as tabelas dos modelos sem usar migrações
  eliminar      Apaga todas as tabelas (requer dados.padrao.desenvolvimento = verdadeiro)

EXEMPLOS:
  delegua-entidades banco inicializar
  delegua-entidades banco eliminar
    `);
}

function lerModeloDeleguaArquivo(nomeClasse: string, caminhoArquivo: string): ModeloSnapshot | null {
    const conteudo = sistemaArquivos.readFileSync(caminhoArquivo, "utf-8");
    const campos: CampoSnapshot[] = [];

    const correspondencias = conteudo.matchAll(/(\w+)\s*:\s*(\w+)/g);
    for (const correspondencia of correspondencias) {
        const [, nomeCampo, tipoCampo] = correspondencia;
        campos.push({ nome: nomeCampo, tipo: tipoCampo });
    }

    if (campos.length === 0) return null;
    return { tabela: nomeClasse, campos };
}

function lerModelos(): { [nomeClasse: string]: ModeloSnapshot } {
    if (!sistemaArquivos.existsSync(DIRETORIO_MODELOS)) {
        return {};
    }

    const arquivos = sistemaArquivos
        .readdirSync(DIRETORIO_MODELOS)
        .filter((f) => f.endsWith(".delegua"));
    const modelos: { [nomeClasse: string]: ModeloSnapshot } = {};

    for (const arquivo of arquivos) {
        const nomeClasse = arquivo.replace(".delegua", "");
        const caminhoArquivo = caminho.join(DIRETORIO_MODELOS, arquivo);
        const modelo = lerModeloDeleguaArquivo(nomeClasse, caminhoArquivo);
        if (modelo) {
            modelos[nomeClasse] = modelo;
        }
    }

    return modelos;
}

function campoParaColuna(campo: { nome: string; tipo: string }): Coluna {
    const tipoLincones = MAPEAMENTO_TIPOS_LINCONES[campo.tipo] ?? "TEXTO";
    const ehChavePrimaria = campo.nome === "id";
    const tamanhoColuna =
        tipoLincones === "TEXTO"
            ? new Simbolo("NUMERO", "255", 255, -1)
            : undefined;

    return new Coluna(
        campo.nome,
        tipoLincones,
        tamanhoColuna,
        !ehChavePrimaria,
        ehChavePrimaria,
        false,
        ehChavePrimaria
    );
}

function confirmar(pergunta: string): Promise<boolean> {
    return new Promise((resolver) => {
        const leitor = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        leitor.question(pergunta, (resposta) => {
            leitor.close();
            resolver(resposta.trim().toLowerCase() === "s");
        });
    });
}

async function inicializarBanco(): Promise<void> {
    const configuracao = lerConfiguracaoDelprops();
    if (!configuracao) {
        console.error("Arquivo configuracao.delprops não encontrado.");
        process.exit(1);
    }

    const nomesConexao = Object.keys(configuracao.dados);
    if (nomesConexao.length === 0) {
        console.error("Nenhuma conexão encontrada em configuracao.delprops.");
        process.exit(1);
    }

    const conexaoPadrao = configuracao.dados[nomesConexao[0]];
    const tecnologia = instanciarAdaptador(conexaoPadrao);
    if (!tecnologia) {
        process.exit(1);
    }

    const caminhoBanco = conexaoPadrao.caminho ?? "";
    await tecnologia.iniciar(caminhoBanco as any);

    const modelos = lerModelos();
    const nomesModelos = Object.keys(modelos);

    if (nomesModelos.length === 0) {
        console.log("Nenhum modelo encontrado em ./modelos.");
        return;
    }

    console.log(`Inicializando ${nomesModelos.length} tabela(s)...`);

    for (const nomeClasse of nomesModelos) {
        const modelo = modelos[nomeClasse];
        const colunas = modelo.campos.map(campoParaColuna);
        const comando = new Criar(-1, nomeClasse, colunas, true);
        await tecnologia.executarComando(comando);
        console.log(`  ✓ ${nomeClasse}`);
    }

    console.log("Banco inicializado com sucesso.");
}

async function eliminarBanco(): Promise<void> {
    const configuracao = lerConfiguracaoDelprops();
    if (!configuracao) {
        console.error("Arquivo configuracao.delprops não encontrado.");
        process.exit(1);
    }

    const nomesConexao = Object.keys(configuracao.dados);
    if (nomesConexao.length === 0) {
        console.error("Nenhuma conexão encontrada em configuracao.delprops.");
        process.exit(1);
    }

    const conexaoPadrao = configuracao.dados[nomesConexao[0]];

    if (!conexaoPadrao.desenvolvimento) {
        console.error(
            "Operação não permitida: dados.padrao.desenvolvimento deve ser verdadeiro em configuracao.delprops."
        );
        process.exit(1);
    }

    const confirmado = await confirmar(
        "ATENÇÃO: todos os dados serão perdidos permanentemente. Confirmar? [s/N] "
    );
    if (!confirmado) {
        console.log("Operação cancelada.");
        return;
    }

    const tecnologia = instanciarAdaptador(conexaoPadrao);
    if (!tecnologia) {
        process.exit(1);
    }

    const caminhoBanco = conexaoPadrao.caminho ?? "";
    await tecnologia.iniciar(caminhoBanco as any);

    const modelos = lerModelos();
    const nomesModelos = Object.keys(modelos).reverse();

    if (nomesModelos.length === 0) {
        console.log("Nenhum modelo encontrado em ./modelos.");
        return;
    }

    console.log(`Eliminando ${nomesModelos.length} tabela(s)...`);

    for (const nomeClasse of nomesModelos) {
        const comando = new RemoverEntidade(-1, nomeClasse, "TABELA");
        await tecnologia.executarComando(comando);
        console.log(`  ✓ ${nomeClasse}`);
    }

    console.log("Banco eliminado com sucesso.");
}

async function principal(): Promise<void> {
    const args = process.argv.slice(2);
    const comando = args[0] as NomeComando | undefined;

    if (!comando || comando === ("--ajuda" as any) || comando === ("-a" as any)) {
        mostrarAjuda();
        process.exit(0);
    }

    switch (comando) {
        case "inicializar":
            await inicializarBanco();
            break;
        case "eliminar":
            await eliminarBanco();
            break;
        default:
            console.error(`Comando desconhecido: ${comando}`);
            mostrarAjuda();
            process.exit(1);
    }
}

principal().catch((erro) => {
    console.error("Falha ao executar comando de banco:", erro);
    process.exit(1);
});
