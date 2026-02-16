import { Inserir, Literal } from "@designliquido/lincones-js";

import { ContextoEntidades } from "../contexto-entidades";
import { SementeInterface } from "../interfaces-tipos/semente-interface";
import { Taquigrafo } from "../taquigrafia";

export type ClasseSemente = new () => SementeInterface;

type EstadoVisita = "visitando" | "visitado";

export class Semeador {
    private contexto: ContextoEntidades;
    private logger?: Taquigrafo;

    constructor(contexto: ContextoEntidades, logger?: Taquigrafo) {
        this.contexto = contexto;
        this.logger = logger;
    }

    async semear(sementes: Array<ClasseSemente | SementeInterface>): Promise<void> {
        const instancias = this.instanciarSementes(sementes);
        const ordenadas = this.ordenarPorDependencias(instancias);

        await this.garantirTabelaSementes();
        const sementesExecutadas = await this.obterSementesExecutadas();

        for (const semente of ordenadas) {
            const nomeSemente = this.obterNomeSemente(semente);

            if (sementesExecutadas.has(nomeSemente)) {
                this.logger?.depuracao?.(`Semente '${nomeSemente}' ja executada. Ignorando.`);
                continue;
            }

            this.logger?.info?.(`Executando semente '${nomeSemente}'.`);
            await semente.executar(this.contexto);
            await this.registrarSementeExecutada(nomeSemente);
            sementesExecutadas.add(nomeSemente);
        }
    }

    async executarSemente(classe: ClasseSemente): Promise<void> {
        await this.semear([classe]);
    }

    private instanciarSementes(sementes: Array<ClasseSemente | SementeInterface>): SementeInterface[] {
        return sementes.map((semente) => {
            if (typeof semente === "function") {
                return new semente();
            }
            return semente;
        });
    }

    private ordenarPorDependencias(sementes: SementeInterface[]): SementeInterface[] {
        const mapaPorNome = new Map<string, SementeInterface>();
        const resultado: SementeInterface[] = [];
        const estados = new Map<string, EstadoVisita>();

        for (const semente of sementes) {
            const nomeSemente = this.obterNomeSemente(semente);
            if (mapaPorNome.has(nomeSemente)) {
                throw new Error(`Semente duplicada: ${nomeSemente}`);
            }
            mapaPorNome.set(nomeSemente, semente);
        }

        const visitar = (semente: SementeInterface): void => {
            const nomeSemente = this.obterNomeSemente(semente);
            const estado = estados.get(nomeSemente);

            if (estado === "visitando") {
                throw new Error(`Dependencia circular detectada em ${nomeSemente}`);
            }

            if (estado === "visitado") {
                return;
            }

            estados.set(nomeSemente, "visitando");

            const dependencias = semente.dependencias || [];
            for (const dep of dependencias) {
                const sementeDependente = mapaPorNome.get(dep);
                if (!sementeDependente) {
                    throw new Error(`Dependencia nao encontrada: ${dep}`);
                }
                visitar(sementeDependente);
            }

            estados.set(nomeSemente, "visitado");
            resultado.push(semente);
        };

        for (const semente of sementes) {
            visitar(semente);
        }

        return resultado;
    }

    private obterNomeSemente(semente: SementeInterface): string {
        const nome = semente.nome || semente.constructor?.name;
        if (!nome || nome.trim().length === 0) {
            throw new Error("Semente sem nome definido");
        }
        return nome;
    }

    private async garantirTabelaSementes(): Promise<void> {
        const sql = "CREATE TABLE IF NOT EXISTS sementes (nome TEXTO PRIMARY KEY, executada_em DATA_HORA)";
        await this.contexto.tecnologia.executar(null, sql, []);
    }

    private async obterSementesExecutadas(): Promise<Set<string>> {
        const sql = "SELECT nome FROM sementes";
        const resultados = await this.contexto.tecnologia.executar(null, sql, []);
        const linhas = resultados[0]?.linhasRetornadas || [];

        const nomes = new Set<string>();
        for (const linha of linhas) {
            if (linha && linha.nome) {
                nomes.add(linha.nome);
            }
        }

        return nomes;
    }

    private async registrarSementeExecutada(nomeSemente: string): Promise<void> {
        const nomesColunas = ["nome", "executada_em"];
        const valoresColunas = [
            new Literal(nomeSemente, "TEXTO"),
            new Literal(new Date().toISOString(), "TEXTO")
        ];
        const comando = new Inserir(-1, "sementes", nomesColunas, valoresColunas);
        await this.contexto.tecnologia.executarComando(comando);
    }
}
