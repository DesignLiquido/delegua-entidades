import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { GeradorMigracoes } from "../fontes/migracoes/gerador-migracoes";

describe('Índices', () => {
    describe('Detecção de @indice', () => {
        it('detecta um índice simples em uma coluna', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Produto", "Produto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "sku", "sku", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'indice', {})]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const indices = entidade.obterIndices();

            expect(indices.length).toBe(1);
            expect(indices[0].nome).toMatch(/idx_sku/);
            expect(indices[0].colunas).toContain('sku');
            expect(indices[0].unico).toBe(false);
        });

        it('detecta um índice único com @indiceUnico', () => {
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
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'indiceUnico', {})]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const indices = entidade.obterIndices();

            expect(indices.length).toBe(1);
            expect(indices[0].unico).toBe(true);
            expect(indices[0].colunas).toContain('email');
        });

        it('detecta múltiplos índices em diferentes colunas', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pedido", "Pedido", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "numero_pedido", "numero_pedido", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'indice', {})]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "status", "status", 6, -1),
                        'texto',
                        [new Decorador(-1, 4, 'indice', {})]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const indices = entidade.obterIndices();

            expect(indices.length).toBe(2);
            expect(indices.some(i => i.colunas.includes('numero_pedido'))).toBe(true);
            expect(indices.some(i => i.colunas.includes('status'))).toBe(true);
        });

        it('permite especificar nome customizado para índice', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Produto", "Produto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "codigo", "codigo", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'indice', {
                            nome: 'idx_codigo_produto'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const indices = entidade.obterIndices();

            expect(indices[0].nome).toBe('idx_codigo_produto');
        });
    });

    describe('Geração de migrações com índices', () => {
        it('inclui índices na migração de criação de tabela', () => {
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
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'indiceUnico', {})]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const migracao = GeradorMigracoes.gerar([entidade], [], '001', 'Criar tabela Usuario');

            const operacoesCriarTabela = migracao.operacoes.filter(op => op.tipo === 'criarTabela');
            const operacoesIndice = migracao.operacoes.filter(op => op.tipo === 'adicionarIndice');

            expect(operacoesCriarTabela.length).toBe(1);
            expect(operacoesIndice.length).toBe(1);
            expect(operacoesIndice[0].unico).toBe(true);
            expect(operacoesIndice[0].columnasIndice).toContain('email');
        });

        it('gera múltiplas operações de índice para múltiplos índices', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pedido", "Pedido", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "numero", "numero", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'indice', {})]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "status", "status", 6, -1),
                        'texto',
                        [new Decorador(-1, 6, 'indice', {})]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const migracao = GeradorMigracoes.gerar([entidade], [], '001', 'Criar tabela Pedido');

            const operacoesIndice = migracao.operacoes.filter(op => op.tipo === 'adicionarIndice');
            expect(operacoesIndice.length).toBe(2);
        });
    });

    describe('Índices com tipos específicos', () => {
        it('permite especificar tipo de índice (BTREE, HASH, GIST, GIN)', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Documento", "Documento", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "conteudo", "conteudo", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'indice', {
                            tipo: 'GIN'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const indices = entidade.obterIndices();

            expect(indices[0].tipo).toBe('GIN');
        });
    });
});
