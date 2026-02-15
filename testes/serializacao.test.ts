import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { Serializador } from "../fontes/serializador";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Serialização (4.6)', () => {
    describe('Serialização para Dicionário', () => {
        test('deve serializar registro simples para dicionário', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João Silva",
                email: "joao@example.com"
            };

            const dicionario = Serializador.paraDicionario(registro, entidade);

            expect(dicionario.id).toBe(1);
            expect(dicionario.nome).toBe("João Silva");
            expect(dicionario.email).toBe("joao@example.com");
        });

        test('deve incluir campos null na serialização', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João",
                email: null
            };

            const dicionario = Serializador.paraDicionario(registro, entidade);

            expect(dicionario.email).toBeNull();
        });

        test('deve filtrar campos quando opção incluir é usada', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "senha", "senha", 5, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João",
                email: "joao@example.com",
                senha: "secret123"
            };

            const dicionario = Serializador.paraDicionario(registro, entidade, {
                incluir: ["id", "nome"]
            });

            expect(dicionario.id).toBe(1);
            expect(dicionario.nome).toBe("João");
            expect(dicionario.email).toBeUndefined();
            expect(dicionario.senha).toBeUndefined();
        });

        test('deve excluir campos quando opção excluir é usada', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "senha", "senha", 5, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João",
                email: "joao@example.com",
                senha: "secret123"
            };

            const dicionario = Serializador.paraDicionario(registro, entidade, {
                excluir: ["senha"]
            });

            expect(dicionario.id).toBe(1);
            expect(dicionario.nome).toBe("João");
            expect(dicionario.email).toBe("joao@example.com");
            expect(dicionario.senha).toBeUndefined();
        });
    });

    describe('Serialização para JSON', () => {
        test('deve serializar registro para string JSON válida', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João"
            };

            const json = Serializador.paraJson(registro, entidade);

            expect(typeof json).toBe('string');
            expect(() => JSON.parse(json)).not.toThrow();

            const parsed = JSON.parse(json);
            expect(parsed.id).toBe(1);
            expect(parsed.nome).toBe("João");
        });

        test('deve respeitar opções de filtro em serialização JSON', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "senha", "senha", 4, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João",
                senha: "secret"
            };

            const json = Serializador.paraJson(registro, entidade, {
                excluir: ["senha"]
            });

            const parsed = JSON.parse(json);
            expect(parsed.senha).toBeUndefined();
            expect(parsed.nome).toBe("João");
        });
    });

    describe('Serialização em Múltiplos Registros', () => {
        test('deve serializar múltiplos registros para array de dicionários', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);

            const registro1 = new ObjetoDeleguaClasse(entidade.modelo);
            registro1.propriedades = { id: 1, nome: "João" };

            const registro2 = new ObjetoDeleguaClasse(entidade.modelo);
            registro2.propriedades = { id: 2, nome: "Maria" };

            const dicionarios = Serializador.muitosParaDicionario(
                [registro1, registro2],
                entidade
            );

            expect(dicionarios).toHaveLength(2);
            expect(dicionarios[0].nome).toBe("João");
            expect(dicionarios[1].nome).toBe("Maria");
        });

        test('deve serializar múltiplos registros para JSON array', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);

            const registro1 = new ObjetoDeleguaClasse(entidade.modelo);
            registro1.propriedades = { id: 1, nome: "João" };

            const registro2 = new ObjetoDeleguaClasse(entidade.modelo);
            registro2.propriedades = { id: 2, nome: "Maria" };

            const json = Serializador.muitosParaJson(
                [registro1, registro2],
                entidade
            );

            expect(typeof json).toBe('string');
            const parsed = JSON.parse(json);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(2);
            expect(parsed[0].nome).toBe("João");
            expect(parsed[1].nome).toBe("Maria");
        });

        test('deve serializar array vazio corretamente', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);

            const dicionarios = Serializador.muitosParaDicionario([], entidade);
            expect(dicionarios).toHaveLength(0);

            const json = Serializador.muitosParaJson([], entidade);
            expect(JSON.parse(json)).toEqual([]);
        });
    });

    describe('Integração com Colecao', () => {
        test('deve serializar via método de colecao', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Produto", "Produto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "preco", "preco", 4, -1),
                        'decimal',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologia);

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "Notebook",
                preco: 3000.50
            };

            const dicionario = colecao.serializarParaDicionario(registro);

            expect(dicionario.id).toBe(1);
            expect(dicionario.nome).toBe("Notebook");
            expect(dicionario.preco).toBe(3000.50);
        });

        test('deve serializar múltiplos via método de colecao', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Produto", "Produto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologia);

            const registro1 = new ObjetoDeleguaClasse(entidade.modelo);
            registro1.propriedades = { id: 1, nome: "Notebook" };

            const registro2 = new ObjetoDeleguaClasse(entidade.modelo);
            registro2.propriedades = { id: 2, nome: "Mouse" };

            const dicionarios = colecao.serializarMuitosParaDicionario(
                [registro1, registro2]
            );

            expect(dicionarios).toHaveLength(2);
            expect(dicionarios[1].nome).toBe("Mouse");
        });

        test('deve serializar para JSON via colecao com opções de filtro', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "senha", "senha", 5, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologia);

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João",
                email: "joao@example.com",
                senha: "secret"
            };

            const json = colecao.serializarParaJson(registro, {
                excluir: ["senha"]
            });

            const parsed = JSON.parse(json);
            expect(parsed.senha).toBeUndefined();
            expect(parsed.nome).toBe("João");
        });
    });

    describe('Casos Especiais', () => {
        test('deve serializar valores booleanos corretamente', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "ativo", "ativo", 3, -1),
                        'lógico',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                ativo: true
            };

            const dicionario = Serializador.paraDicionario(registro, entidade);
            expect(dicionario.ativo).toBe(true);

            const json = Serializador.paraJson(registro, entidade);
            const parsed = JSON.parse(json);
            expect(parsed.ativo).toBe(true);
        });

        test('deve serializar números decimais corretamente', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Produto", "Produto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "preco", "preco", 3, -1),
                        'decimal',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                preco: 99.99
            };

            const dicionario = Serializador.paraDicionario(registro, entidade);
            expect(dicionario.preco).toBe(99.99);
        });

        test('deve preservar ordem de campos no dicionário', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João",
                email: "joao@example.com"
            };

            const dicionario = Serializador.paraDicionario(registro, entidade);
            const chaves = Object.keys(dicionario);

            expect(chaves[0]).toBe("id");
            expect(chaves[1]).toBe("nome");
            expect(chaves[2]).toBe("email");
        });
    });
});
