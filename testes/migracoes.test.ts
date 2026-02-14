import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Coluna } from "@designliquido/lincones-js";

import { Migracao } from "../fontes/migracoes/migracao";
import { ExecutorMigracoes } from "../fontes/migracoes/executor-migracoes";
import { GeradorMigracoes, SchemaInfo } from "../fontes/migracoes/gerador-migracoes";
import { Entidade } from "../fontes/entidade";
import { Taquigrafo } from "../fontes/taquigrafia";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Migrações', () => {
    describe('Migracao (definição)', () => {
        it('cria migração com versão e descrição', () => {
            const migracao = new Migracao('001', 'Criar tabelas iniciais');

            expect(migracao.versao).toBe('001');
            expect(migracao.descricao).toBe('Criar tabelas iniciais');
            expect(migracao.operacoes).toHaveLength(0);
        });

        it('encadeia operações (chainable)', () => {
            const migracao = new Migracao('001', 'Teste')
                .criarTabela('Artigo', [new Coluna('id', 'INTEIRO')])
                .adicionarColuna('Artigo', new Coluna('descricao', 'TEXTO'))
                .excluirTabela('TabelaVelha');

            expect(migracao.operacoes).toHaveLength(3);
        });

        it('registra operação criarTabela', () => {
            const colunas = [
                new Coluna('id', 'INTEIRO', undefined, false, true, false, true),
                new Coluna('nome', 'TEXTO')
            ];
            const migracao = new Migracao('001', 'Criar Usuario')
                .criarTabela('Usuario', colunas);

            expect(migracao.operacoes[0].tipo).toBe('criarTabela');
            expect(migracao.operacoes[0].tabela).toBe('Usuario');
            expect(migracao.operacoes[0].colunas).toHaveLength(2);
        });

        it('registra operação excluirTabela', () => {
            const migracao = new Migracao('002', 'Remover tabela')
                .excluirTabela('TabelaObsoleta');

            expect(migracao.operacoes[0].tipo).toBe('excluirTabela');
            expect(migracao.operacoes[0].tabela).toBe('TabelaObsoleta');
        });

        it('registra operação adicionarColuna', () => {
            const coluna = new Coluna('email', 'TEXTO', undefined, true);
            const migracao = new Migracao('003', 'Adicionar email')
                .adicionarColuna('Usuario', coluna);

            expect(migracao.operacoes[0].tipo).toBe('adicionarColuna');
            expect(migracao.operacoes[0].tabela).toBe('Usuario');
            expect(migracao.operacoes[0].coluna.nomeColuna).toBe('email');
        });

        it('registra operação removerColuna', () => {
            const migracao = new Migracao('004', 'Remover campo')
                .removerColuna('Usuario', 'campo_obsoleto');

            expect(migracao.operacoes[0].tipo).toBe('removerColuna');
            expect(migracao.operacoes[0].nomeColuna).toBe('campo_obsoleto');
        });

        it('registra operação alterarColuna', () => {
            const coluna = new Coluna('nome', 'CARACTERES');
            const migracao = new Migracao('005', 'Alterar tipo')
                .alterarColuna('Usuario', coluna);

            expect(migracao.operacoes[0].tipo).toBe('alterarColuna');
            expect(migracao.operacoes[0].coluna.nomeColuna).toBe('nome');
        });
    });

    describe('ExecutorMigracoes', () => {
        let tecnologiaMock: BonecoTecnologia;

        beforeEach(() => {
            tecnologiaMock = new BonecoTecnologia();
        });

        it('executa migração criarTabela', async () => {
            const executor = new ExecutorMigracoes(tecnologiaMock);
            const migracao = new Migracao('001', 'Criar Artigo')
                .criarTabela('Artigo', [
                    new Coluna('id', 'INTEIRO', undefined, false, true, false, true),
                    new Coluna('titulo', 'TEXTO')
                ]);

            await executor.executar(migracao);

            expect(tecnologiaMock.comandosExecutados).toHaveLength(1);
            expect(tecnologiaMock.comandosExecutados[0].constructor.name).toBe('Criar');
        });

        it('executa migração excluirTabela', async () => {
            const executor = new ExecutorMigracoes(tecnologiaMock);
            const migracao = new Migracao('002', 'Excluir tabela')
                .excluirTabela('TabelaVelha');

            await executor.executar(migracao);

            expect(tecnologiaMock.comandosExecutados).toHaveLength(1);
            expect(tecnologiaMock.comandosExecutados[0].constructor.name).toBe('RemoverEntidade');
        });

        it('executa migração adicionarColuna via Alterar', async () => {
            const executor = new ExecutorMigracoes(tecnologiaMock);
            const migracao = new Migracao('003', 'Adicionar coluna')
                .adicionarColuna('Artigo', new Coluna('descricao', 'TEXTO'));

            await executor.executar(migracao);

            expect(tecnologiaMock.comandosExecutados).toHaveLength(1);
            expect(tecnologiaMock.comandosExecutados[0].constructor.name).toBe('Alterar');
        });

        it('executa migração alterarColuna via Alterar', async () => {
            const executor = new ExecutorMigracoes(tecnologiaMock);
            const migracao = new Migracao('004', 'Alterar coluna')
                .alterarColuna('Artigo', new Coluna('titulo', 'CARACTERES'));

            await executor.executar(migracao);

            expect(tecnologiaMock.comandosExecutados).toHaveLength(1);
            expect(tecnologiaMock.comandosExecutados[0].constructor.name).toBe('Alterar');
        });

        it('executa migração removerColuna via SQL direto', async () => {
            const executor = new ExecutorMigracoes(tecnologiaMock);
            const migracao = new Migracao('005', 'Remover coluna')
                .removerColuna('Artigo', 'campo_obsoleto');

            await executor.executar(migracao);

            // removerColuna usa tecnologia.executar() com SQL direto
            // Agora rastreamos comandos SQL também
            expect(tecnologiaMock.comandosExecutados).toHaveLength(1);
            expect(typeof tecnologiaMock.comandosExecutados[0]).toBe('string');
            expect(tecnologiaMock.comandosExecutados[0]).toContain('DROP COLUMN');
        });

        it('executarTodas executa múltiplas migrações em ordem', async () => {
            const executor = new ExecutorMigracoes(tecnologiaMock);
            const migracoes = [
                new Migracao('001', 'Criar tabela').criarTabela('Artigo', [new Coluna('id', 'INTEIRO')]),
                new Migracao('002', 'Adicionar coluna').adicionarColuna('Artigo', new Coluna('titulo', 'TEXTO')),
            ];

            await executor.executarTodas(migracoes);

            expect(tecnologiaMock.comandosExecutados).toHaveLength(2);
        });

        it('usa logger quando disponível', async () => {
            const mensagens: string[] = [];
            const logger = new Taquigrafo('info', (msg) => mensagens.push(msg));
            const executor = new ExecutorMigracoes(tecnologiaMock, logger);
            const migracao = new Migracao('001', 'Teste log')
                .criarTabela('Artigo', [new Coluna('id', 'INTEIRO')]);

            await executor.executar(migracao);

            expect(mensagens.length).toBeGreaterThan(0);
            expect(mensagens.some(m => m.includes('001'))).toBe(true);
        });
    });

    describe('GeradorMigracoes', () => {
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

        it('gera criarTabela para entidade nova', () => {
            const entidade = new Entidade(descritorArtigo);
            const migracao = GeradorMigracoes.gerar([entidade], []);

            expect(migracao.operacoes).toHaveLength(1);
            expect(migracao.operacoes[0].tipo).toBe('criarTabela');
            expect(migracao.operacoes[0].tabela).toBe('Artigo');
            expect(migracao.operacoes[0].colunas).toHaveLength(2);
        });

        it('gera excluirTabela para tabela que não tem entidade correspondente', () => {
            const schemaAtual: SchemaInfo[] = [
                { nomeTabela: 'TabelaObsoleta', colunas: [{ nome: 'id', tipo: 'INTEIRO' }] }
            ];

            const migracao = GeradorMigracoes.gerar([], schemaAtual);

            expect(migracao.operacoes).toHaveLength(1);
            expect(migracao.operacoes[0].tipo).toBe('excluirTabela');
            expect(migracao.operacoes[0].tabela).toBe('TabelaObsoleta');
        });

        it('gera adicionarColuna para coluna nova', () => {
            const entidade = new Entidade(descritorArtigo);
            const schemaAtual: SchemaInfo[] = [
                { nomeTabela: 'Artigo', colunas: [{ nome: 'id', tipo: 'INTEIRO' }] }
            ];

            const migracao = GeradorMigracoes.gerar([entidade], schemaAtual);

            const ops = migracao.operacoes.filter(o => o.tipo === 'adicionarColuna');
            expect(ops).toHaveLength(1);
            expect(ops[0].coluna.nomeColuna).toBe('titulo');
        });

        it('gera removerColuna para coluna que não existe na entidade', () => {
            const entidade = new Entidade(descritorArtigo);
            const schemaAtual: SchemaInfo[] = [
                {
                    nomeTabela: 'Artigo',
                    colunas: [
                        { nome: 'id', tipo: 'INTEIRO' },
                        { nome: 'titulo', tipo: 'TEXTO' },
                        { nome: 'campo_obsoleto', tipo: 'TEXTO' }
                    ]
                }
            ];

            const migracao = GeradorMigracoes.gerar([entidade], schemaAtual);

            const ops = migracao.operacoes.filter(o => o.tipo === 'removerColuna');
            expect(ops).toHaveLength(1);
            expect(ops[0].nomeColuna).toBe('campo_obsoleto');
        });

        it('gera alterarColuna quando tipo muda', () => {
            const entidade = new Entidade(descritorArtigo);
            const schemaAtual: SchemaInfo[] = [
                {
                    nomeTabela: 'Artigo',
                    colunas: [
                        { nome: 'id', tipo: 'INTEIRO' },
                        { nome: 'titulo', tipo: 'INTEIRO' }  // tipo diferente
                    ]
                }
            ];

            const migracao = GeradorMigracoes.gerar([entidade], schemaAtual);

            const ops = migracao.operacoes.filter(o => o.tipo === 'alterarColuna');
            expect(ops).toHaveLength(1);
            expect(ops[0].coluna.nomeColuna).toBe('titulo');
        });

        it('não gera operações quando schema está igual', () => {
            const entidade = new Entidade(descritorArtigo);
            const schemaAtual: SchemaInfo[] = [
                {
                    nomeTabela: 'Artigo',
                    colunas: [
                        { nome: 'id', tipo: 'INTEIRO' },
                        { nome: 'titulo', tipo: 'TEXTO' }
                    ]
                }
            ];

            const migracao = GeradorMigracoes.gerar([entidade], schemaAtual);

            expect(migracao.operacoes).toHaveLength(0);
        });

        it('usa versão e descrição customizadas', () => {
            const migracao = GeradorMigracoes.gerar([], [], '042', 'Migração especial');

            expect(migracao.versao).toBe('042');
            expect(migracao.descricao).toBe('Migração especial');
        });
    });
});
