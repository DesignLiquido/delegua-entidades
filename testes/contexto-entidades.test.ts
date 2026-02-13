import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { ContextoEntidades } from "../fontes/contexto-entidades";

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

    it('registrarColecao() registra e retorna coleção', () => {
        const contexto = new ContextoEntidades();
        const entidade = new Entidade(descritorArtigo);
        const colecao = contexto.registrarColecao(entidade);

        expect(colecao).toBeTruthy();
        expect(contexto.colecoes['Artigo']).toBe(colecao);
    });

    it('colecao() cria coleção automaticamente se não existir', () => {
        const contexto = new ContextoEntidades();
        const colecao = contexto.colecao(descritorArtigo);

        expect(colecao).toBeTruthy();
        expect(contexto.colecoes['Artigo']).toBe(colecao);
    });

    it('colecao() retorna a mesma coleção em chamadas subsequentes', () => {
        const contexto = new ContextoEntidades();
        const colecao1 = contexto.colecao(descritorArtigo);
        const colecao2 = contexto.colecao(descritorArtigo);

        expect(colecao1).toBe(colecao2);
    });

    it('gerencia múltiplas coleções independentes', () => {
        const contexto = new ContextoEntidades();
        const colecaoArtigo = contexto.colecao(descritorArtigo);
        const colecaoUsuario = contexto.colecao(descritorUsuario);

        expect(colecaoArtigo).not.toBe(colecaoUsuario);
        expect(Object.keys(contexto.colecoes)).toHaveLength(2);
    });
});
