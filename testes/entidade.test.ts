import * as sistemaArquivos from "fs";

import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/estruturas";
import { Classe, PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { SimboloInterface } from "@designliquido/delegua/interfaces";
import { Lexador } from "@designliquido/delegua/lexador";
import { AvaliadorSintatico } from "@designliquido/delegua/avaliador-sintatico";

import { Entidade } from "../fontes/entidade";
import { TabelaInterface } from "../fontes/interfaces/tabela-interface";

describe('Entidade', () => {
    let lexador: Lexador;
    let avaliadorSintatico: AvaliadorSintatico;

    beforeEach(() => {
        lexador = new Lexador();
        avaliadorSintatico = new AvaliadorSintatico();
    });

    describe('Inicialização por classe', () => {
        it('Classe com id', () => {
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
            const retornoAvaliadorSintatico = avaliadorSintatico.analisar(retornoLexador, -1);
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

        it('Classe com decorador de chave', () => {
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
            const retornoAvaliadorSintatico = avaliadorSintatico.analisar(retornoLexador, -1);
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

    describe('Gerar código SQL', () => {
        describe('Selecionar', () => {
            lexador = new Lexador();
            avaliadorSintatico = new AvaliadorSintatico();

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
            const retornoAvaliadorSintatico = avaliadorSintatico.analisar(retornoLexador, -1);
            const classe = retornoAvaliadorSintatico.declaracoes[0] as Classe;
            const entidades = new Entidade(classe);

            it('Selecionar tudo', () => {
                const consultaSql = entidades.gerarSQLSelecionar();
                expect(consultaSql).toContain('SELECT artigoId, titulo, conteudo FROM Artigo');
            });

            it('Selecionar com condições', () => {
                const consultaSql = entidades.gerarSQLSelecionar({artigoId: 123});
                expect(consultaSql).toContain('SELECT artigoId, titulo, conteudo FROM Artigo WHERE artigoId = 123');
            });
        });
    });

    describe('Métodos de seleção', () => {
        it('obterPorCondicao', () => {
            lexador = new Lexador();
            avaliadorSintatico = new AvaliadorSintatico();

            const retornoLexador = lexador.mapear(
                [
                    'classe Artigo {',
                    '  @chave',
                    '  artigoId: numero',
                    '  titulo: texto',
                    '  conteudo: texto',
                    '}',
                    `const entidades = importar('entidades')`,
                    'const artigos = entidades.modelo(Artigo).todos()'
                ],
                -1
            );
            const retornoAvaliadorSintatico = avaliadorSintatico.analisar(retornoLexador, -1);
            expect(retornoAvaliadorSintatico).toBeTruthy();
        });
    });
})

/* describe("Entidade", () => {
    let entidades: Entidade;
    let classe: ObjetoDeleguaClasse;

    beforeEach(() => {
        entidades = new Entidade(process.cwd(), "dados");
        entidades.iniciar();

        let propriedadeClasse = new PropriedadeClasse(
            {
                hashArquivo: -1,
                lexema: "nome",
                linha: -1,
                literal: "nome",
                tipo: "nome",
            } as SimboloInterface,
            "texto"
        );
        let deleguaClasse = new DeleguaClasse(
            {
                hashArquivo: -1,
                lexema: "Usuarios",
                linha: -1,
                literal: "Usuarios",
                tipo: "classe",
            } as SimboloInterface,
            null,
            {},
            [propriedadeClasse]
        );
        classe = new ObjetoDeleguaClasse(deleguaClasse);
        classe.definir(
            {
                hashArquivo: -1,
                lexema: "nome",
                linha: -1,
                literal: "nome",
                tipo: "nome",
            } as SimboloInterface,
            "italo"
        );
    });

    describe("obterNomesModelos", () => {
        it("Esperado que retorno um array de nomes dos arquivo", () => {
            const expected = sistemaArquivos.readdirSync(
                `${process.cwd()}/dados`
            );
            const actual = entidades.obterNomesModelos();
            expect(actual).toEqual(expected);
        });

        it("Esperado que retorne um array vazio", () => {
            const expected = [];
            const actual = new Entidade(
                process.cwd(),
                "dados/nenhum_modelo"
            ).obterNomesModelos();
            expect(actual).toEqual(expected);
        });
    });

    describe("traduzirTipo", () => {
        it("Esperado que retorne o valor int para numero", () => {
            const resultado = entidades.traduzirTipo("numero");
            expect(resultado).toBe("int");
        });

        it("Esperado que retorne o valor varchar para texto", () => {
            const resultado = entidades.traduzirTipo("texto");
            expect(resultado).toBe("varchar");
        });

        it("Esperado que retorne um erro para valores não válidos.", () => {
            expect(() => entidades.traduzirTipo("invalido")).toThrow();
        });
    });

    it("Esperado que retorne um erro para tabela não encontrada.", () => {
        expect(() => entidades.procurarTabela("tabela_invalida")).toThrow();
    });

    it("Esperado que retorne a tabela encontrada.", () => {
        const tabela: TabelaInterface = entidades.procurarTabela("Usuarios");
        expect(tabela).toBeTruthy();
    });

    it("Esperado que retorne a query de criação da tabela.", () => {
        const resultado = entidades.gerarCodigoSQLCriar(classe);
        const esperado = "CREATE TABLE Usuarios (id int, nome varchar);";
        expect(resultado).toBe(esperado);
    });

    it.skip("Esperado que retorne a query de inserção de dados na tabela.", () => {
        const resultado = entidades.gerarCodigoSQLInserir(classe);
        const esperado = "INSERT INTO Usuarios (id, nome) VALUES (?, ?);";
        expect(resultado).toBe(esperado);
    });

    it.skip("Esperado que retorne a query de alteração dos dados na tabela.", () => {
        const resultado = entidades.gerarCodigoSQLAtualizar(classe);
        const esperado = "UPDATE Usuarios SET nome = ? WHERE id = ?;";
        expect(resultado).toBe(esperado);
    });

    it.skip("Esperado que retorne a query de exclusão dos dados na tabela.", () => {
        const resultado = entidades.gerarCodigoSQLExcluir(classe);
        const esperado = "DELETE FROM Usuarios WHERE id = ?;";
        expect(resultado).toBe(esperado);
    });

    it("Esperado que retorne a query de seleção dos dados na tabela.", () => {
        const resultado = entidades.gerarCodigoSQLSelecionarTodos(classe);
        const esperado = "SELECT * FROM Usuarios;";
        expect(resultado).toBe(esperado);
    });

    it.skip("Esperado que retorne a query de seleção de um dado na tabela.", () => {
        const resultado = entidades.gerarCodigoSQLSelecionarUm(classe);
        const esperado = "SELECT * FROM Usuarios WHERE id = ?;";
        expect(resultado).toBe(esperado);
    });

    it("Esperado que retorne um erro para classe não encontrada.", () => {
        expect(() =>
            entidades.gerarCodigoSQLCriar(
                new ObjetoDeleguaClasse(new DeleguaClasse())
            )
        ).toThrow();
    });

    it("Esperado que retorne um erro para classe não encontrada.", () => {
        expect(() =>
            entidades.gerarCodigoSQLInserir(
                new ObjetoDeleguaClasse(new DeleguaClasse())
            )
        ).toThrow();
    });

    it("Esperado que retorne um erro para classe não encontrada.", () => {
        expect(() =>
            entidades.gerarCodigoSQLAtualizar(
                new ObjetoDeleguaClasse(new DeleguaClasse())
            )
        ).toThrow();
    });

    it("Esperado que retorne um erro para classe não encontrada.", () => {
        expect(() =>
            entidades.gerarCodigoSQLExcluir(
                new ObjetoDeleguaClasse(new DeleguaClasse())
            )
        ).toThrow();
    });

    it("Esperado que retorne um erro para classe não encontrada.", () => {
        expect(() =>
            entidades.gerarCodigoSQLSelecionarTodos(
                new ObjetoDeleguaClasse(new DeleguaClasse())
            )
        ).toThrow();
    });

    it("Esperado que retorne um erro para classe não encontrada.", () => {
        expect(() =>
            entidades.gerarCodigoSQLSelecionarUm(
                new ObjetoDeleguaClasse(new DeleguaClasse())
            )
        ).toThrow();
    });
}); */