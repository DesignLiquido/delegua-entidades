import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { TecnologiaMock } from "./auxiliar/tecnologia-mock";

describe('Hooks', () => {
    const descritorTipoClasse = new DescritorTipoClasse(
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
                new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                'texto',
                []
            ),
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "preco", "preco", 5, -1),
                'decimal',
                []
            )
        ]
    );

    const entidade = new Entidade(descritorTipoClasse);
    let tecnologiaMock: TecnologiaMock;
    let colecao: Colecao<Entidade>;

    beforeEach(() => {
        tecnologiaMock = new TecnologiaMock();
        tecnologiaMock.dadosEmMemoria['Produto'] = [];
        colecao = new Colecao(entidade, tecnologiaMock);
    });

    function criarRegistro(id: number, nome: string, preco: number): ObjetoDeleguaClasse {
        const registro = new ObjetoDeleguaClasse(descritorTipoClasse);
        registro.propriedades['id'] = id;
        registro.propriedades['nome'] = nome;
        registro.propriedades['preco'] = preco;
        return registro;
    }

    describe('Registro de hooks', () => {
        it('permite registrar um hook antesDeInserir', () => {
            const hook = jest.fn();
            colecao.adicionarHook('antesDeInserir', hook);
            expect(colecao.hooks.antesDeInserir).toContain(hook);
        });

        it('permite registrar múltiplos hooks para o mesmo evento', () => {
            const hook1 = jest.fn();
            const hook2 = jest.fn();
            colecao.adicionarHook('antesDeInserir', hook1);
            colecao.adicionarHook('antesDeInserir', hook2);
            expect(colecao.hooks.antesDeInserir).toHaveLength(2);
        });
    });

    describe('Execução de hooks', () => {
        it('executa hook antesDeInserir antes de salvar', async () => {
            const ordemExecucao: string[] = [];

            colecao.adicionarHook('antesDeInserir', async () => {
                ordemExecucao.push('antesDeInserir');
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ordemExecucao).toContain('antesDeInserir');
        });

        it('executa hook aposInserir após salvar', async () => {
            const ordemExecucao: string[] = [];

            colecao.adicionarHook('aposInserir', async () => {
                ordemExecucao.push('aposInserir');
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ordemExecucao).toContain('aposInserir');
        });

        it('executa hooks na ordem correta (antes -> operação -> após)', async () => {
            const ordemExecucao: string[] = [];

            colecao.adicionarHook('antesDeInserir', async () => {
                ordemExecucao.push('antes');
            });
            colecao.adicionarHook('aposInserir', async () => {
                ordemExecucao.push('apos');
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ordemExecucao[0]).toBe('antes');
            expect(ordemExecucao[1]).toBe('apos');
        });

        it('executa múltiplos hooks sequencialmente', async () => {
            const ordemExecucao: number[] = [];

            colecao.adicionarHook('antesDeInserir', async () => {
                ordemExecucao.push(1);
            });
            colecao.adicionarHook('antesDeInserir', async () => {
                ordemExecucao.push(2);
            });
            colecao.adicionarHook('antesDeInserir', async () => {
                ordemExecucao.push(3);
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ordemExecucao).toEqual([1, 2, 3]);
        });

        it('executa hooks de atualização', async () => {
            const hookAntes = jest.fn();
            const hookApos = jest.fn();

            colecao.adicionarHook('antesDeAtualizar', hookAntes);
            colecao.adicionarHook('aposAtualizar', hookApos);

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            registro.propriedades['nome'] = 'Produto B';
            await colecao.modificar(registro);

            expect(hookAntes).toHaveBeenCalled();
            expect(hookApos).toHaveBeenCalled();
        });

        it('executa hooks de exclusão', async () => {
            const hookAntes = jest.fn();
            const hookApos = jest.fn();

            colecao.adicionarHook('antesDeExcluir', hookAntes);
            colecao.adicionarHook('aposExcluir', hookApos);

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);
            await colecao.remover(registro);

            expect(hookAntes).toHaveBeenCalled();
            expect(hookApos).toHaveBeenCalled();
        });

        it('hook pode modificar o registro antes da inserção', async () => {
            colecao.adicionarHook('antesDeInserir', async (registro) => {
                registro.propriedades['nome'] = registro.propriedades['nome'].toUpperCase();
            });

            const registro = criarRegistro(1, 'produto a', 10.0);
            await colecao.salvar(registro);

            expect(registro.propriedades['nome']).toBe('PRODUTO A');
        });

        it('hook assíncrono é aguardado', async () => {
            let hookFinalizado = false;

            colecao.adicionarHook('antesDeInserir', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                hookFinalizado = true;
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(hookFinalizado).toBe(true);
        });
    });
});
