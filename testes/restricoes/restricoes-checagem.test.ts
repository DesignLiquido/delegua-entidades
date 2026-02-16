import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../../fontes/entidade";
import { GeradorMigracoes } from "../../fontes/migracoes/gerador-migracoes";
import { RestricaoInterface } from "../../fontes/interfaces-tipos/restricao-interface";

describe('Restrições de checagem', () => {
    describe('Detecção de @restricao', () => {
        it('detecta restrição CHECK em campo numérico', () => {
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
                        new Simbolo("IDENTIFICADOR", "preco", "preco", 4, -1),
                        'decimal',
                        [new Decorador(-1, 4, 'restricao', {
                            sql: 'preco > 0',
                            restricao: 'preco > 0'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const restricoes = entidade.obterRestricoes();

            expect(restricoes.length).toBe(1);
            expect(restricoes[0].sql).toBe('preco > 0');
            expect(restricoes[0].tipo).toBe('CHECK');
        });

        it('detecta restrição CHECK em campo texto', () => {
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
                        new Simbolo("IDENTIFICADOR", "genero", "genero", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'restricao', {
                            sql: "genero IN ('M', 'F')",
                            restricao: "genero IN ('M', 'F')"
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const restricoes = entidade.obterRestricoes();

            expect(restricoes.length).toBe(1);
            expect(restricoes[0].sql).toContain("IN");
        });

        it('detecta múltiplas restrições em diferentes campos', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "idade", "idade", 4, -1),
                        'número',
                        [new Decorador(-1, 4, 'restricao', {
                            sql: 'idade >= 0 AND idade <= 150',
                            restricao: 'idade >= 0 AND idade <= 150'
                        })]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "salario", "salario", 6, -1),
                        'decimal',
                        [new Decorador(-1, 6, 'restricao', {
                            sql: 'salario >= 0',
                            restricao: 'salario >= 0'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const restricoes = entidade.obterRestricoes();

            expect(restricoes.length).toBe(2);
        });

        it('permite especificar nome customizado para restrição', () => {
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
                        new Simbolo("IDENTIFICADOR", "quantidade", "quantidade", 4, -1),
                        'número',
                        [new Decorador(-1, 4, 'restricao', {
                            nome: 'chk_quantidade_positiva',
                            sql: 'quantidade > 0',
                            restricao: 'quantidade > 0'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const restricoes = entidade.obterRestricoes();

            expect(restricoes[0].nome).toBe('chk_quantidade_positiva');
        });

        it('gera nome padrão para restrição se não especificado', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Desconto", "Desconto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "percentual", "percentual", 4, -1),
                        'decimal',
                        [new Decorador(-1, 4, 'restricao', {
                            sql: 'percentual >= 0 AND percentual <= 100',
                            restricao: 'percentual >= 0 AND percentual <= 100'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const restricoes = entidade.obterRestricoes();

            expect(restricoes[0].nome).toMatch(/constr_percentual/);
        });
    });

    describe('Geração de migrações com restrições', () => {
        it('inclui restrições na migração de criação de tabela', () => {
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
                        new Simbolo("IDENTIFICADOR", "preco", "preco", 4, -1),
                        'decimal',
                        [new Decorador(-1, 4, 'restricao', {
                            sql: 'preco > 0',
                            restricao: 'preco > 0'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const migracao = GeradorMigracoes.gerar([entidade], [], '001', 'Criar tabela Produto');

            const operacoesCriarTabela = migracao.operacoes.filter(op => op.tipo === 'criarTabela');
            const operacoesRestricao = migracao.operacoes.filter(op => op.tipo === 'adicionarRestricao');

            expect(operacoesCriarTabela.length).toBe(1);
            expect(operacoesRestricao.length).toBe(1);
            expect(operacoesRestricao[0].sqlRestricao).toBe('preco > 0');
        });

        it('gera múltiplas operações de restrição para múltiplas restrições', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "idade", "idade", 4, -1),
                        'número',
                        [new Decorador(-1, 4, 'restricao', {
                            sql: 'idade >= 18',
                            restricao: 'idade >= 18'
                        })]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "salario", "salario", 6, -1),
                        'decimal',
                        [new Decorador(-1, 6, 'restricao', {
                            sql: 'salario > 0',
                            restricao: 'salario > 0'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const migracao = GeradorMigracoes.gerar([entidade], [], '001', 'Criar tabela Pessoa');

            const operacoesRestricao = migracao.operacoes.filter(op => op.tipo === 'adicionarRestricao');
            expect(operacoesRestricao.length).toBe(2);
        });
    });

    describe('Casos de uso comuns de restrições', () => {
        it('permite restrição de intervalo numérico', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Avaliacao", "Avaliacao", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "estrelas", "estrelas", 4, -1),
                        'número',
                        [new Decorador(-1, 4, 'restricao', {
                            sql: 'estrelas >= 1 AND estrelas <= 5',
                            restricao: 'estrelas >= 1 AND estrelas <= 5'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const restricoes = entidade.obterRestricoes();

            expect(restricoes[0].sql).toBe('estrelas >= 1 AND estrelas <= 5');
        });

        it('permite restrição com IN para valores enumeráveis', () => {
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
                        new Simbolo("IDENTIFICADOR", "status", "status", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'restricao', {
                            sql: "status IN ('pendente', 'processando', 'finalizado', 'cancelado')",
                            restricao: "status IN ('pendente', 'processando', 'finalizado', 'cancelado')"
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const restricoes = entidade.obterRestricoes();

            expect(restricoes[0].sql).toContain('IN');
        });
    });
});
