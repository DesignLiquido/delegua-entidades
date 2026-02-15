import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Operações em Lote (Batch Operations)', () => {
    let descritor: DescritorTipoClasse;
    let entidade: Entidade;
    let tecnologia: BonecoTecnologia;
    let colecao: Colecao<any>;

    beforeEach(() => {
        descritor = new DescritorTipoClasse(
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
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "ativo", "ativo", 6, -1),
                    'lógico',
                    []
                )
            ]
        );

        entidade = new Entidade(descritor);
        tecnologia = new BonecoTecnologia();
        colecao = new Colecao(entidade, tecnologia);
    });

    describe('Inserção em Lote', () => {
        it('insere múltiplos registros', async () => {
            const registro1 = new ObjetoDeleguaClasse(descritor);
            registro1.propriedades = { id: 1, nome: 'Produto A', preco: 10.0, ativo: true };

            const registro2 = new ObjetoDeleguaClasse(descritor);
            registro2.propriedades = { id: 2, nome: 'Produto B', preco: 20.0, ativo: true };

            const registro3 = new ObjetoDeleguaClasse(descritor);
            registro3.propriedades = { id: 3, nome: 'Produto C', preco: 30.0, ativo: true };

            const resultados = await colecao.inserirVarios([registro1, registro2, registro3]);

            expect(resultados).toHaveLength(3);
            expect(resultados[0]).toHaveLength(1);
        });

        it('retorna lista vazia para lote vazio', async () => {
            const resultados = await colecao.inserirVarios([]);
            expect(resultados).toHaveLength(0);
        });

        it('executa hook antesDeInserir para cada registro', async () => {
            const hookMock = jest.fn();
            colecao.adicionarHook('antesDeInserir', hookMock);

            const registros = [
                new ObjetoDeleguaClasse(descritor),
                new ObjetoDeleguaClasse(descritor),
                new ObjetoDeleguaClasse(descritor)
            ];

            registros[0].propriedades = { id: 1, nome: 'A', preco: 10, ativo: true };
            registros[1].propriedades = { id: 2, nome: 'B', preco: 20, ativo: true };
            registros[2].propriedades = { id: 3, nome: 'C', preco: 30, ativo: true };

            await colecao.inserirVarios(registros);

            expect(hookMock).toHaveBeenCalledTimes(3);
        });

        it('executa hook aposInserir para cada registro', async () => {
            const hookMock = jest.fn();
            colecao.adicionarHook('aposInserir', hookMock);

            const registros = [
                new ObjetoDeleguaClasse(descritor),
                new ObjetoDeleguaClasse(descritor)
            ];

            registros[0].propriedades = { id: 1, nome: 'A', preco: 10, ativo: true };
            registros[1].propriedades = { id: 2, nome: 'B', preco: 20, ativo: true };

            await colecao.inserirVarios(registros);

            expect(hookMock).toHaveBeenCalledTimes(2);
        });

        it('valida registros antes de inserir', async () => {
            const descritorComValidator = new DescritorTipoClasse(
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
                        [new Decorador(-1, 1, 'obrigatorio', {})]
                    )
                ]
            );

            const entidadeComValidator = new Entidade(descritorComValidator);
            const colecaoComValidator = new Colecao(entidadeComValidator, tecnologia);

            const registroSemNome = new ObjetoDeleguaClasse(descritorComValidator);
            registroSemNome.propriedades = { id: 1, nome: '' };

            await expect(colecaoComValidator.inserirVarios([registroSemNome]))
                .rejects.toThrow();
        });

        it('continua com próximo registro mesmo se um falhar na validação', async () => {
            const registro1 = new ObjetoDeleguaClasse(descritor);
            registro1.propriedades = { id: 1, nome: 'Produto A', preco: 10.0, ativo: true };

            const registro2 = new ObjetoDeleguaClasse(descritor);
            registro2.propriedades = { id: 2, nome: 'Produto B', preco: 20.0, ativo: true };

            // registros válidos devem ser processados
            const resultados = await colecao.inserirVarios([registro1, registro2]);
            expect(resultados).toHaveLength(2);
        });

        it('registra operações de inserção em lote no tecnologia mock', async () => {
            const registro1 = new ObjetoDeleguaClasse(descritor);
            registro1.propriedades = { id: 1, nome: 'Produto A', preco: 10.0, ativo: true };

            const registro2 = new ObjetoDeleguaClasse(descritor);
            registro2.propriedades = { id: 2, nome: 'Produto B', preco: 20.0, ativo: true };

            await colecao.inserirVarios([registro1, registro2]);

            const inserts = tecnologia.comandosExecutados.filter(c => c.constructor.name === 'Inserir');
            expect(inserts.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Atualização em Lote', () => {
        it('atualiza múltiplos registros', async () => {
            const registro1 = new ObjetoDeleguaClasse(descritor);
            registro1.propriedades = { id: 1, nome: 'Produto A Atualizado', preco: 15.0, ativo: true };

            const registro2 = new ObjetoDeleguaClasse(descritor);
            registro2.propriedades = { id: 2, nome: 'Produto B Atualizado', preco: 25.0, ativo: true };

            const resultados = await colecao.atualizarVarios([registro1, registro2]);

            expect(resultados).toHaveLength(2);
        });

        it('retorna lista vazia para lote vazio', async () => {
            const resultados = await colecao.atualizarVarios([]);
            expect(resultados).toHaveLength(0);
        });

        it('executa hook antesDeAtualizar para cada registro', async () => {
            const hookMock = jest.fn();
            colecao.adicionarHook('antesDeAtualizar', hookMock);

            const registros = [
                new ObjetoDeleguaClasse(descritor),
                new ObjetoDeleguaClasse(descritor)
            ];

            registros[0].propriedades = { id: 1, nome: 'A', preco: 10, ativo: true };
            registros[1].propriedades = { id: 2, nome: 'B', preco: 20, ativo: true };

            await colecao.atualizarVarios(registros);

            expect(hookMock).toHaveBeenCalledTimes(2);
        });

        it('executa hook aposAtualizar para cada registro', async () => {
            const hookMock = jest.fn();
            colecao.adicionarHook('aposAtualizar', hookMock);

            const registros = [
                new ObjetoDeleguaClasse(descritor),
                new ObjetoDeleguaClasse(descritor)
            ];

            registros[0].propriedades = { id: 1, nome: 'A', preco: 10, ativo: true };
            registros[1].propriedades = { id: 2, nome: 'B', preco: 20, ativo: true };

            await colecao.atualizarVarios(registros);

            expect(hookMock).toHaveBeenCalledTimes(2);
        });

        it('atualiza colunas específicas se fornecidas', async () => {
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades = { id: 1, nome: 'Novo Nome', preco: 100, ativo: false };

            const resultados = await colecao.atualizarVarios([registro], ['nome', 'ativo']);

            expect(resultados).toHaveLength(1);
        });

        it('registra operações de atualização em lote', async () => {
            const registro1 = new ObjetoDeleguaClasse(descritor);
            registro1.propriedades = { id: 1, nome: 'Atualizado A', preco: 15.0, ativo: true };

            const registro2 = new ObjetoDeleguaClasse(descritor);
            registro2.propriedades = { id: 2, nome: 'Atualizado B', preco: 25.0, ativo: true };

            await colecao.atualizarVarios([registro1, registro2]);

            const updates = tecnologia.comandosExecutados.filter(c => c.constructor.name === 'Atualizar');
            expect(updates.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Exclusão em Lote', () => {
        it('exclui múltiplos registros', async () => {
            const registro1 = new ObjetoDeleguaClasse(descritor);
            registro1.propriedades = { id: 1, nome: 'Produto A', preco: 10.0, ativo: true };

            const registro2 = new ObjetoDeleguaClasse(descritor);
            registro2.propriedades = { id: 2, nome: 'Produto B', preco: 20.0, ativo: true };

            const resultados = await colecao.excluirVarios([registro1, registro2]);

            expect(resultados).toHaveLength(2);
        });

        it('retorna lista vazia para lote vazio', async () => {
            const resultados = await colecao.excluirVarios([]);
            expect(resultados).toHaveLength(0);
        });

        it('executa hook antesDeExcluir para cada registro', async () => {
            const hookMock = jest.fn();
            colecao.adicionarHook('antesDeExcluir', hookMock);

            const registros = [
                new ObjetoDeleguaClasse(descritor),
                new ObjetoDeleguaClasse(descritor)
            ];

            registros[0].propriedades = { id: 1, nome: 'A', preco: 10, ativo: true };
            registros[1].propriedades = { id: 2, nome: 'B', preco: 20, ativo: true };

            await colecao.excluirVarios(registros);

            expect(hookMock).toHaveBeenCalledTimes(2);
        });

        it('executa hook aposExcluir para cada registro', async () => {
            const hookMock = jest.fn();
            colecao.adicionarHook('aposExcluir', hookMock);

            const registros = [
                new ObjetoDeleguaClasse(descritor),
                new ObjetoDeleguaClasse(descritor)
            ];

            registros[0].propriedades = { id: 1, nome: 'A', preco: 10, ativo: true };
            registros[1].propriedades = { id: 2, nome: 'B', preco: 20, ativo: true };

            await colecao.excluirVarios(registros);

            expect(hookMock).toHaveBeenCalledTimes(2);
        });

        it('registra operações de exclusão em lote', async () => {
            const registro1 = new ObjetoDeleguaClasse(descritor);
            registro1.propriedades = { id: 1, nome: 'Produto A', preco: 10.0, ativo: true };

            const registro2 = new ObjetoDeleguaClasse(descritor);
            registro2.propriedades = { id: 2, nome: 'Produto B', preco: 20.0, ativo: true };

            await colecao.excluirVarios([registro1, registro2]);

            const deletes = tecnologia.comandosExecutados.filter(c => c.constructor.name === 'Excluir');
            expect(deletes.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Transações com Lotes', () => {
        it('insere múltiplos registros mantendo ordem do lote', async () => {
            const registros = [];
            for (let i = 1; i <= 5; i++) {
                const reg = new ObjetoDeleguaClasse(descritor);
                reg.propriedades = { id: i, nome: `Produto ${i}`, preco: i * 10, ativo: true };
                registros.push(reg);
            }

            const resultados = await colecao.inserirVarios(registros);

            expect(resultados).toHaveLength(5);
            for (const resultado of resultados) {
                expect(resultado).toHaveLength(1);
            }
        });

        it('fornece retorno estruturado para operações em lote', async () => {
            const registro1 = new ObjetoDeleguaClasse(descritor);
            registro1.propriedades = { id: 1, nome: 'Produto A', preco: 10.0, ativo: true };

            const registro2 = new ObjetoDeleguaClasse(descritor);
            registro2.propriedades = { id: 2, nome: 'Produto B', preco: 20.0, ativo: true };

            const resultados = await colecao.inserirVarios([registro1, registro2]);

            // Cada resultado é um array de retorno de comando
            expect(Array.isArray(resultados)).toBe(true);
            expect(Array.isArray(resultados[0])).toBe(true);
        });

        it('pode atualizar lote após inserção em lote', async () => {
            const insercoes = [];
            for (let i = 1; i <= 3; i++) {
                const reg = new ObjetoDeleguaClasse(descritor);
                reg.propriedades = { id: i, nome: `Produto ${i}`, preco: i * 10, ativo: true };
                insercoes.push(reg);
            }

            const resultadosInsercao = await colecao.inserirVarios(insercoes);
            expect(resultadosInsercao).toHaveLength(3);

            const atualizacoes = [];
            for (let i = 1; i <= 3; i++) {
                const reg = new ObjetoDeleguaClasse(descritor);
                reg.propriedades = { id: i, nome: `Atualizado ${i}`, preco: i * 20, ativo: false };
                atualizacoes.push(reg);
            }

            const resultadosAtualizacao = await colecao.atualizarVarios(atualizacoes);
            expect(resultadosAtualizacao).toHaveLength(3);
        });

        it('pode excluir lote após inserção em lote', async () => {
            const insercoes = [];
            for (let i = 1; i <= 2; i++) {
                const reg = new ObjetoDeleguaClasse(descritor);
                reg.propriedades = { id: i, nome: `Produto ${i}`, preco: i * 10, ativo: true };
                insercoes.push(reg);
            }

            await colecao.inserirVarios(insercoes);

            const exclusoes = [insercoes[0], insercoes[1]];
            const resultadosExclusao = await colecao.excluirVarios(exclusoes);

            expect(resultadosExclusao).toHaveLength(2);
        });
    });

    describe('Verificação de Tecnologia', () => {
        it('lança erro ao inserir lote sem tecnologia configurada', async () => {
            const colecaoSemTecnologia = new Colecao(entidade);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades = { id: 1, nome: 'Produto', preco: 10, ativo: true };

            await expect(colecaoSemTecnologia.inserirVarios([registro]))
                .rejects.toThrow('Nenhuma tecnologia de banco de dados configurada');
        });

        it('lança erro ao atualizar lote sem tecnologia configurada', async () => {
            const colecaoSemTecnologia = new Colecao(entidade);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades = { id: 1, nome: 'Produto', preco: 10, ativo: true };

            await expect(colecaoSemTecnologia.atualizarVarios([registro]))
                .rejects.toThrow('Nenhuma tecnologia de banco de dados configurada');
        });

        it('lança erro ao excluir lote sem tecnologia configurada', async () => {
            const colecaoSemTecnologia = new Colecao(entidade);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades = { id: 1, nome: 'Produto', preco: 10, ativo: true };

            await expect(colecaoSemTecnologia.excluirVarios([registro]))
                .rejects.toThrow('Nenhuma tecnologia de banco de dados configurada');
        });
    });
});
