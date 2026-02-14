import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { TecnologiaMock } from "./auxiliar/tecnologia-mock";

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

    describe('Métodos de execução', () => {
        let tecnologiaMock: TecnologiaMock;
        let colecaoComTecnologia: Colecao<Entidade>;

        beforeEach(() => {
            tecnologiaMock = new TecnologiaMock();
            tecnologiaMock.dadosEmMemoria['Artigo'] = [];
            colecaoComTecnologia = new Colecao(entidade, tecnologiaMock);
        });

        it('lança erro quando tecnologia não está configurada', async () => {
            const colecaoSemTecnologia = new Colecao(entidade);
            await expect(colecaoSemTecnologia.buscarTodos()).rejects.toThrow('Nenhuma tecnologia');
        });

        it('salvar() insere registro', async () => {
            const registro = new ObjetoDeleguaClasse(descritorTipoClasse);
            registro.propriedades["id"] = 1;
            registro.propriedades["titulo"] = "Meu artigo";
            registro.propriedades["conteudo"] = "Conteúdo";

            const resultado = await colecaoComTecnologia.salvar(registro);

            expect(resultado[0].linhasAfetadas).toBe(1);
            expect(tecnologiaMock.dadosEmMemoria['Artigo']).toHaveLength(1);
        });

        it('buscarTodos() retorna registros hidratados', async () => {
            const registro = new ObjetoDeleguaClasse(descritorTipoClasse);
            registro.propriedades["id"] = 1;
            registro.propriedades["titulo"] = "Artigo 1";
            registro.propriedades["conteudo"] = "Conteúdo 1";
            await colecaoComTecnologia.salvar(registro);

            const resultados = await colecaoComTecnologia.buscarTodos();

            expect(resultados).toHaveLength(1);
            expect(resultados[0]).toBeInstanceOf(ObjetoDeleguaClasse);
            expect(resultados[0].propriedades['titulo']).toBe('Artigo 1');
        });

        it('buscarTodos() retorna lista vazia quando não há registros', async () => {
            const resultados = await colecaoComTecnologia.buscarTodos();
            expect(resultados).toHaveLength(0);
        });

        it('buscarPorId() retorna registro hidratado', async () => {
            const registro = new ObjetoDeleguaClasse(descritorTipoClasse);
            registro.propriedades["id"] = 42;
            registro.propriedades["titulo"] = "Específico";
            registro.propriedades["conteudo"] = "Conteúdo específico";
            await colecaoComTecnologia.salvar(registro);

            const resultado = await colecaoComTecnologia.buscarPorId(42);

            expect(resultado).toBeTruthy();
            expect(resultado).toBeInstanceOf(ObjetoDeleguaClasse);
            expect(resultado.propriedades['id']).toBe(42);
            expect(resultado.propriedades['titulo']).toBe('Específico');
        });

        it('buscarPorId() retorna null quando não encontra', async () => {
            const resultado = await colecaoComTecnologia.buscarPorId(999);
            expect(resultado).toBeNull();
        });

        it('modificar() atualiza registro existente', async () => {
            const registro = new ObjetoDeleguaClasse(descritorTipoClasse);
            registro.propriedades["id"] = 1;
            registro.propriedades["titulo"] = "Original";
            registro.propriedades["conteudo"] = "Conteúdo original";
            await colecaoComTecnologia.salvar(registro);

            registro.propriedades["titulo"] = "Atualizado";
            const resultado = await colecaoComTecnologia.modificar(registro, ["titulo"]);

            expect(resultado[0].linhasAfetadas).toBe(1);
        });

        it('remover() exclui registro', async () => {
            const registro = new ObjetoDeleguaClasse(descritorTipoClasse);
            registro.propriedades["id"] = 1;
            registro.propriedades["titulo"] = "Para excluir";
            registro.propriedades["conteudo"] = "Será excluído";
            await colecaoComTecnologia.salvar(registro);

            const resultado = await colecaoComTecnologia.remover(registro);

            expect(resultado[0].linhasAfetadas).toBe(1);
            expect(tecnologiaMock.dadosEmMemoria['Artigo']).toHaveLength(0);
        });
    });
});