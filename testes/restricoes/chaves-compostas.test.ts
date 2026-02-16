import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Condicao } from "@designliquido/lincones-js";

import { Entidade } from "../../fontes/entidade";

describe('Chaves Compostas', () => {
    describe('Detecção de chaves primárias compostas', () => {
        it('detecta múltiplas chaves com decorador @chave', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "PedidoItem", "PedidoItem", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "pedido_id", "pedido_id", 3, -1),
                        'número',
                        [new Decorador(-1, 3, 'chave', {})]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "item_id", "item_id", 5, -1),
                        'número',
                        [new Decorador(-1, 5, 'chave', {})]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "quantidade", "quantidade", 7, -1),
                        'número',
                        []
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const chaves = entidade.obterNomesChavesPrimarias();

            expect(chaves.length).toBeGreaterThanOrEqual(1);
            expect(chaves).toContain('pedido_id');
            expect(chaves).toContain('item_id');
        });

        it('mantém compatibilidade com chave primária simples (id)', () => {
            const descritor = new DescritorTipoClasse(
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

            const entidade = new Entidade(descritor);
            const chavePrimaria = entidade.obterNomeChavePrimaria();
            const chaves = entidade.obterNomesChavesPrimarias();

            expect(chavePrimaria).toBe('id');
            expect(chaves).toContain('id');
        });

        it('suporta chave primária simples com decorador @chave', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Produto", "Produto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "codigo", "codigo", 3, -1),
                        'texto',
                        [new Decorador(-1, 3, 'chave', {})]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 5, -1),
                        'texto',
                        []
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const chavePrimaria = entidade.obterNomeChavePrimaria();
            const chaves = entidade.obterNomesChavesPrimarias();

            expect(chavePrimaria).toBe('codigo');
            expect(chaves).toContain('codigo');
        });

        it('lança erro quando nenhuma chave primária é definida', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Invalido", "Invalido", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    ),
                ]
            );

            expect(() => {
                new Entidade(descritor);
            }).toThrow();
        });
    });

    describe('Resolução de condições por chave primária', () => {
        it('gera condição WHERE simples para chave primária única', () => {
            const descritor = new DescritorTipoClasse(
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

            const entidade = new Entidade(descritor);
            const { ObjetoDeleguaClasse } = require("@designliquido/delegua/interpretador/estruturas");
            
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 123;
            registro.propriedades['nome'] = 'João';

            const condicao = entidade.resolverCondicaoPorChavePrimaria(registro);
            
            expect(condicao).toBeDefined();
            expect(condicao.operador).toBe('IGUAL');
        });

        it('gera primeira condição para chaves compostas', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "PedidoItem", "PedidoItem", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "pedido_id", "pedido_id", 3, -1),
                        'número',
                        [new Decorador(-1, 3, 'chave', {})]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "item_id", "item_id", 5, -1),
                        'número',
                        [new Decorador(-1, 5, 'chave', {})]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const { ObjetoDeleguaClasse } = require("@designliquido/delegua/interpretador/estruturas");
            
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['pedido_id'] = 1;
            registro.propriedades['item_id'] = 10;

            const condicao = entidade.resolverCondicaoPorChavePrimaria(registro);
            
            expect(condicao).toBeDefined();
            expect(condicao.operador).toBe('IGUAL');
        });
    });
});
