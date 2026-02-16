import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe("Upsert (salvarOuAtualizar)", () => {
    const descritorUsuario = new DescritorTipoClasse(
        new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
        null,
        {},
        [
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                "numero",
                []
            ),
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                "texto",
                []
            )
        ]
    );

    it("insere quando registro nao existe", async () => {
        const entidade = new Entidade(descritorUsuario);
        const tecnologia = new BonecoTecnologia();
        tecnologia.dadosEmMemoria["Usuario"] = [];
        const colecao = new Colecao(entidade, tecnologia);

        const registro = new ObjetoDeleguaClasse(entidade.modelo);
        registro.propriedades["id"] = 1;
        registro.propriedades["nome"] = "Ana";

        await colecao.salvarOuAtualizar(registro);

        expect(tecnologia.dadosEmMemoria["Usuario"]).toHaveLength(1);
        expect(tecnologia.dadosEmMemoria["Usuario"][0].nome).toBe("Ana");
    });

    it("atualiza quando registro existe", async () => {
        const entidade = new Entidade(descritorUsuario);
        const tecnologia = new BonecoTecnologia();
        tecnologia.dadosEmMemoria["Usuario"] = [{ id: 1, nome: "Antes" }];
        const colecao = new Colecao(entidade, tecnologia);

        const registro = new ObjetoDeleguaClasse(entidade.modelo);
        registro.propriedades["id"] = 1;
        registro.propriedades["nome"] = "Depois";

        await colecao.salvarOuAtualizar(registro);

        expect(tecnologia.dadosEmMemoria["Usuario"]).toHaveLength(1);
        expect(tecnologia.dadosEmMemoria["Usuario"][0].nome).toBe("Depois");
    });

    it("upsert usa salvarOuAtualizar", async () => {
        const entidade = new Entidade(descritorUsuario);
        const tecnologia = new BonecoTecnologia();
        tecnologia.dadosEmMemoria["Usuario"] = [];
        const colecao = new Colecao(entidade, tecnologia);

        const registro = new ObjetoDeleguaClasse(entidade.modelo);
        registro.propriedades["id"] = 2;
        registro.propriedades["nome"] = "Bea";

        await colecao.upsert(registro);

        expect(tecnologia.dadosEmMemoria["Usuario"]).toHaveLength(1);
        expect(tecnologia.dadosEmMemoria["Usuario"][0].nome).toBe("Bea");
    });
});
