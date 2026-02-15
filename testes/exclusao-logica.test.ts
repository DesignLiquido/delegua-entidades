import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { ConstrutorConsulta } from "../fontes/construtor-consulta";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Exclusão Lógica (Soft Delete)', () => {
    describe('Detecção de Exclusão Lógica', () => {
        test('deve detectar exclusão lógica via decorador @exclusaoLogica', () => {
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
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, "exclusaoLogica", {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);

            expect(entidade.possuiExclusaoLogica()).toBe(true);
        });

        test('deve detectar exclusão lógica via coluna "excluido_em"', () => {
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
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 4, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);

            expect(entidade.possuiExclusaoLogica()).toBe(true);
        });

        test('deve retornar false se não houver soft delete', () => {
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

            expect(entidade.possuiExclusaoLogica()).toBe(false);
        });
    });

    describe('Nome da Coluna de Exclusão', () => {
        test('deve retornar "excluido_em" como padrão', () => {
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
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, "exclusaoLogica", {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);

            expect(entidade.obterNomeColunaExclusaoLogica()).toBe("excluido_em");
        });
    });

    describe('Conversão de Exclusão para Atualização', () => {
        test('deve converter excluir para atualizar com soft delete', () => {
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
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, "exclusaoLogica", {})]
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
                excluido_em: null
            };

            const comando = colecao.excluir(registro);

            expect(comando.constructor.name).toBe("Atualizar");
        });

        test('deve retornar Excluir se sem soft delete', () => {
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
            const tecnologia = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologia);

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João"
            };

            const comando = colecao.excluir(registro);

            expect(comando.constructor.name).toBe("Excluir");
        });
    });

    describe('Filtragem Automática em Consultas', () => {
        test('deve adicionar WHERE excluido_em IS NULL automaticamente', () => {
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
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, "exclusaoLogica", {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const construtor = new ConstrutorConsulta(entidade, tecnologia);

            const sql = construtor.gerarSql();

            expect(sql).toContain("WHERE");
            expect(sql).toContain("excluido_em IS NULL");
        });

        test('deve omitir filtro se incluirExcluidos() chamado', () => {
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
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, "exclusaoLogica", {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const construtor = new ConstrutorConsulta(entidade, tecnologia);

            construtor.incluirExcluidos();
            const sql = construtor.gerarSql();

            expect(sql).not.toContain("excluido_em IS NULL");
        });

        test('não deve filtrar sem soft delete', () => {
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
            const tecnologia = new BonecoTecnologia();
            const construtor = new ConstrutorConsulta(entidade, tecnologia);

            const sql = construtor.gerarSql();

            expect(sql).not.toContain("IS NULL");
        });
    });

    describe('Restauração de Registros', () => {
        test('deve restaurar registro excluído logicamente', async () => {
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
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, "exclusaoLogica", {})]
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
                excluido_em: new Date().toISOString()
            };

            const resultado = await colecao.restaurar(registro);

            expect(Array.isArray(resultado)).toBe(true);
            expect(registro.propriedades.excluido_em).toBeNull();
        });

        test('deve lançar erro restaurando sem soft delete', async () => {
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
            const tecnologia = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologia);

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João"
            };

            await expect(colecao.restaurar(registro)).rejects.toThrow(
                'Esta entidade não possui exclusão lógica habilitada'
            );
        });
    });

    describe('Exclusão em Lote com Soft Delete', () => {
        test('deve excluir múltiplos registros logicamente', async () => {
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
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, "exclusaoLogica", {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologia);

            const registro1 = new ObjetoDeleguaClasse(entidade.modelo);
            registro1.propriedades = {
                id: 1,
                nome: "João",
                excluido_em: null
            };

            const registro2 = new ObjetoDeleguaClasse(entidade.modelo);
            registro2.propriedades = {
                id: 2,
                nome: "Maria",
                excluido_em: null
            };

            const resultado = await colecao.excluirVarios([registro1, registro2]);

            expect(Array.isArray(resultado)).toBe(true);
            expect(resultado.length).toBe(2);
        });
    });

    describe('Integração com Ganchos', () => {
        test('deve executar ganchos antes e depois de soft delete', async () => {
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
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, "exclusaoLogica", {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologia);

            let antesDeExcluirChamado = false;
            let aposExcluirChamado = false;

            colecao.adicionarGancho('antesDeExcluir', () => {
                antesDeExcluirChamado = true;
            });

            colecao.adicionarGancho('aposExcluir', () => {
                aposExcluirChamado = true;
            });

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                nome: "João",
                excluido_em: null
            };

            await colecao.remover(registro);

            expect(antesDeExcluirChamado).toBe(true);
            expect(aposExcluirChamado).toBe(true);
        });
    });

    describe('Combinação com Outras Funcionalidades', () => {
        test('soft delete com múltiplas colunas adiciona filtro', () => {
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
                        new Simbolo("IDENTIFICADOR", "ativo", "ativo", 5, -1),
                        'lógico',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 6, -1),
                        'texto',
                        [new Decorador(-1, 6, "exclusaoLogica", {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const construtor = new ConstrutorConsulta(entidade, tecnologia);

            const sql = construtor.gerarSql();

            expect(sql).toContain("excluido_em IS NULL");
        });

        test('soft delete com chave primária composta converte para atualizar', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "HistoricoUsuario", "HistoricoUsuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario_id", "usuario_id", 3, -1),
                        'número',
                        [new Decorador(-1, 3, "chavePrimaria", {})]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "data", "data", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, "chavePrimaria", {})]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "acao", "acao", 5, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "excluido_em", "excluido_em", 6, -1),
                        'texto',
                        [new Decorador(-1, 6, "exclusaoLogica", {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologia);

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = {
                id: 1,
                usuario_id: 1,
                data: "2024-01-01T10:00:00Z",
                acao: "login",
                excluido_em: null
            };

            const comando = colecao.excluir(registro);

            expect(comando.constructor.name).toBe("Atualizar");
        });
    });
});
