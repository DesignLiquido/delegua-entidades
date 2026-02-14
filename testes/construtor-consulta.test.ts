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

describe('ConstrutorConsulta', () => {
    const descritorTipoClasse = new DescritorTipoClasse(
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
                new Simbolo("IDENTIFICADOR", "idade", "idade", 5, -1),
                'inteiro',
                []
            ),
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "ativo", "ativo", 6, -1),
                'lógico',
                []
            )
        ]
    );

    const entidade = new Entidade(descritorTipoClasse);
    let tecnologiaMock: BonecoTecnologia;
    let colecao: Colecao<Entidade>;

    beforeEach(() => {
        tecnologiaMock = new BonecoTecnologia();
        tecnologiaMock.dadosEmMemoria['Usuario'] = [];
        colecao = new Colecao(entidade, tecnologiaMock);
    });

    describe('Geração de SQL', () => {
        it('gera SELECT básico sem condições', () => {
            const consulta = colecao.consulta();
            const sql = consulta.gerarSql();
            expect(sql).toContain('SELECT');
            expect(sql).toContain('Usuario');
        });

        it('gera SELECT com condição WHERE', () => {
            const consulta = colecao.consulta().onde('idade', 'MAIOR', 18);
            const sql = consulta.gerarSql();
            expect(sql).toContain('WHERE');
            expect(sql).toContain('idade');
        });

        it('gera SELECT com múltiplas condições AND', () => {
            const consulta = colecao.consulta()
                .onde('idade', 'MAIOR', 18)
                .e('ativo', 'IGUAL', true);
            const sql = consulta.gerarSql();
            expect(sql).toContain('WHERE');
            expect(sql).toContain('idade');
            expect(sql).toContain('ativo');
        });

        it('gera SELECT com condição OR', () => {
            const consulta = colecao.consulta()
                .onde('idade', 'MAIOR', 18)
                .ou('nome', 'IGUAL', 'admin');
            const sql = consulta.gerarSql();
            expect(sql).toContain('WHERE');
            expect(sql).toContain('OR');
        });

        it('gera SELECT com ORDER BY', () => {
            const consulta = colecao.consulta().ordenarPor('nome');
            const sql = consulta.gerarSql();
            expect(sql).toContain('ORDER BY nome ASC');
        });

        it('gera SELECT com ORDER BY DESC', () => {
            const consulta = colecao.consulta().ordenarPor('idade', 'DESC');
            const sql = consulta.gerarSql();
            expect(sql).toContain('ORDER BY idade DESC');
        });

        it('gera SELECT com LIMIT', () => {
            const consulta = colecao.consulta().limite(10);
            const sql = consulta.gerarSql();
            expect(sql).toContain('LIMIT 10');
        });

        it('gera SELECT com OFFSET', () => {
            const consulta = colecao.consulta().deslocamento(20);
            const sql = consulta.gerarSql();
            expect(sql).toContain('OFFSET 20');
        });

        it('gera SELECT com LIMIT e OFFSET combinados', () => {
            const consulta = colecao.consulta().limite(10).deslocamento(20);
            const sql = consulta.gerarSql();
            expect(sql).toContain('LIMIT 10');
            expect(sql).toContain('OFFSET 20');
        });

        it('gera SELECT com colunas específicas', () => {
            const consulta = colecao.consulta().selecionar('nome', 'idade');
            const sql = consulta.gerarSql();
            expect(sql).toContain('nome');
            expect(sql).toContain('idade');
        });

        it('gera SELECT completo com WHERE, ORDER BY, LIMIT e OFFSET', () => {
            const consulta = colecao.consulta()
                .onde('idade', 'MAIOR', 18)
                .e('ativo', 'IGUAL', true)
                .ordenarPor('nome')
                .limite(10)
                .deslocamento(5);
            const sql = consulta.gerarSql();
            expect(sql).toContain('WHERE');
            expect(sql).toContain('ORDER BY nome ASC');
            expect(sql).toContain('LIMIT 10');
            expect(sql).toContain('OFFSET 5');
        });
    });

    describe('Encadeamento', () => {
        it('permite encadear múltiplos métodos', () => {
            const consulta = colecao.consulta()
                .onde('idade', 'MAIOR', 18)
                .e('ativo', 'IGUAL', true)
                .ordenarPor('nome')
                .limite(10);

            expect(consulta).toBeInstanceOf(ConstrutorConsulta);
        });
    });

    describe('Execução', () => {
        it('todos() retorna registros hidratados', async () => {
            tecnologiaMock.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'Maria', idade: 25, ativo: true },
                { id: 2, nome: 'João', idade: 30, ativo: true }
            ];

            // Mock executar to return the in-memory data
            tecnologiaMock.executar = async (_: any, sql: string, _params: any[]) => {
                return [{
                    linhasAfetadas: 0,
                    ultimoId: null,
                    linhasRetornadas: tecnologiaMock.dadosEmMemoria['Usuario'],
                    comandoExecutado: sql,
                    mensagemExecucao: "OK"
                }];
            };

            const resultados = await colecao.consulta().todos();
            expect(resultados).toHaveLength(2);
            expect(resultados[0]).toBeInstanceOf(ObjetoDeleguaClasse);
            expect(resultados[0].propriedades['nome']).toBe('Maria');
        });

        it('primeiro() retorna apenas o primeiro registro', async () => {
            tecnologiaMock.executar = async (_: any, sql: string, _params: any[]) => {
                return [{
                    linhasAfetadas: 0,
                    ultimoId: null,
                    linhasRetornadas: [{ id: 1, nome: 'Maria', idade: 25, ativo: true }],
                    comandoExecutado: sql,
                    mensagemExecucao: "OK"
                }];
            };

            const resultado = await colecao.consulta().primeiro();
            expect(resultado).toBeTruthy();
            expect(resultado).toBeInstanceOf(ObjetoDeleguaClasse);
            expect(resultado.propriedades['nome']).toBe('Maria');
        });

        it('primeiro() retorna null quando não há resultados', async () => {
            tecnologiaMock.executar = async (_: any, sql: string, _params: any[]) => {
                return [{
                    linhasAfetadas: 0,
                    ultimoId: null,
                    linhasRetornadas: [],
                    comandoExecutado: sql,
                    mensagemExecucao: "OK"
                }];
            };

            const resultado = await colecao.consulta().primeiro();
            expect(resultado).toBeNull();
        });

        it('contar() retorna a contagem de registros', async () => {
            tecnologiaMock.executar = async (_: any, sql: string, _params: any[]) => {
                return [{
                    linhasAfetadas: 0,
                    ultimoId: null,
                    linhasRetornadas: [{ contagem: 5 }],
                    comandoExecutado: sql,
                    mensagemExecucao: "OK"
                }];
            };

            const contagem = await colecao.consulta().contar();
            expect(contagem).toBe(5);
        });

        it('lança erro quando tecnologia não está configurada', () => {
            const colecaoSemTecnologia = new Colecao(entidade);
            expect(() => colecaoSemTecnologia.consulta()).toThrow('Nenhuma tecnologia');
        });
    });

    describe('Operadores', () => {
        it('suporta IGUAL', () => {
            const sql = colecao.consulta().onde('nome', 'IGUAL', 'Maria').gerarSql();
            expect(sql).toContain('=');
        });

        it('suporta MAIOR', () => {
            const sql = colecao.consulta().onde('idade', 'MAIOR', 18).gerarSql();
            expect(sql).toContain('>');
        });

        it('suporta MENOR', () => {
            const sql = colecao.consulta().onde('idade', 'MENOR', 65).gerarSql();
            expect(sql).toContain('<');
        });

        it('suporta MAIOR_IGUAL', () => {
            const sql = colecao.consulta().onde('idade', 'MAIOR_IGUAL', 18).gerarSql();
            expect(sql).toContain('>=');
        });

        it('suporta MENOR_IGUAL', () => {
            const sql = colecao.consulta().onde('idade', 'MENOR_IGUAL', 65).gerarSql();
            expect(sql).toContain('<=');
        });
    });
});
