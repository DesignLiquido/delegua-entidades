import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { ContextoEntidades } from "../fontes/contexto-entidades";
import { Entidade } from "../fontes/entidade";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Transações', () => {
    describe('Gerenciamento de transações', () => {
        it('inicia uma transação', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao();

            expect(transacao).toBeDefined();
            expect(transacao.estaAtiva()).toBe(true);
            expect(contexto.possuiTransacao()).toBe(true);
        });

        it('obtém a transação atual', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao1 = contexto.iniciarTransacao();
            const transacao2 = contexto.obterTransacao();

            expect(transacao1).toBe(transacao2);
        });

        it('retorna null quando não há transação ativa', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            expect(contexto.obterTransacao()).toBeNull();
            expect(contexto.possuiTransacao()).toBe(false);
        });

        it('lança erro ao iniciar transação quando já existe uma ativa', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            contexto.iniciarTransacao();

            expect(() => contexto.iniciarTransacao())
                .toThrow('Já existe uma transação ativa neste contexto');
        });

        it('confirma uma transação', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao();
            expect(transacao.estaAtiva()).toBe(true);

            await contexto.confirmarTransacao();

            expect(transacao.estaAtiva()).toBe(false);
            expect(contexto.possuiTransacao()).toBe(false);
        });

        it('reverte uma transação', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao();
            expect(transacao.estaAtiva()).toBe(true);

            await contexto.reverterTransacao();

            expect(transacao.estaAtiva()).toBe(false);
            expect(contexto.possuiTransacao()).toBe(false);
        });

        it('lança erro ao confirmar quando não há transação', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            await expect(contexto.confirmarTransacao())
                .rejects.toThrow('Nenhuma transação ativa');
        });

        it('lança erro ao reverter quando não há transação', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            await expect(contexto.reverterTransacao())
                .rejects.toThrow('Nenhuma transação ativa');
        });
    });

    describe('Operações dentro de transações', () => {
        it('registra operações de inserção em transação', async () => {
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
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            contexto.registrarColecao(entidade);

            const transacao = contexto.iniciarTransacao() as any;
            expect(transacao.obterOperacoes().length).toBe(0);

            const usuario = new ObjetoDeleguaClasse(descritor);
            usuario.propriedades = { id: 1, nome: 'João' };

            const operacao = { tipo: 'INSERIR', tabela: 'Usuario' };
            transacao.registrarOperacao(operacao);

            expect(transacao.obterOperacoes().length).toBe(1);

            await contexto.confirmarTransacao();
        });

        it('limpa operações ao confirmar transação', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao() as any;
            transacao.registrarOperacao({ tipo: 'INSERIR' });
            transacao.registrarOperacao({ tipo: 'ATUALIZAR' });

            expect(transacao.obterOperacoes().length).toBe(2);

            await contexto.confirmarTransacao();

            // Depois de confirmar, não podemos mais acessar a transação
            expect(contexto.obterTransacao()).toBeNull();
        });

        it('limpa operações ao reverter transação', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao() as any;
            transacao.registrarOperacao({ tipo: 'INSERIR' });
            transacao.registrarOperacao({ tipo: 'ATUALIZAR' });

            expect(transacao.obterOperacoes().length).toBe(2);

            await contexto.reverterTransacao();

            expect(contexto.obterTransacao()).toBeNull();
        });
    });

    describe('Estado de transação', () => {
        it('transação começa ativa', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao();

            expect(transacao.estaAtiva()).toBe(true);
        });

        it('transação fica inativa após confirmação', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao();
            await contexto.confirmarTransacao();

            expect(transacao.estaAtiva()).toBe(false);
        });

        it('transação fica inativa após revertimento', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao();
            await contexto.reverterTransacao();

            expect(transacao.estaAtiva()).toBe(false);
        });

        it('lança erro ao registrar operação em transação inativa', async () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const transacao = contexto.iniciarTransacao() as any;
            await contexto.confirmarTransacao();

            expect(() => {
                transacao.registrarOperacao({ tipo: 'INSERIR' });
            }).toThrow('Transação não está ativa');
        });
    });
});
