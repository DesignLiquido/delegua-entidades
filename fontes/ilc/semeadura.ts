import path from "path";

import { ContextoEntidades } from "../contexto-entidades";
import { ClasseSemente, Semeador } from "../migracoes/semeador";

type ModuloSementes = {
    criarContexto?: () => Promise<ContextoEntidades> | ContextoEntidades;
    sementes?: ClasseSemente[];
    default?: ClasseSemente[];
};

function mostrarAjuda(): void {
    console.log("Uso:");
    console.log("  delegua-entidades sementes <caminho-modulo>");
    console.log("");
    console.log("O módulo deve exportar:");
    console.log("  - criarContexto(): ContextoEntidades");
    console.log("  - sementes: ClasseSemente[] (ou exportação padrão)");
}

async function carregarModulo(caminhoModulo: string): Promise<ModuloSementes> {
    const caminhoResolvido = path.isAbsolute(caminhoModulo)
        ? caminhoModulo
        : path.join(process.cwd(), caminhoModulo);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(caminhoResolvido) as ModuloSementes;
}

async function executar(): Promise<void> {
    const argumentos = process.argv.slice(2);
    const caminhoModulo = argumentos[0];

    if (!caminhoModulo) {
        mostrarAjuda();
        process.exit(1);
    }

    const modulo = await carregarModulo(caminhoModulo);
    const criarContexto = modulo.criarContexto;
    const sementes = modulo.sementes || modulo.default;

    if (!criarContexto) {
        console.error("Módulo sem elemento exportado 'criarContexto'.");
        process.exit(1);
    }

    if (!sementes || sementes.length === 0) {
        console.error("Módulo sem elemento exportado 'sementes' ou elemento padrão vazio.");
        process.exit(1);
    }

    const contexto = await Promise.resolve(criarContexto());
    const semeador = new Semeador(contexto, contexto.taquigrafo);

    await semeador.semear(sementes);
}

executar().catch((erro) => {
    console.error("Falha ao executar semeadura:", erro);
    process.exit(1);
});
