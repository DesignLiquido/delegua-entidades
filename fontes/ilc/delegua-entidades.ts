#!/usr/bin/env node

/**
 * Ponto de entrada principal do ILC (Interface por Linha de Comando).
 * Roteia subcomandos para os módulos correspondentes sem depender de
 * gerenciador de pacotes.
 *
 * Uso:
 *   delegua-entidades <subcomando> [argumentos...]
 *   node dist/ilc/delegua-entidades.js <subcomando> [argumentos...]
 *   bun dist/ilc/delegua-entidades.js <subcomando> [argumentos...]
 */

const SUBCOMANDOS_DISPONIVEIS = [
    "banco",
    "migracoes",
    "sementes",
    "gerar-modelo",
    "gerar-definicoes",
    "performance",
];

function mostrarAjudaGeral(): void {
    console.log(`
delegua-entidades — Ferramentas de linha de comando

USO:
  delegua-entidades <subcomando> [argumentos...]

SUBCOMANDOS:
  banco              Inicializa ou elimina o banco de dados diretamente
  migracoes          Gerencia o ciclo de vida de migrações do banco de dados
  sementes           Executa scripts de população do banco de dados
  gerar-modelo       Gera um novo modelo Delégua e sua migração correspondente
  gerar-definicoes   Gera arquivos .delegua de definições a partir do manifesto
  performance        Exibe indicadores de desempenho

EXEMPLOS:
  delegua-entidades migracoes gerar
  delegua-entidades migracoes executar
  delegua-entidades sementes ./dados/sementes.ts
  delegua-entidades gerar-modelo Usuario nome:texto email:texto
  delegua-entidades gerar-definicoes

Para ajuda de um subcomando específico:
  delegua-entidades <subcomando> --ajuda
    `);
}

async function principal(): Promise<void> {
    const argumentos = process.argv.slice(2);
    const subcomando = argumentos[0];

    if (!subcomando || subcomando === "--ajuda" || subcomando === "-a") {
        mostrarAjudaGeral();
        process.exit(0);
    }

    // Remover o subcomando de primeiro nível de process.argv para que os
    // módulos roteados leiam seus próprios argumentos de process.argv[2] em diante.
    process.argv.splice(2, 1);

    switch (subcomando) {
        case "banco":
            await import("./banco");
            break;
        case "migracoes":
            await import("./migracoes");
            break;
        case "sementes":
            await import("./semeadura");
            break;
        case "gerar-modelo":
            await import("./gerador-entidades");
            break;
        case "gerar-definicoes":
            await import("./gerador-definicoes");
            break;
        case "performance":
            await import("../indicadores-performance/index");
            break;
        default:
            console.error(`Subcomando desconhecido: "${subcomando}"`);
            console.error(`Subcomandos disponíveis: ${SUBCOMANDOS_DISPONIVEIS.join(", ")}`);
            mostrarAjudaGeral();
            process.exit(1);
    }
}

principal().catch((erro) => {
    console.error("Falha ao executar delegua-entidades:", erro);
    process.exit(1);
});
