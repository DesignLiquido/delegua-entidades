import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { GeradorMigracoes } from "../fontes/migracoes/gerador-migracoes";

describe("Colunas computadas", () => {
    it("detecta coluna computada com @computada", () => {
        const descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Pedido", "Pedido", 1, -1),
            null,
            {},
            [
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                    "numero",
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "total", "total", 4, -1),
                    "numero",
                    [new Decorador(-1, 4, "computada", {
                        expressao: "quantidade * preco",
                        persistida: true
                    })]
                )
            ]
        );

        const entidade = new Entidade(descritor);
        const computadas = entidade.obterColunasComputadas();

        expect(computadas).toHaveLength(1);
        expect(computadas[0].nome).toBe("total");
        expect(computadas[0].expressao).toBe("quantidade * preco");
        expect(computadas[0].persistida).toBe(true);
    });

    it("gera operacao de coluna computada ao criar tabela", () => {
        const descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Pedido", "Pedido", 1, -1),
            null,
            {},
            [
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                    "numero",
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "total", "total", 4, -1),
                    "numero",
                    [new Decorador(-1, 4, "computada", {
                        expressao: "quantidade * preco"
                    })]
                )
            ]
        );

        const entidade = new Entidade(descritor);
        const migracao = GeradorMigracoes.gerar([entidade], [], "001", "Criar tabela Pedido");

        const operacoesComputadas = migracao.operacoes.filter((op) => op.tipo === "adicionarColunaComputada");
        expect(operacoesComputadas).toHaveLength(1);
        expect(operacoesComputadas[0].nomeColuna).toBe("total");
    });

    it("gera operacao de coluna computada quando nao existe no schema", () => {
        const descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Pedido", "Pedido", 1, -1),
            null,
            {},
            [
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                    "numero",
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "total", "total", 4, -1),
                    "numero",
                    [new Decorador(-1, 4, "computada", {
                        expressao: "quantidade * preco"
                    })]
                )
            ]
        );

        const entidade = new Entidade(descritor);
        const schemaAtual = [
            { nomeTabela: "Pedido", colunas: [{ nome: "id", tipo: "INTEIRO" }] }
        ];

        const migracao = GeradorMigracoes.gerar([entidade], schemaAtual, "002", "Atualizar tabela Pedido");
        const operacoesComputadas = migracao.operacoes.filter((op) => op.tipo === "adicionarColunaComputada");

        expect(operacoesComputadas).toHaveLength(1);
        expect(operacoesComputadas[0].nomeColuna).toBe("total");
    });
});
