import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Ganchos', () => {
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
    let tecnologiaMock: BonecoTecnologia;
    let colecao: Colecao<Entidade>;

    beforeEach(() => {
        tecnologiaMock = new BonecoTecnologia();
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

    describe('Registro de ganchos', () => {
        it('permite registrar um gancho antesDeInserir', () => {
            const gancho = jest.fn();
            colecao.adicionarGancho('antesDeInserir', gancho);
            expect(colecao.ganchos.antesDeInserir).toContain(gancho);
        });

        it('permite registrar múltiplos ganchos para o mesmo evento', () => {
            const gancho1 = jest.fn();
            const gancho2 = jest.fn();
            colecao.adicionarGancho('antesDeInserir', gancho1);
            colecao.adicionarGancho('antesDeInserir', gancho2);
            expect(colecao.ganchos.antesDeInserir).toHaveLength(2);
        });
    });

    describe('Execução de ganchos', () => {
        it('executa gancho antesDeInserir antes de salvar', async () => {
            const ordemExecucao: string[] = [];

            colecao.adicionarGancho('antesDeInserir', async () => {
                ordemExecucao.push('antesDeInserir');
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ordemExecucao).toContain('antesDeInserir');
        });

        it('executa gancho aposInserir após salvar', async () => {
            const ordemExecucao: string[] = [];

            colecao.adicionarGancho('aposInserir', async () => {
                ordemExecucao.push('aposInserir');
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ordemExecucao).toContain('aposInserir');
        });

        it('executa ganchos na ordem correta (antes -> operação -> após)', async () => {
            const ordemExecucao: string[] = [];

            colecao.adicionarGancho('antesDeInserir', async () => {
                ordemExecucao.push('antes');
            });
            colecao.adicionarGancho('aposInserir', async () => {
                ordemExecucao.push('apos');
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ordemExecucao[0]).toBe('antes');
            expect(ordemExecucao[1]).toBe('apos');
        });

        it('executa múltiplos ganchos sequencialmente', async () => {
            const ordemExecucao: number[] = [];

            colecao.adicionarGancho('antesDeInserir', async () => {
                ordemExecucao.push(1);
            });
            colecao.adicionarGancho('antesDeInserir', async () => {
                ordemExecucao.push(2);
            });
            colecao.adicionarGancho('antesDeInserir', async () => {
                ordemExecucao.push(3);
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ordemExecucao).toEqual([1, 2, 3]);
        });

        it('executa ganchos de atualização', async () => {
            const ganchoAntes = jest.fn();
            const ganchoApos = jest.fn();

            colecao.adicionarGancho('antesDeAtualizar', ganchoAntes);
            colecao.adicionarGancho('aposAtualizar', ganchoApos);

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            registro.propriedades['nome'] = 'Produto B';
            await colecao.modificar(registro);

            expect(ganchoAntes).toHaveBeenCalled();
            expect(ganchoApos).toHaveBeenCalled();
        });

        it('executa ganchos de exclusão', async () => {
            const ganchoAntes = jest.fn();
            const ganchoApos = jest.fn();

            colecao.adicionarGancho('antesDeExcluir', ganchoAntes);
            colecao.adicionarGancho('aposExcluir', ganchoApos);

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);
            await colecao.remover(registro);

            expect(ganchoAntes).toHaveBeenCalled();
            expect(ganchoApos).toHaveBeenCalled();
        });

        it('gancho pode modificar o registro antes da inserção', async () => {
            colecao.adicionarGancho('antesDeInserir', async (registro) => {
                registro.propriedades['nome'] = registro.propriedades['nome'].toUpperCase();
            });

            const registro = criarRegistro(1, 'produto a', 10.0);
            await colecao.salvar(registro);

            expect(registro.propriedades['nome']).toBe('PRODUTO A');
        });

        it('gancho assíncrono é aguardado', async () => {
            let ganchoFinalizado = false;

            colecao.adicionarGancho('antesDeInserir', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                ganchoFinalizado = true;
            });

            const registro = criarRegistro(1, 'Produto A', 10.0);
            await colecao.salvar(registro);

            expect(ganchoFinalizado).toBe(true);
        });
    });
});
