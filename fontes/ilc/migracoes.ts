#!/usr/bin/env node
/// <reference types="node" />

/**
 * CLI para Migrações
 * 
 * Uso:
 *   yarn migracoes gerar
 *   yarn migracoes executar
 *   yarn migracoes reverter
 *   yarn migracoes status
 */

import caminho from "path";
import sistemaArquivos from "fs";

import { Migracao } from "../migracoes/migracao";
import { ExecutorMigracoes } from "../migracoes/executor-migracoes";
import { lerConfiguracaoDelprops, instanciarAdaptador } from "./leitor-configuracao";

type NomeComando = "gerar" | "executar" | "reverter" | "status" | "desfazer";

const COMANDO_PADRAO: NomeComando = "executar";
const DIRETORIO_MIGRACOES = caminho.join(process.cwd(), "fontes", "migracoes", "geradas");
const ARQUIVO_HISTORICO = caminho.join(DIRETORIO_MIGRACOES, ".migracoes.json");

interface RegistroMigracao {
    versao: string;
    descricao: string;
    data_execucao: string;
}

interface HistoricoMigracoes {
    migracoes_executadas: RegistroMigracao[];
}

function mostrarAjuda(): void {
    console.log(`
delegua-entidades: Ferramenta de Migrações

USO:
  yarn migracoes <comando>

COMANDOS:
  gerar      Gera uma nova migração vazia com timestamp
  executar   Executa todas as migrações pendentes (padrão)
  reverter   Reverte a última migração executada
  status     Mostra status das migrações
  desfazer   Limpa histórico (cuidado!)

EXEMPLOS:
  yarn migracoes gerar
  yarn migracoes executar
  yarn migracoes status
    `);
}

function garantirDiretorio(): void {
    if (!sistemaArquivos.existsSync(DIRETORIO_MIGRACOES)) {
        sistemaArquivos.mkdirSync(DIRETORIO_MIGRACOES, { recursive: true });
    }
}

function obterHistoricoMigracoes(): HistoricoMigracoes {
    if (!sistemaArquivos.existsSync(ARQUIVO_HISTORICO)) {
        return { migracoes_executadas: [] };
    }

    const conteudo = sistemaArquivos.readFileSync(ARQUIVO_HISTORICO, "utf-8");
    return JSON.parse(conteudo);
}

function salvarHistoricoMigracoes(historico: HistoricoMigracoes): void {
    sistemaArquivos.writeFileSync(ARQUIVO_HISTORICO, JSON.stringify(historico, null, 2));
}

function gerarMigracao(): void {
    garantirDiretorio();

    const agora = new Date();
    const timestamp = [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, "0"),
        String(agora.getDate()).padStart(2, "0"),
        String(agora.getHours()).padStart(2, "0"),
        String(agora.getMinutes()).padStart(2, "0"),
        String(agora.getSeconds()).padStart(2, "0")
    ].join("");

    const nomeMigracao = `${timestamp}_migracao_vazia`;
    const caminhoMigracao = caminho.join(DIRETORIO_MIGRACOES, `${nomeMigracao}.ts`);

    const conteudoMigracao = `import { Migracao } from "../../migracoes/migracao";

export const migracao = new Migracao("${timestamp}", "Descrição da migração");

// Adicione aqui suas operações de migração
// Exemplos:
// migracao.criarTabela("usuarios", [
//     new Coluna("id", "INTEIRO", undefined, false, true, false, true),
//     new Coluna("nome", "TEXTO"),
//     new Coluna("email", "TEXTO")
// ]);

// migracao.excluirTabela("tabela_antiga");
// migracao.adicionarColuna("usuarios", new Coluna("ativo", "LOGICO", undefined, true));
`;

    sistemaArquivos.writeFileSync(caminhoMigracao, conteudoMigracao);
    console.log(`✓ Migração criada: ${nomeMigracao}.ts`);
}

async function executarMigracoes(): Promise<void> {
    garantirDiretorio();

    console.log("Verificando migrações pendentes...");

    const historico = obterHistoricoMigracoes();
    const arquivos = sistemaArquivos.readdirSync(DIRETORIO_MIGRACOES).filter((f) => f.endsWith(".ts") && f !== ".migracoes.json");

    if (arquivos.length === 0) {
        console.log("Nenhuma migração encontrada.");
        return;
    }

    const versoesMigradas = new Set(historico.migracoes_executadas.map((m) => m.versao));
    const pendentes = arquivos.filter((f) => {
        const versao = f.replace("_migracao_vazia.ts", "").replace(/\.ts$/, "");
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
        if (nomesConexao.length > 0) {
            const conexaoPadrao = configuracaoDelprops.dados[nomesConexao[0]];
            const adaptador = instanciarAdaptador(conexaoPadrao);
            if (adaptador) {
                const caminhoConexao = conexaoPadrao.caminho ?? conexaoPadrao.banco ?? "";
                await adaptador.iniciar(caminhoConexao);
                executor = new ExecutorMigracoes(adaptador);
                console.log(`Usando adaptador '${conexaoPadrao.tecnologia}' (conexão '${nomesConexao[0]}').`);
            }
        }
    } else {
        console.log("Arquivo configuracao.delprops não encontrado. Apenas o histórico será atualizado.");
    }

    console.log(`Executando ${pendentes.length} migração(ões) pendente(s)...`);

    for (const arquivo of pendentes) {
        const versao = arquivo.replace("_migracao_vazia.ts", "").replace(/\.ts$/, "");
        console.log(`  • ${arquivo}`);

        if (executor) {
            const caminhoMigracao = caminho.join(DIRETORIO_MIGRACOES, arquivo);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const modulo = require(caminhoMigracao) as { migracao?: Migracao; default?: Migracao };
            const migracao = modulo.migracao ?? modulo.default;

            if (migracao) {
                await executor.executar(migracao);
            } else {
                console.warn(`  ⚠ Módulo '${arquivo}' não exporta 'migracao' nem exportação padrão. Pulando.`);
            }
        }

        historico.migracoes_executadas.push({
            versao,
            descricao: "Migração executada",
            data_execucao: new Date().toISOString()
        });
    }

    salvarHistoricoMigracoes(historico);
    console.log("✓ Migrações executadas com sucesso!");
}

function desfazerMigracao(): void {
    const historico = obterHistoricoMigracoes();

    if (historico.migracoes_executadas.length === 0) {
        console.log("Nenhuma migração para reverter.");
        return;
    }

    const ultima = historico.migracoes_executadas.pop();
    salvarHistoricoMigracoes(historico);

    console.log(`✓ Migração revertida: ${ultima?.versao}`);
}

function mostrarStatus(): void {
    garantirDiretorio();

    const historico = obterHistoricoMigracoes();
    const arquivos = sistemaArquivos.readdirSync(DIRETORIO_MIGRACOES).filter((f) => f.endsWith(".ts"));

    console.log("\n📊 Status das Migrações:");
    console.log(`   Total: ${arquivos.length}`);
    console.log(`   Executadas: ${historico.migracoes_executadas.length}`);
    console.log(`   Pendentes: ${arquivos.length - historico.migracoes_executadas.length}`);

    if (historico.migracoes_executadas.length > 0) {
        console.log("\n✓ Executadas:");
        for (const reg of historico.migracoes_executadas) {
            const data = new Date(reg.data_execucao).toLocaleString("pt-BR");
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
    console.log("✓ Histórico de migrações limpo.");
}

async function principal(): Promise<void> {
    const args = process.argv.slice(2);
    const comando = (args[0] || COMANDO_PADRAO) as NomeComando;

    switch (comando) {
        case "gerar":
            gerarMigracao();
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
