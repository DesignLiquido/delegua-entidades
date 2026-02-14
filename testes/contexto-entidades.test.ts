import {
    DescritorTipoClasse,
    ObjetoDeleguaClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { ContextoEntidades } from "../fontes/contexto-entidades";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('ContextoEntidades', () => {
    const descritorArtigo = new DescritorTipoClasse(
        new Simbolo("IDENTIFICADOR", "Artigo", "Artigo", 1, -1),
        null,
        {},
        [
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                'número',
                []
            ),
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "titulo", "titulo", 4, -1),
                'texto',
                []
            ),
        ]
    );

    const descritorUsuario = new DescritorTipoClasse(
        new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
        null,
        {},
        [
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                'número',
                []
            ),
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                'texto',
                []
            ),
        ]
    );

    let tecnologiaMock: BonecoTecnologia;

    beforeEach(() => {
        tecnologiaMock = new BonecoTecnologia();
    });

    it('registrarColecao() registra e retorna coleção', () => {
        const contexto = new ContextoEntidades(tecnologiaMock);
        const entidade = new Entidade(descritorArtigo);
        const colecao = contexto.registrarColecao(entidade);

        expect(colecao).toBeTruthy();
        expect(contexto.colecoes['Artigo']).toBe(colecao);
    });

    it('colecao() cria coleção automaticamente se não existir', () => {
        const contexto = new ContextoEntidades(tecnologiaMock);
        const colecao = contexto.colecao(descritorArtigo);

        expect(colecao).toBeTruthy();
        expect(contexto.colecoes['Artigo']).toBe(colecao);
    });

    it('colecao() retorna a mesma coleção em chamadas subsequentes', () => {
        const contexto = new ContextoEntidades(tecnologiaMock);
        const colecao1 = contexto.colecao(descritorArtigo);
        const colecao2 = contexto.colecao(descritorArtigo);

        expect(colecao1).toBe(colecao2);
    });

    it('gerencia múltiplas coleções independentes', () => {
        const contexto = new ContextoEntidades(tecnologiaMock);
        const colecaoArtigo = contexto.colecao(descritorArtigo);
        const colecaoUsuario = contexto.colecao(descritorUsuario);

        expect(colecaoArtigo).not.toBe(colecaoUsuario);
        expect(Object.keys(contexto.colecoes)).toHaveLength(2);
    });

    it('coleções recebem referência à tecnologia', () => {
        const contexto = new ContextoEntidades(tecnologiaMock);
        const colecao = contexto.colecao(descritorArtigo);

        expect(colecao.tecnologia).toBe(tecnologiaMock);
    });

    describe('iniciar()', () => {
        it('inicializa tecnologia e cria tabelas', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            const entidadeArtigo = new Entidade(descritorArtigo);
            contexto.registrarColecao(entidadeArtigo);

            await contexto.iniciar(':memory:');

            expect(tecnologiaMock.iniciada).toBe(true);
            expect(tecnologiaMock.dadosEmMemoria['Artigo']).toBeDefined();
        });

        it('cria tabelas para todas as coleções registradas', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            contexto.registrarColecao(new Entidade(descritorArtigo));
            contexto.registrarColecao(new Entidade(descritorUsuario));

            await contexto.iniciar(':memory:');

            expect(tecnologiaMock.dadosEmMemoria['Artigo']).toBeDefined();
            expect(tecnologiaMock.dadosEmMemoria['Usuario']).toBeDefined();
        });

        it('ciclo completo: iniciar, salvar, buscar', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            contexto.registrarColecao(new Entidade(descritorArtigo));
            await contexto.iniciar(':memory:');

            const colecao = contexto.colecao(descritorArtigo);

            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades["id"] = 1;
            registro.propriedades["titulo"] = "Meu artigo";
            await colecao.salvar(registro);

            const resultados = await colecao.buscarTodos();
            expect(resultados).toHaveLength(1);
            expect(resultados[0].propriedades['titulo']).toBe('Meu artigo');

            const porId = await colecao.buscarPorId(1);
            expect(porId).toBeTruthy();
            expect(porId.propriedades['id']).toBe(1);
        });
    });
});
