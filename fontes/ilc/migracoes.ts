#!/usr/bin/env node
/// <reference types="node" />

/**
 * CLI para Migrações
 *
 * Uso:
 *   delegua-entidades migracoes <comando>
 *
 * Comandos:
 *   gerar      Detecta diferenças nos modelos e gera migração
 *   executar   Executa todas as migrações pendentes (padrão)
 *   reverter   Reverte a última migração executada
 *   status     Mostra status das migrações
 *   desfazer   Limpa histórico (cuidado!)
 *
 * Exemplos:
 *   delegua-entidades migracoes gerar
 *   delegua-entidades migracoes gerar adicionar_usuarios
 *   delegua-entidades migracoes executar
 *   delegua-entidades migracoes reverter
 *   delegua-entidades migracoes status
 */

import caminho from "path";
import sistemaArquivos from "fs";

import { Coluna } from "@designliquido/lincones-js";
import { Simbolo } from "@designliquido/lincones-js/lexador/simbolo";
import { Migracao } from "../migracoes/migracao";
import { ExecutorMigracoes } from "../migracoes/executor-migracoes";
import { lerConfiguracaoDelprops, instanciarAdaptador } from "./leitor-configuracao";
import { HistoricoMigracoesInterface } from "../interfaces-tipos/migracao";

type NomeComando = "gerar" | "executar" | "reverter" | "status" | "desfazer";

interface CampoSnapshot {
    nome: string;
    tipo: string;
}

interface ModeloSnapshot {
    tabela: string;
    campos: CampoSnapshot[];
}

interface Snapshot {
    timestamp: string;
    modelos: { [nomeClasse: string]: ModeloSnapshot };
}

interface OperacaoDelta {
    tipo: "criar_tabela" | "excluir_tabela" | "adicionar_coluna" | "remover_coluna" | "alterar_coluna";
    tabela: string;
    campo?: CampoSnapshot;
    campoAnterior?: CampoSnapshot;
    campos?: CampoSnapshot[];
    nomeCampo?: string;
}

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

const COMANDO_PADRAO: NomeComando = "executar";
const DIRETORIO_MODELOS = caminho.join(process.cwd(), "modelos");
const DIRETORIO_MIGRACOES = caminho.join(process.cwd(), "migracoes");
const ARQUIVO_HISTORICO = caminho.join(DIRETORIO_MIGRACOES, ".migracoes.json");
const ARQUIVO_SNAPSHOT = caminho.join(DIRETORIO_MIGRACOES, ".migracoes.jsonl");

function mostrarAjuda(): void {
    console.log(`
delegua-entidades: Ferramenta de Migrações

USO:
  delegua-entidades migracoes <comando> [nome]

COMANDOS:
  gerar [nome]  Detecta diferenças nos modelos e gera migração
  executar      Executa todas as migrações pendentes (padrão)
  reverter      Reverte a última migração executada
  status        Mostra status das migrações
  desfazer      Limpa histórico (cuidado!)

EXEMPLOS:
  delegua-entidades migracoes gerar
  delegua-entidades migracoes gerar adicionar_usuarios
  delegua-entidades migracoes executar
  delegua-entidades migracoes reverter
  delegua-entidades migracoes status
    `);
}

function garantirDiretorio(): void {
    if (!sistemaArquivos.existsSync(DIRETORIO_MIGRACOES)) {
        sistemaArquivos.mkdirSync(DIRETORIO_MIGRACOES, { recursive: true });
    }
}

function obterHistoricoMigracoes(): HistoricoMigracoesInterface {
    if (!sistemaArquivos.existsSync(ARQUIVO_HISTORICO)) {
        const historicoVazio: HistoricoMigracoesInterface = { migracoesExecutadas: [] };
        garantirDiretorio();
        sistemaArquivos.writeFileSync(ARQUIVO_HISTORICO, JSON.stringify(historicoVazio, null, 2));
        return historicoVazio;
    }

    const conteudo = sistemaArquivos.readFileSync(ARQUIVO_HISTORICO, "utf-8");
    return JSON.parse(conteudo);
}

function salvarHistoricoMigracoes(historico: HistoricoMigracoesInterface): void {
    sistemaArquivos.writeFileSync(ARQUIVO_HISTORICO, JSON.stringify(historico, null, 2));
}

function gerarTimestamp(): string {
    const agora = new Date();
    return [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, "0"),
        String(agora.getDate()).padStart(2, "0"),
        String(agora.getHours()).padStart(2, "0"),
        String(agora.getMinutes()).padStart(2, "0"),
        String(agora.getSeconds()).padStart(2, "0")
    ].join("");
}

function lerModeloDeleguaArquivo(caminhoArquivo: string): ModeloSnapshot | null {
    const conteudo = sistemaArquivos.readFileSync(caminhoArquivo, "utf-8");
    const linhas = conteudo.split("\n");

    const correspondenciaTabela = conteudo.match(/@tabela\s*\(\s*(?:nome\s*=\s*)?"([^"]+)"\s*\)/);
    if (!correspondenciaTabela) {
        return null;
    }
    const tabela = correspondenciaTabela[1];

    const campos: CampoSnapshot[] = [];
    let proximaLinhaEhRelacionamento = false;

    for (const linha of linhas) {
        const linhaTrimada = linha.trim();

        if (/^@(pertenceA|temUm|temMuitos)/.test(linhaTrimada)) {
            proximaLinhaEhRelacionamento = true;
            continue;
        }

        if (proximaLinhaEhRelacionamento) {
            proximaLinhaEhRelacionamento = false;
            continue;
        }

        // Ignora decoradores, linhas de classe, chaves, comentários e linhas vazias
        if (
            linhaTrimada.startsWith("@") ||
            linhaTrimada.startsWith("classe ") ||
            linhaTrimada === "{" ||
            linhaTrimada === "}" ||
            linhaTrimada.startsWith("//") ||
            linhaTrimada.startsWith("/*") ||
            linhaTrimada.startsWith("*") ||
            linhaTrimada === ""
        ) {
            continue;
        }

        const correspondenciaCampo = linhaTrimada.match(/^(\w+)\s*:\s*(\w+)$/);
        if (correspondenciaCampo) {
            const nomeCampo = correspondenciaCampo[1];
            const tipoCampo = correspondenciaCampo[2];

            // Tipos em minúsculas são campos; PascalCase são relacionamentos
            if (/^[a-z]/.test(tipoCampo)) {
                campos.push({ nome: nomeCampo, tipo: tipoCampo });
            }
        }
    }

    return { tabela, campos };
}

function lerModelos(): { [nomeClasse: string]: ModeloSnapshot } {
    if (!sistemaArquivos.existsSync(DIRETORIO_MODELOS)) {
        return {};
    }

    const arquivos = sistemaArquivos.readdirSync(DIRETORIO_MODELOS).filter((f) => f.endsWith(".delegua"));
    const modelos: { [nomeClasse: string]: ModeloSnapshot } = {};

    for (const arquivo of arquivos) {
        const caminhoArquivo = caminho.join(DIRETORIO_MODELOS, arquivo);
        const modelo = lerModeloDeleguaArquivo(caminhoArquivo);
        if (modelo) {
            const nomeClasse = arquivo.replace(".delegua", "");
            modelos[nomeClasse] = modelo;
        }
    }

    return modelos;
}

function lerUltimoSnapshot(): { [nomeClasse: string]: ModeloSnapshot } {
    if (!sistemaArquivos.existsSync(ARQUIVO_SNAPSHOT)) {
        return {};
    }

    const conteudo = sistemaArquivos.readFileSync(ARQUIVO_SNAPSHOT, "utf-8").trim();
    if (!conteudo) {
        return {};
    }

    const linhas = conteudo.split("\n").filter((l) => l.trim() !== "");
    const ultimaLinha = linhas[linhas.length - 1];

    const snapshot: Snapshot = JSON.parse(ultimaLinha);
    return snapshot.modelos;
}

function salvarSnapshot(timestamp: string, modelos: { [nomeClasse: string]: ModeloSnapshot }): void {
    garantirDiretorio();
    const snapshot: Snapshot = { timestamp, modelos };
    sistemaArquivos.appendFileSync(ARQUIVO_SNAPSHOT, JSON.stringify(snapshot) + "\n");
}

function calcularDelta(
    anterior: { [nomeClasse: string]: ModeloSnapshot },
    atual: { [nomeClasse: string]: ModeloSnapshot }
): OperacaoDelta[] {
    const operacoes: OperacaoDelta[] = [];

    for (const [nomeClasse, modeloAtual] of Object.entries(atual)) {
        const modeloAnterior = anterior[nomeClasse];

        if (!modeloAnterior) {
            operacoes.push({ tipo: "criar_tabela", tabela: modeloAtual.tabela, campos: modeloAtual.campos });
            continue;
        }

        const camposAnteriores = new Map(modeloAnterior.campos.map((c) => [c.nome, c]));
        const camposAtuais = new Map(modeloAtual.campos.map((c) => [c.nome, c]));

        for (const [nomeCampo, campoAtual] of camposAtuais) {
            const campoAnterior = camposAnteriores.get(nomeCampo);
            if (!campoAnterior) {
                operacoes.push({ tipo: "adicionar_coluna", tabela: modeloAtual.tabela, campo: campoAtual });
            } else if (campoAnterior.tipo !== campoAtual.tipo) {
                operacoes.push({ tipo: "alterar_coluna", tabela: modeloAtual.tabela, campo: campoAtual, campoAnterior });
            }
        }

        for (const [nomeCampo, campoAnterior] of camposAnteriores) {
            if (!camposAtuais.has(nomeCampo)) {
                operacoes.push({ tipo: "remover_coluna", tabela: modeloAtual.tabela, campo: campoAnterior });
            }
        }
    }

    for (const [nomeClasse, modeloAnterior] of Object.entries(anterior)) {
        if (!atual[nomeClasse]) {
            operacoes.push({ tipo: "excluir_tabela", tabela: modeloAnterior.tabela, campos: modeloAnterior.campos });
        }
    }

    return operacoes;
}

function campoParaColuna(campo: CampoSnapshot): Coluna {
    const tipoLincones = MAPEAMENTO_TIPOS_LINCONES[campo.tipo] ?? "TEXTO";
    const ehChavePrimaria = campo.nome === "id";
    const tamanhoColuna = tipoLincones === "TEXTO"
        ? new Simbolo("NUMERO", "255", 255, -1)
        : undefined;

    return new Coluna(campo.nome, tipoLincones, tamanhoColuna, !ehChavePrimaria, ehChavePrimaria, false, ehChavePrimaria);
}

function construirMigracao(versao: string, descricao: string, operacoes: OperacaoDelta[]): Migracao {
    const migracao = new Migracao(versao, descricao);

    for (const op of operacoes) {
        switch (op.tipo) {
            case "criar_tabela":
                migracao.criarTabela(op.tabela, (op.campos ?? []).map(campoParaColuna));
                break;
            case "excluir_tabela":
                migracao.excluirTabela(op.tabela, (op.campos ?? []).map(campoParaColuna));
                break;
            case "adicionar_coluna":
                migracao.adicionarColuna(op.tabela, campoParaColuna(op.campo!));
                break;
            case "remover_coluna":
                migracao.removerColuna(op.tabela, op.nomeCampo ?? op.campo!.nome, op.campo ? campoParaColuna(op.campo) : undefined);
                break;
            case "alterar_coluna":
                migracao.alterarColuna(op.tabela, campoParaColuna(op.campo!), campoParaColuna(op.campoAnterior!));
                break;
        }
    }

    return migracao;
}

function extrairDescricaoMigracao(conteudoMigracao: string): string {
    const correspondenciaDescricao = conteudoMigracao.match(/\*\s*Migração:\s*(.+)/);
    return correspondenciaDescricao?.[1]?.trim() || "Migração executada";
}

function extrairOperacoesBlocoAcima(conteudoMigracao: string): OperacaoDelta[] {
    const correspondenciaBlocoAcima = conteudoMigracao.match(/acima\(\)\s*\{([\s\S]*?)\n\s*\}/);
    if (!correspondenciaBlocoAcima) {
        return [];
    }

    const blocoAcima = correspondenciaBlocoAcima[1];
    const operacoesComPosicao: { posicao: number; operacao: OperacaoDelta }[] = [];

    const regexCriarTabela = /criar_tabela\("([^"]+)",\s*\[([\s\S]*?)\]\)/g;
    const regexExcluirTabela = /excluir_tabela\("([^"]+)"\)/g;
    const regexAdicionarColuna = /adicionar_coluna\("([^"]+)",\s*\{\s*nome:\s*"([^"]+)",\s*tipo:\s*"([^"]+)"\s*\}\)/g;
    const regexRemoverColuna = /remover_coluna\("([^"]+)",\s*"([^"]+)"\)/g;
    const regexAlterarColuna = /alterar_coluna\("([^"]+)",\s*\{\s*nome:\s*"([^"]+)",\s*tipo:\s*"([^"]+)"\s*\}\)/g;

    let correspondencia: RegExpExecArray | null;

    while ((correspondencia = regexCriarTabela.exec(blocoAcima)) !== null) {
        const tabela = correspondencia[1];
        const blocoCampos = correspondencia[2];
        const campos: CampoSnapshot[] = [];
        const regexCampo = /\{\s*nome:\s*"([^"]+)",\s*tipo:\s*"([^"]+)"\s*\}/g;
        let correspondenciaCampo: RegExpExecArray | null;

        while ((correspondenciaCampo = regexCampo.exec(blocoCampos)) !== null) {
            campos.push({ nome: correspondenciaCampo[1], tipo: correspondenciaCampo[2] });
        }

        operacoesComPosicao.push({
            posicao: correspondencia.index,
            operacao: {
                tipo: "criar_tabela",
                tabela,
                campos,
            }
        });
    }

    while ((correspondencia = regexExcluirTabela.exec(blocoAcima)) !== null) {
        operacoesComPosicao.push({
            posicao: correspondencia.index,
            operacao: {
                tipo: "excluir_tabela",
                tabela: correspondencia[1],
            }
        });
    }

    while ((correspondencia = regexAdicionarColuna.exec(blocoAcima)) !== null) {
        operacoesComPosicao.push({
            posicao: correspondencia.index,
            operacao: {
                tipo: "adicionar_coluna",
                tabela: correspondencia[1],
                campo: {
                    nome: correspondencia[2],
                    tipo: correspondencia[3],
                }
            }
        });
    }

    while ((correspondencia = regexRemoverColuna.exec(blocoAcima)) !== null) {
        operacoesComPosicao.push({
            posicao: correspondencia.index,
            operacao: {
                tipo: "remover_coluna",
                tabela: correspondencia[1],
                nomeCampo: correspondencia[2],
            }
        });
    }

    while ((correspondencia = regexAlterarColuna.exec(blocoAcima)) !== null) {
        operacoesComPosicao.push({
            posicao: correspondencia.index,
            operacao: {
                tipo: "alterar_coluna",
                tabela: correspondencia[1],
                campo: {
                    nome: correspondencia[2],
                    tipo: correspondencia[3],
                }
            }
        });
    }

    return operacoesComPosicao.sort((a, b) => a.posicao - b.posicao).map((item) => item.operacao);
}

function gerarConteudoMigracao(timestamp: string, descricao: string, operacoes: OperacaoDelta[]): string {
    const linhasAcima: string[] = [];
    const linhasAbaixo: string[] = [];

    for (const op of operacoes) {
        switch (op.tipo) {
            case "criar_tabela": {
                const camposLista = (op.campos ?? []).map((c) => `        { nome: "${c.nome}", tipo: "${c.tipo}" }`).join(",\n");
                linhasAcima.push(`        criar_tabela("${op.tabela}", [\n${camposLista}\n        ])`);
                linhasAbaixo.push(`        excluir_tabela("${op.tabela}")`);
                break;
            }
            case "excluir_tabela": {
                const camposLista = (op.campos ?? []).map((c) => `        { nome: "${c.nome}", tipo: "${c.tipo}" }`).join(",\n");
                linhasAcima.push(`        excluir_tabela("${op.tabela}")`);
                linhasAbaixo.push(`        criar_tabela("${op.tabela}", [\n${camposLista}\n        ])`);
                break;
            }
            case "adicionar_coluna":
                linhasAcima.push(`        adicionar_coluna("${op.tabela}", { nome: "${op.campo!.nome}", tipo: "${op.campo!.tipo}" })`);
                linhasAbaixo.push(`        remover_coluna("${op.tabela}", "${op.campo!.nome}")`);
                break;
            case "remover_coluna":
                linhasAcima.push(`        remover_coluna("${op.tabela}", "${op.campo!.nome}")`);
                linhasAbaixo.push(`        adicionar_coluna("${op.tabela}", { nome: "${op.campo!.nome}", tipo: "${op.campo!.tipo}" })`);
                break;
            case "alterar_coluna":
                linhasAcima.push(`        alterar_coluna("${op.tabela}", { nome: "${op.campo!.nome}", tipo: "${op.campo!.tipo}" })`);
                linhasAbaixo.push(`        alterar_coluna("${op.tabela}", { nome: "${op.campoAnterior!.nome}", tipo: "${op.campoAnterior!.tipo}" })`);
                break;
        }
    }

    return `/**
 * Migração: ${descricao}
 * Timestamp: ${timestamp}
 */

classe Migracao${timestamp} herda Migracao {
    versao(): texto {
        retorne "${timestamp}"
    }

    descricao(): texto {
        retorne "${descricao}"
    }

    acima() {
${linhasAcima.join("\n")}
    }

    abaixo() {
${linhasAbaixo.join("\n")}
    }
}
`;
}

function gerarMigracao(nomeOpcional?: string): void {
    garantirDiretorio();

    const modelosAtuais = lerModelos();
    const snapshotAnterior = lerUltimoSnapshot();
    const operacoes = calcularDelta(snapshotAnterior, modelosAtuais);

    if (operacoes.length === 0) {
        console.log("Nenhuma alteração detectada nos modelos.");
        return;
    }

    const timestamp = gerarTimestamp();
    const nomeMigracao = nomeOpcional ? `${timestamp}_${nomeOpcional}` : timestamp;
    const descricao = nomeOpcional ? nomeOpcional.replace(/_/g, " ") : "Migração automática";
    const caminhoMigracao = caminho.join(DIRETORIO_MIGRACOES, `${nomeMigracao}.delegua`);

    const conteudo = gerarConteudoMigracao(timestamp, descricao, operacoes);
    sistemaArquivos.writeFileSync(caminhoMigracao, conteudo);

    salvarSnapshot(timestamp, modelosAtuais);

    console.log(`✓ Migração criada: ${nomeMigracao}.delegua`);
    console.log(`  ${operacoes.length} operação(ões) detectada(s).`);
}

async function executarMigracoes(): Promise<void> {
    garantirDiretorio();

    console.log("Verificando migrações pendentes...");

    const historico = obterHistoricoMigracoes();
    const arquivos = sistemaArquivos
        .readdirSync(DIRETORIO_MIGRACOES)
        .filter((f) => f.endsWith(".delegua"))
        .sort();

    if (arquivos.length === 0) {
        console.log("Nenhuma migração encontrada.");
        return;
    }

    const versoesMigradas = new Set(historico.migracoesExecutadas.map((m) => m.versao));
    const pendentes = arquivos.filter((f) => {
        const versao = f.replace(/\.delegua$/, "");
        return !versoesMigradas.has(versao);
    });

    if (pendentes.length === 0) {
        console.log("✓ Todas as migrações já foram executadas.");
        return;
    }

    // Obter adaptador a partir de configuracao.delprops, se disponível
    const configuracaoDelprops = lerConfiguracaoDelprops();
    let executor: ExecutorMigracoes | null = null;

    if (configuracaoDelprops) {
        const nomesConexao = Object.keys(configuracaoDelprops.dados);
        if (nomesConexao.length === 0) {
            throw new Error("Arquivo configuracao.delprops encontrado, mas nenhuma conexão válida foi definida em 'dados'.");
        }

        const conexaoPadrao = configuracaoDelprops.dados[nomesConexao[0]];
        const adaptador = instanciarAdaptador(conexaoPadrao);
        if (!adaptador) {
            throw new Error(`Não foi possível instanciar o adaptador para a conexão '${nomesConexao[0]}'.`);
        }

        const caminhoConexao = conexaoPadrao.caminho ?? conexaoPadrao.banco ?? "";
        await adaptador.iniciar(caminhoConexao);
        executor = new ExecutorMigracoes(adaptador);
        console.log(`Usando adaptador '${conexaoPadrao.tecnologia}' (conexão '${nomesConexao[0]}').`);
    } else {
        console.log("Arquivo configuracao.delprops não encontrado. Apenas o histórico será atualizado.");
    }

    console.log(`Executando ${pendentes.length} migração(ões) pendente(s)...`);

    for (const arquivo of pendentes) {
        const versao = arquivo.replace(/\.delegua$/, "");
        console.log(`  • ${arquivo}`);

        if (executor) {
            const caminhoMigracao = caminho.join(DIRETORIO_MIGRACOES, arquivo);
            const conteudoMigracao = sistemaArquivos.readFileSync(caminhoMigracao, "utf-8");
            const descricao = extrairDescricaoMigracao(conteudoMigracao);
            const operacoes = extrairOperacoesBlocoAcima(conteudoMigracao);

            if (operacoes.length === 0) {
                throw new Error(`Não foi possível extrair operações do arquivo '${arquivo}'.`);
            }

            const migracao = construirMigracao(versao, descricao, operacoes);
            await executor.executar(migracao);
        }

        historico.migracoesExecutadas.push({
            versao,
            descricao: "Migração executada",
            dataExecucao: new Date().toISOString()
        });
    }

    salvarHistoricoMigracoes(historico);
    console.log("✓ Migrações executadas com sucesso!");
}

function desfazerMigracao(): void {
    const historico = obterHistoricoMigracoes();

    if (historico.migracoesExecutadas.length === 0) {
        console.log("Nenhuma migração para reverter.");
        return;
    }

    const ultima = historico.migracoesExecutadas.pop();
    salvarHistoricoMigracoes(historico);

    console.log(`✓ Migração revertida: ${ultima?.versao}`);
}

function mostrarStatus(): void {
    garantirDiretorio();

    const historico = obterHistoricoMigracoes();
    const arquivos = sistemaArquivos.readdirSync(DIRETORIO_MIGRACOES).filter((f) => f.endsWith(".delegua"));

    console.log("\nStatus das Migrações:");
    console.log(`   Total: ${arquivos.length}`);
    console.log(`   Executadas: ${historico.migracoesExecutadas.length}`);
    console.log(`   Pendentes: ${arquivos.length - historico.migracoesExecutadas.length}`);

    if (historico.migracoesExecutadas.length > 0) {
        console.log("\n✓ Executadas:");
        for (const reg of historico.migracoesExecutadas) {
            const data = new Date(reg.dataExecucao).toLocaleString("pt-BR");
            console.log(`   [${reg.versao}] ${data}`);
        }
    }
}

function desfazerHistorico(): void {
    if (!sistemaArquivos.existsSync(ARQUIVO_HISTORICO)) {
        console.log("Nenhum histórico para limpar.");
        return;
    }

    sistemaArquivos.unlinkSync(ARQUIVO_HISTORICO);

    if (sistemaArquivos.existsSync(ARQUIVO_SNAPSHOT)) {
        sistemaArquivos.unlinkSync(ARQUIVO_SNAPSHOT);
    }

    console.log("✓ Histórico de migrações limpo.");
}

async function principal(): Promise<void> {
    const args = process.argv.slice(2);
    const comando = (args[0] || COMANDO_PADRAO) as NomeComando;

    switch (comando) {
        case "gerar":
            gerarMigracao(args[1]);
            break;
        case "executar":
            await executarMigracoes();
            break;
        case "reverter":
            desfazerMigracao();
            break;
        case "status":
            mostrarStatus();
            break;
        case "desfazer":
            desfazerHistorico();
            break;
        default:
            console.error(`Comando desconhecido: ${comando}`);
            mostrarAjuda();
            process.exit(1);
    }
}

principal().catch((erro) => {
    console.error("Falha ao executar migrações:", erro);
    process.exit(1);
});
