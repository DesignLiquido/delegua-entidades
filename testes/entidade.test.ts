import {
    DescritorTipoClasse,
    ObjetoDeleguaClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { Classe, PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Lexador, Simbolo } from "@designliquido/delegua/lexador";
import { AvaliadorSintatico } from "@designliquido/delegua/avaliador-sintatico";
import { Criar } from "@designliquido/lincones-js";

import { Entidade } from "../fontes/entidade";

describe('Entidade', () => {
    let lexador: Lexador;
    let avaliadorSintatico: AvaliadorSintatico;

    beforeEach(() => {
        lexador = new Lexador();
        avaliadorSintatico = new AvaliadorSintatico();
    });

    describe('Inicialização por classe', () => {
        it('Classe com id', async () => {
            const retornoLexador = lexador.mapear(
                [
                    'classe Artigo {',
                    '  id: numero',
                    '  titulo: texto',
                    '  conteudo: texto',
                    '}'
                ],
                -1
            );
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);

            const classe = retornoAvaliadorSintatico.declaracoes[0] as Classe;

            let entidade: Entidade;
            expect(() => {
                entidade = new Entidade(classe);
            }).not.toThrow();
            expect(entidade.modelo).toBeInstanceOf(DescritorTipoClasse);
            expect(entidade.modelo.propriedades).toHaveLength(3);
        });

        it('Classe com decorador de chave', async () => {
            const retornoLexador = lexador.mapear(
                [
                    'classe Artigo {',
                    '  @chave',
                    '  artigoId: numero',
                    '  titulo: texto',
                    '  conteudo: texto',
                    '}'
                ],
                -1
            );
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);

            const classe = retornoAvaliadorSintatico.declaracoes[0] as Classe;
            let entidade: Entidade;
            expect(() => {
                entidade = new Entidade(classe);
            }).not.toThrow();
            expect(entidade.modelo).toBeInstanceOf(DescritorTipoClasse);
            expect(entidade.modelo.propriedades).toHaveLength(3);
        });
    });

    describe('traduzirTipo()', () => {
        const descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Teste", "Teste", 1, -1),
            null,
            {},
            [new PropriedadeClasse(new Simbolo("IDENTIFICADOR", "id", "id", 1, -1), 'numero', [])]
        );
        const entidade = new Entidade(descritor);

        it('traduz tipos numéricos', () => {
            expect(entidade.traduzirTipo('numero')).toBe('INTEIRO');
            expect(entidade.traduzirTipo('número')).toBe('INTEIRO');
            expect(entidade.traduzirTipo('inteiro')).toBe('INTEIRO');
            expect(entidade.traduzirTipo('longo')).toBe('INTEIRO');
            expect(entidade.traduzirTipo('decimal')).toBe('NUMERO');
        });

        it('traduz tipos de texto', () => {
            expect(entidade.traduzirTipo('texto')).toBe('TEXTO');
            expect(entidade.traduzirTipo('caracteres')).toBe('CARACTERES');
        });

        it('traduz tipo lógico', () => {
            expect(entidade.traduzirTipo('logico')).toBe('LOGICO');
            expect(entidade.traduzirTipo('lógico')).toBe('LOGICO');
        });

        it('lança erro para tipo desconhecido', () => {
            expect(() => entidade.traduzirTipo('invalido')).toThrow();
        });
    });

    describe('gerarComandoCriarTabela()', () => {
        it('gera comando Criar com colunas corretas', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Artigo", "Artigo", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(new Simbolo("IDENTIFICADOR", "id", "id", 1, -1), 'numero', []),
                    new PropriedadeClasse(new Simbolo("IDENTIFICADOR", "titulo", "titulo", 2, -1), 'texto', []),
                ]
            );
            const entidade = new Entidade(descritor);
            const comando = entidade.gerarComandoCriarTabela();

            expect(comando).toBeInstanceOf(Criar);
            expect(comando.nomeEntidade).toBe('Artigo');
            expect(comando.colunas).toHaveLength(2);
            expect(comando.seNaoExistir).toBe(true);

            const colunaId = comando.colunas[0];
            expect(colunaId.nomeColuna).toBe('id');
            expect(colunaId.chavePrimaria).toBe(true);
            expect(colunaId.autoIncremento).toBe(true);
            expect(colunaId.nulo).toBe(false);

            const colunaTitulo = comando.colunas[1];
            expect(colunaTitulo.nomeColuna).toBe('titulo');
            expect(colunaTitulo.chavePrimaria).toBe(false);
            expect(colunaTitulo.nulo).toBe(true);
        });
    });

    describe('hidratarRegistro/s()', () => {
        const descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Artigo", "Artigo", 1, -1),
            null,
            {},
            [
                new PropriedadeClasse(new Simbolo("IDENTIFICADOR", "id", "id", 1, -1), 'numero', []),
                new PropriedadeClasse(new Simbolo("IDENTIFICADOR", "titulo", "titulo", 2, -1), 'texto', []),
            ]
        );
        const entidade = new Entidade(descritor);

        it('hidrata um registro', () => {
            const resultado = entidade.hidratarRegistro({ id: 1, titulo: "Teste" });

            expect(resultado).toBeInstanceOf(ObjetoDeleguaClasse);
            expect(resultado.propriedades['id']).toBe(1);
            expect(resultado.propriedades['titulo']).toBe("Teste");
        });

        it('hidrata múltiplos registros', () => {
            const resultados = entidade.hidratarRegistros([
                { id: 1, titulo: "Primeiro" },
                { id: 2, titulo: "Segundo" },
            ]);

            expect(resultados).toHaveLength(2);
            expect(resultados[0].propriedades['titulo']).toBe("Primeiro");
            expect(resultados[1].propriedades['titulo']).toBe("Segundo");
        });

        it('ignora colunas que não existem no modelo', () => {
            const resultado = entidade.hidratarRegistro({ id: 1, titulo: "Teste", extra: "ignorado" });

            expect(resultado.propriedades['id']).toBe(1);
            expect(resultado.propriedades['extra']).toBeUndefined();
        });
    });
});
