import { ContextoEntidades } from "../fontes/contexto-entidades";
import { Semeador } from "../fontes/migracoes/semeador";
import { SementeInterface } from "../fontes/interfaces-tipos/semente-interface";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe("Semeador", () => {
    let tecnologia: BonecoTecnologia;
    let contexto: ContextoEntidades;

    beforeEach(() => {
        tecnologia = new BonecoTecnologia();
        contexto = new ContextoEntidades(tecnologia);
    });

    it("deve executar sementes em ordem de dependencias", async () => {
        const chamadas: string[] = [];

        class SementeA implements SementeInterface {
            nome = "SementeA";
            async executar(): Promise<void> {
                chamadas.push("A");
            }
        }

        class SementeB implements SementeInterface {
            nome = "SementeB";
            dependencias = ["SementeA"];
            async executar(): Promise<void> {
                chamadas.push("B");
            }
        }

        const semeador = new Semeador(contexto);
        await semeador.semear([SementeB, SementeA]);

        expect(chamadas).toEqual(["A", "B"]);
    });

    it("deve ignorar semente ja executada", async () => {
        const chamadas: string[] = [];

        tecnologia.dadosEmMemoria["sementes"] = [
            { nome: "SementeUnica", executada_em: "2024-01-01T00:00:00.000Z" }
        ];

        class SementeUnica implements SementeInterface {
            nome = "SementeUnica";
            async executar(): Promise<void> {
                chamadas.push("X");
            }
        }

        const semeador = new Semeador(contexto);
        await semeador.semear([SementeUnica]);

        expect(chamadas).toHaveLength(0);
    });

    it("deve registrar sementes executadas", async () => {
        class SementeRegistro implements SementeInterface {
            nome = "SementeRegistro";
            async executar(): Promise<void> {
                return;
            }
        }

        const semeador = new Semeador(contexto);
        await semeador.semear([SementeRegistro]);

        expect(tecnologia.dadosEmMemoria["sementes"]).toBeDefined();
        expect(tecnologia.dadosEmMemoria["sementes"]).toHaveLength(1);
        expect(tecnologia.dadosEmMemoria["sementes"][0].nome).toBe("SementeRegistro");
    });

    it("deve falhar quando dependencia não existe", async () => {
        class SementeComDependencia implements SementeInterface {
            nome = "SementeComDependencia";
            dependencias = ["SementeAusente"];
            async executar(): Promise<void> {
                return;
            }
        }

        const semeador = new Semeador(contexto);

        await expect(semeador.semear([SementeComDependencia])).rejects.toThrow(
            "Dependencia não encontrada: SementeAusente"
        );
    });
});
