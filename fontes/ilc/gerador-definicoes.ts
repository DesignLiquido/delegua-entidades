#!/usr/bin/env node

/**
 * Gerador de Definições Delégua
 *
 * Lê o manifesto `manifesto-definicoes.json` e gera os arquivos `.delegua`
 * na pasta `definicoes/`, marcando cada classe com `@definicao` para que
 * a extensão VSCode reconheça as superclasses fornecidas por este pacote.
 *
 * Uso:
 *   yarn gerar-definicoes
 */

import fs from "fs";
import path from "path";

interface ParametroMetodo {
    nome: string;
    tipo: string;
}

interface MetodoDefinicao {
    nome: string;
    descricao?: string;
    parametros: ParametroMetodo[];
    retorno?: string;
}

interface PropriedadeDefinicao {
    nome: string;
    tipo: string;
}

interface ClasseDefinicao {
    nome: string;
    descricao?: string;
    propriedades: PropriedadeDefinicao[];
    metodos: MetodoDefinicao[];
}

interface Manifesto {
    classes: ClasseDefinicao[];
}

const DIRETORIO_DEFINICOES = path.join(process.cwd(), "definicoes");
const CAMINHO_MANIFESTO = path.join(__dirname, "manifesto-definicoes.json");

function carregarManifesto(): Manifesto {
    if (!fs.existsSync(CAMINHO_MANIFESTO)) {
        console.error(`Manifesto não encontrado: ${CAMINHO_MANIFESTO}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(CAMINHO_MANIFESTO, "utf-8"));
}

function gerarAssinaturaMetodo(metodo: MetodoDefinicao): string {
    const parametros = metodo.parametros
        .map((p) => `${p.nome}: ${p.tipo}`)
        .join(", ");

    const retorno = metodo.retorno ? `: ${metodo.retorno}` : "";

    return `    ${metodo.nome}(${parametros})${retorno}`;
}

function gerarBlocoComentario(texto: string, recuo: string = ""): string {
    const linhas = texto.split(". ").join(".\n").split("\n");
    return `${recuo}/**\n${linhas.map((l) => `${recuo} * ${l}`).join("\n")}\n${recuo} */`;
}

function gerarConteudoClasse(classe: ClasseDefinicao): string {
    const partes: string[] = [];

    // Comentário da classe
    if (classe.descricao) {
        partes.push(gerarBlocoComentario(classe.descricao));
    }

    // Decorador @definicao
    partes.push("@definicao");

    // Cabeçalho da classe
    partes.push(`classe estrangeira ${classe.nome} {`);

    // Propriedades
    if (classe.propriedades.length > 0) {
        for (const propriedade of classe.propriedades) {
            partes.push(`    ${propriedade.nome}: ${propriedade.tipo}`);
        }
        partes.push("");
    }

    // Métodos
    const blocoMetodos: string[] = [];
    for (const metodo of classe.metodos) {
        if (metodo.descricao) {
            blocoMetodos.push(gerarBlocoComentario(metodo.descricao, "    "));
        }
        blocoMetodos.push(gerarAssinaturaMetodo(metodo));
    }

    if (blocoMetodos.length > 0) {
        partes.push(blocoMetodos.join("\n"));
    }

    partes.push("}");

    return partes.join("\n");
}

function gerarArquivoDefinicao(classe: ClasseDefinicao): void {
    const nomeArquivo = `${classe.nome.toLowerCase()}.delegua`;
    const caminho = path.join(DIRETORIO_DEFINICOES, nomeArquivo);

    const cabecalho = [
        `/**`,
        ` * Definição gerada automaticamente — não edite manualmente.`,
        ` * Gerado por: delegua-entidades gerar-definicoes`,
        ` * Fonte: fontes/ilc/manifesto-definicoes.json`,
        ` */`,
    ].join("\n");

    const conteudo = `${cabecalho}\n\n${gerarConteudoClasse(classe)}\n`;

    fs.writeFileSync(caminho, conteudo, "utf-8");
    console.log(`  Gerado: definicoes/${nomeArquivo}`);
}

function principal(): void {
    console.log("Gerando definições Delégua...\n");

    if (!fs.existsSync(DIRETORIO_DEFINICOES)) {
        fs.mkdirSync(DIRETORIO_DEFINICOES, { recursive: true });
    }

    const manifesto = carregarManifesto();

    for (const classe of manifesto.classes) {
        gerarArquivoDefinicao(classe);
    }

    console.log(`\n${manifesto.classes.length} definição(ões) gerada(s) em definicoes/`);
}

principal();
