import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";

describe('Coleção', () => {
    const descritorTipoClasse = new DescritorTipoClasse(
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
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "conteudo", "conteudo", 5, -1), 
                'texto', 
                []
            )
        ]
    );

    const entidade = new Entidade(descritorTipoClasse);
    const colecao = new Colecao(entidade);

    describe('Métodos de seleção', () => {
        it('todos()', () => {
            const resultadoSelecionar = colecao.todos();
            expect(resultadoSelecionar).toBeTruthy();
            expect(resultadoSelecionar.tabela).toBe('Artigo');
            expect(resultadoSelecionar.colunas).toHaveLength(3);
            expect(resultadoSelecionar.condicoes).toHaveLength(0);
        });

        it('obterPorId()', () => {
            const resultadoSelecionarPorId = colecao.obterPorId(1);
            expect(resultadoSelecionarPorId).toBeTruthy();
            expect(resultadoSelecionarPorId.tabela).toBe('Artigo');
            expect(resultadoSelecionarPorId.colunas).toHaveLength(3);
            expect(resultadoSelecionarPorId.condicoes).toHaveLength(1);
        });
    });

    describe('Métodos de inserção', () => {
        it('inserir()', () => {
            const classeArtigoObjetoDeleguaClasse = new ObjetoDeleguaClasse(descritorTipoClasse);
            classeArtigoObjetoDeleguaClasse.propriedades["id"] = 1;
            classeArtigoObjetoDeleguaClasse.propriedades["titulo"] = "Título do meu artigo";
            classeArtigoObjetoDeleguaClasse.propriedades["conteudo"] = "Este é um parágrafo do meu artigo.";

            const resultadoInserir = colecao.inserir(classeArtigoObjetoDeleguaClasse);

            expect(resultadoInserir).toBeTruthy();
            expect(resultadoInserir.tabela).toBe('Artigo');
            expect(resultadoInserir.colunas).toHaveLength(3);
            expect(resultadoInserir.valores).toHaveLength(3);
        });
    });

    describe('Métodos de atualização', () => {
        it('atualizar() com todas as colunas', () => {
            const classeArtigoObjetoDeleguaClasse = new ObjetoDeleguaClasse(descritorTipoClasse);
            classeArtigoObjetoDeleguaClasse.propriedades["id"] = 1;
            classeArtigoObjetoDeleguaClasse.propriedades["titulo"] = "Título atualizado";
            classeArtigoObjetoDeleguaClasse.propriedades["conteudo"] = "Conteúdo atualizado.";

            const resultadoAtualizar = colecao.atualizar(classeArtigoObjetoDeleguaClasse);

            expect(resultadoAtualizar).toBeTruthy();
            expect(resultadoAtualizar.tabela).toBe('Artigo');
            expect(resultadoAtualizar.colunasEValores).toHaveLength(3);
            expect(resultadoAtualizar.condicoes).toHaveLength(1);
        });

        it('atualizar() com colunas específicas', () => {
            const classeArtigoObjetoDeleguaClasse = new ObjetoDeleguaClasse(descritorTipoClasse);
            classeArtigoObjetoDeleguaClasse.propriedades["id"] = 1;
            classeArtigoObjetoDeleguaClasse.propriedades["titulo"] = "Só o título";
            classeArtigoObjetoDeleguaClasse.propriedades["conteudo"] = "Conteúdo original.";

            const resultadoAtualizar = colecao.atualizar(classeArtigoObjetoDeleguaClasse, ["titulo"]);

            expect(resultadoAtualizar).toBeTruthy();
            expect(resultadoAtualizar.tabela).toBe('Artigo');
            expect(resultadoAtualizar.colunasEValores).toHaveLength(1);
            expect(resultadoAtualizar.condicoes).toHaveLength(1);
        });
    });

    describe('Métodos de exclusão', () => {
        it('excluir()', () => {
            const classeArtigoObjetoDeleguaClasse = new ObjetoDeleguaClasse(descritorTipoClasse);
            classeArtigoObjetoDeleguaClasse.propriedades["id"] = 5;

            const resultadoExcluir = colecao.excluir(classeArtigoObjetoDeleguaClasse);

            expect(resultadoExcluir).toBeTruthy();
            expect(resultadoExcluir.tabela).toBe('Artigo');
            expect(resultadoExcluir.condicoes).toHaveLength(1);
        });
    });
});