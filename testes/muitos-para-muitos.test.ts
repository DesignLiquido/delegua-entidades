import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { MuitoParaMuitoInterface } from "../fontes/interfaces-tipos/muito-para-muitos-interface";

describe('Relacionamentos Muitos-para-Muitos (Sprint 3)', () => {
    let descritarUsuario: DescritorTipoClasse;
    let descritarPapel: DescritorTipoClasse;
    let entidadeUsuario: Entidade;
    let entidadePapel: Entidade;

    beforeEach(() => {
        descritarUsuario = new DescritorTipoClasse(
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
                    new Simbolo("IDENTIFICADOR", "papeis", "papeis", 5, -1),
                    'texto',
                    [new Decorador(-1, 5, 'temMuitosParaMuitos', { entidade: 'Papel' })]
                )
            ]
        );

        descritarPapel = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Papel", "Papel", 1, -1),
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

        entidadeUsuario = new Entidade(descritarUsuario);
        entidadePapel = new Entidade(descritarPapel);
    });

    describe('Detecção de @temMuitosParaMuitos', () => {
        it('detecta um relacionamento muitos-para-muitos simples', () => {
            const m2m = entidadeUsuario.obterMuitosParaMuitos();
            
            expect(m2m).toHaveLength(1);
            expect(m2m[0].nomePropriedade).toBe('papeis');
            expect(m2m[0].entidadeDestino).toBe('Papel');
            expect(m2m[0].tipo).toBe('muitoParaMuitos');
        });

        it('gera nome de tabela intermediária por padrão', () => {
            const m2m = entidadeUsuario.obterMuitosParaMuitos()[0];
            
            expect(m2m.tabelaIntermediaria).toBe('usuario_papel');
        });

        it('permite especificar Nome customizado de tabela intermediária', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Estudante", "Estudante", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "disciplinas", "disciplinas", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'temMuitosParaMuitos', {
                            entidade: 'Disciplina',
                            tabelaIntermediaria: 'inscricoes_estudante_disciplina'
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const m2m = entidade.obterMuitosParaMuitos()[0];
            
            expect(m2m.tabelaIntermediaria).toBe('inscricoes_estudante_disciplina');
        });

        it('gera nomes de coluna por padrão', () => {
            const m2m = entidadeUsuario.obterMuitosParaMuitos()[0];
            
            expect(m2m.colunaOrigem).toBe('usuario_id');
            expect(m2m.colunaDestino).toBe('papel_id');
        });

        it('permite especificar nomes de coluna customizados', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Livro", "Livro", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "autores", "autores", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'temMuitosParaMuitos', {
                            entidade: 'Autor',
                            colunaOrigem: 'livro_pk',
                            colunaDestino: 'autor_pk'
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const m2m = entidade.obterMuitosParaMuitos()[0];
            
            expect(m2m.colunaOrigem).toBe('livro_pk');
            expect(m2m.colunaDestino).toBe('autor_pk');
        });
    });

    describe('Múltiplos Relacionamentos Muitos-para-Muitos', () => {
        it('detecta múltiplos relacionamentos M2M na mesma entidade', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Projeto", "Projeto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "membros", "membros", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'temMuitosParaMuitos', {
                            entidade: 'Desenvolvedor',
                            tabelaIntermediaria: 'projeto_desenvolvedor'
                        })]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "tags", "tags", 6, -1),
                        'texto',
                        [new Decorador(-1, 6, 'temMuitosParaMuitos', {
                            entidade: 'Tag',
                            tabelaIntermediaria: 'projeto_tag'
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const m2ms = entidade.obterMuitosParaMuitos();
            
            expect(m2ms).toHaveLength(2);
            expect(m2ms[0].nomePropriedade).toBe('membros');
            expect(m2ms[1].nomePropriedade).toBe('tags');
        });
    });

    describe('Opções de Comportamento', () => {
        it('respeita opção deletarAoRemover: false por padrão', () => {
            const m2m = entidadeUsuario.obterMuitosParaMuitos()[0];
            
            expect(m2m.deletarAoRemover).toBe(false);
        });

        it('respeita opção deletarAoRemover: true quando configurada', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Carrinho", "Carrinho", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "itens", "itens", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'temMuitosParaMuitos', {
                            entidade: 'Produto',
                            deletarAoRemover: true
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const m2m = entidade.obterMuitosParaMuitos()[0];
            
            expect(m2m.deletarAoRemover).toBe(true);
        });
    });

    describe('Interface Compliance', () => {
        it('retorna array de MuitoParaMuitoInterface', () => {
            const m2ms = entidadeUsuario.obterMuitosParaMuitos();
            
            expect(Array.isArray(m2ms)).toBe(true);
            if (m2ms.length > 0) {
                const m2m = m2ms[0];
                expect(m2m.tipo).toBe('muitoParaMuitos');
                expect(typeof m2m.nomePropriedade).toBe('string');
                expect(typeof m2m.entidadeDestino).toBe('string');
                expect(typeof m2m.tabelaIntermediaria).toBe('string');
                expect(typeof m2m.colunaOrigem).toBe('string');
                expect(typeof m2m.colunaDestino).toBe('string');
            }
        });

        it('vazio quando nenhum M2M é definido', () => {
            const m2ms = entidadePapel.obterMuitosParaMuitos();
            
            expect(m2ms).toHaveLength(0);
            expect(Array.isArray(m2ms)).toBe(true);
        });
    });
});
