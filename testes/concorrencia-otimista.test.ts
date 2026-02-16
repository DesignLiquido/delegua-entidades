import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { ErroConcorrencia } from "../fontes/erros/erro-concorrencia";

/**
 * Testes para concorrência otimista com detecção e incremento de versão
 */
describe("Concorrência Otimista", () => {
    describe("Detecção de campo de versão por convenção", () => {
        it("deve detectar campo versao por nome", () => {
            const descritorTipoClasse = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                        "texto",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "versao", "versao", 5, -1),
                        "número",
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritorTipoClasse);
            expect(entidade.obterNomePropriedadeVersao()).toBe("versao");
        });

        it("deve retornar vazio quando não há campo de versão", () => {
            const descritorTipoClasse = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Artigo", "Artigo", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "titulo", "titulo", 4, -1),
                        "texto",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "conteudo", "conteudo", 5, -1),
                        "texto",
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritorTipoClasse);
            expect(entidade.obterNomePropriedadeVersao()).toBe("");
        });
    });

    describe("Incremento de versão na consulta atualizar()", () => {
        it("deve adicionar versão ao comando de atualização", () => {
            const descritorTipoClasse = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                        "texto",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "versao", "versao", 5, -1),
                        "número",
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritorTipoClasse);
            const colecao = new Colecao(entidade);

            const usuario = new ObjetoDeleguaClasse(descritorTipoClasse);
            usuario.propriedades["id"] = 1;
            usuario.propriedades["nome"] = "João Silva";
            usuario.propriedades["versao"] = 1;

            const comando = colecao.atualizar(usuario);

            // Deve ter adicionado a versão ao comando
            expect(comando.colunasEValores.length).toBeGreaterThanOrEqual(3); // id, nome, versao
            expect(comando.condicoes.length).toBeGreaterThanOrEqual(2); // chave primária + versão

            // Versão no objeto deve ter incrementado
            expect(usuario.propriedades["versao"]).toBe(2);
        });

        it("deve inicializar versão em 1 se for nula", () => {
            const descritorTipoClasse = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                        "texto",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "versao", "versao", 5, -1),
                        "número",
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritorTipoClasse);
            const colecao = new Colecao(entidade);

            const usuario = new ObjetoDeleguaClasse(descritorTipoClasse);
            usuario.propriedades["id"] = 1;
            usuario.propriedades["nome"] = "Maria Silva";
            usuario.propriedades["versao"] = null;

            const comando = colecao.atualizar(usuario);

            // Deve ter inicializado em 1
            expect(usuario.propriedades["versao"]).toBe(1);
        });

        it("deve incluir versão anterior na cláusula WHERE", () => {
            const descritorTipoClasse = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                        "texto",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "versao", "versao", 5, -1),
                        "número",
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritorTipoClasse);
            const colecao = new Colecao(entidade);

            const usuario = new ObjetoDeleguaClasse(descritorTipoClasse);
            usuario.propriedades["id"] = 2;
            usuario.propriedades["nome"] = "Pedro";
            usuario.propriedades["versao"] = 3;

            const comando = colecao.atualizar(usuario);

            // Deve ter 2 condições: por chave primária e por versão
            expect(comando.condicoes.length).toBe(2);
        });

        it("não deve adicionar versão quando não há campo de versão", () => {
            const descritorTipoClasse = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Artigo", "Artigo", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "titulo", "titulo", 4, -1),
                        "texto",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "conteudo", "conteudo", 5, -1),
                        "texto",
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritorTipoClasse);
            const colecao = new Colecao(entidade);

            const artigo = new ObjetoDeleguaClasse(descritorTipoClasse);
            artigo.propriedades["id"] = 1;
            artigo.propriedades["titulo"] = "Meu Artigo";
            artigo.propriedades["conteudo"] = "Conteúdo";

            const comando = colecao.atualizar(artigo);

            // Deve ter apenas 1 condição (chave primária)
            expect(comando.condicoes.length).toBe(1);
            // Deve ter apenas 3 colunas (id, titulo, conteudo)
            expect(comando.colunasEValores.length).toBe(3);
        });
    });

    describe("Erro de concorrência", () => {
        it("deve criar instância de ErroConcorrencia com mensagem", () => {
            const mensagem = "Conflito de concorrência detectado";
            const erro = new ErroConcorrencia(mensagem);

            expect(erro).toBeInstanceOf(Error);
            expect(erro.message).toBe(mensagem);
            expect(erro.name).toBe("ErroConcorrencia");
        });

        it("deve criar instância com mensagem padrão", () => {
            const erro = new ErroConcorrencia();

            expect(erro).toBeInstanceOf(Error);
            expect(erro.name).toBe("ErroConcorrencia");
            expect(erro.message).toBeTruthy(); // Deve ter mensagem padrão
        });
    });

    describe("Coluna exclusão lógica com versão", () => {
        it("deve detectar ambas as propriedades", () => {
            const descritorTipoClasse = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                        "texto",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "versao", "versao", 5, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 6, -1),
                        "texto",
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritorTipoClasse);

            expect(entidade.obterNomePropriedadeVersao()).toBe("versao");
            expect(entidade.possuiExclusaoLogica()).toBe(true);
        });
    });

    describe("Múltiplos registros", () => {
        it("deve atualizar vários registros com versão", () => {
            const descritorTipoClasse = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        "número",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                        "texto",
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "versao", "versao", 5, -1),
                        "número",
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritorTipoClasse);
            const colecao = new Colecao(entidade);

            const usuario1 = new ObjetoDeleguaClasse(descritorTipoClasse);
            usuario1.propriedades["id"] = 1;
            usuario1.propriedades["nome"] = "Alice";
            usuario1.propriedades["versao"] = 1;

            const usuario2 = new ObjetoDeleguaClasse(descritorTipoClasse);
            usuario2.propriedades["id"] = 2;
            usuario2.propriedades["nome"] = "Bob";
            usuario2.propriedades["versao"] = 2;

            // Simular operação de atualização em lote (não executa, apenas valida)
            // A execução real seria async e depende do banco de dados
            expect(() => {
                colecao.atualizar(usuario1);
                colecao.atualizar(usuario2);
            }).not.toThrow();

            // Ambos devem ter incrementado versão
            expect(usuario1.propriedades["versao"]).toBe(2);
            expect(usuario2.propriedades["versao"]).toBe(3);
        });
    });
});

