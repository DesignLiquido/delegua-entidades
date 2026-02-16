import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { PolimorficInterface } from "../fontes/interfaces-tipos/polimorfico-interface";

describe('Relacionamentos Polimórficos', () => {
    let descritarComentario: DescritorTipoClasse;
    let descritarPostagem: DescritorTipoClasse;
    let descritarVideo: DescritorTipoClasse;
    let entidadeComentario: Entidade;
    let entidadePostagem: Entidade;
    let entidadeVideo: Entidade;

    beforeEach(() => {
        // Comentário que pode estar ligado a Postagem ou Vídeo
        descritarComentario = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Comentario", "Comentario", 1, -1),
            null,
            {},
            [
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                    'número',
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "texto", "texto", 4, -1),
                    'texto',
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "comentavel", "comentavel", 5, -1),
                    'texto',
                    [new Decorador(-1, 5, 'polimorfico', {
                        entidades: ['Postagem', 'Video']
                    })]
                )
            ]
        );

        descritarPostagem = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Postagem", "Postagem", 1, -1),
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
                )
            ]
        );

        descritarVideo = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Video", "Video", 1, -1),
            null,
            {},
            [
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                    'número',
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "url", "url", 4, -1),
                    'texto',
                    []
                )
            ]
        );

        entidadeComentario = new Entidade(descritarComentario);
        entidadePostagem = new Entidade(descritarPostagem);
        entidadeVideo = new Entidade(descritarVideo);
    });

    describe('Detecção de @polimorfico', () => {
        it('detecta um relacionamento polimórfico simples', () => {
            const polimorficos = entidadeComentario.obterPolimorficos();
            
            expect(polimorficos).toHaveLength(1);
            expect(polimorficos[0].nomePropriedade).toBe('comentavel');
            expect(polimorficos[0].tipo).toBe('polimorfico');
        });

        it('armazena todas as entidades possíveis', () => {
            const polimorfico = entidadeComentario.obterPolimorficos()[0];
            
            expect(polimorfico.entidadesPossiveis).toContain('Postagem');
            expect(polimorfico.entidadesPossiveis).toContain('Video');
            expect(polimorfico.entidadesPossiveis).toHaveLength(2);
        });

        it('gera nomes de coluna por padrão baseados na propriedade', () => {
            const polimorfico = entidadeComentario.obterPolimorficos()[0];
            
            expect(polimorfico.colunaTipo).toBe('comentavel_tipo');
            expect(polimorfico.colunaId).toBe('comentavel_id');
        });

        it('permite especificar nomes de coluna customizados', () => {
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
                        new Simbolo("IDENTIFICADOR", "alvo", "alvo", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'polimorfico', {
                            entidades: ['Produto', 'Servico'],
                            colunaTipo: 'tipo_alvo',
                            colunaId: 'alvo_id'
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const polimorfico = entidade.obterPolimorficos()[0];
            
            expect(polimorfico.colunaTipo).toBe('tipo_alvo');
            expect(polimorfico.colunaId).toBe('alvo_id');
        });
    });

    describe('Múltiplas Entidades Possíveis', () => {
        it('suporta relacionamentos com 2 entidades possíveis', () => {
            const polimorfico = entidadeComentario.obterPolimorficos()[0];
            
            expect(polimorfico.entidadesPossiveis).toHaveLength(2);
        });

        it('suporta relacionamentos com mais de 2 entidades possíveis', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Notificacao", "Notificacao", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "evento", "evento", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'polimorfico', {
                            entidades: ['Postagem', 'Comentario', 'Usuario', 'Document']
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const polimorfico = entidade.obterPolimorficos()[0];
            
            expect(polimorfico.entidadesPossiveis).toHaveLength(4);
            expect(polimorfico.entidadesPossiveis).toContain('Document');
        });
    });

    describe('Múltiplos Relacionamentos Polimórficos', () => {
        it('detecta múltiplos relacionamentos polimórficos na mesma entidade', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Anexo", "Anexo", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "ficheiro", "ficheiro", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'polimorfico', {
                            entidades: ['Postagem', 'Email']
                        })]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "validador", "validador", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'polimorfico', {
                            entidades: ['Usuario', 'Sistema']
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const polimorficos = entidade.obterPolimorficos();
            
            expect(polimorficos).toHaveLength(2);
            expect(polimorficos[0].nomePropriedade).toBe('ficheiro');
            expect(polimorficos[1].nomePropriedade).toBe('validador');
        });
    });

    describe('Opções de Comportamento', () => {
        it('respeita opção deletarAoRemover: false por padrão', () => {
            const polimorfico = entidadeComentario.obterPolimorficos()[0];
            
            expect(polimorfico.deletarAoRemover).toBe(false);
        });

        it('respeita opção deletarAoRemover: true quando configurada', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Tag", "Tag", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "marcado", "marcado", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'polimorfico', {
                            entidades: ['Postagem', 'Foto', 'Video'],
                            deletarAoRemover: true
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const polimorfico = entidade.obterPolimorficos()[0];
            
            expect(polimorfico.deletarAoRemover).toBe(true);
        });
    });

    describe('Interface Compliance', () => {
        it('retorna array de PolimorficInterface', () => {
            const polimorficos = entidadeComentario.obterPolimorficos();
            
            expect(Array.isArray(polimorficos)).toBe(true);
            if (polimorficos.length > 0) {
                const polimorfico = polimorficos[0];
                expect(polimorfico.tipo).toBe('polimorfico');
                expect(typeof polimorfico.nomePropriedade).toBe('string');
                expect(Array.isArray(polimorfico.entidadesPossiveis)).toBe(true);
                expect(typeof polimorfico.colunaTipo).toBe('string');
                expect(typeof polimorfico.colunaId).toBe('string');
            }
        });

        it('vazio quando nenhum polimorfico é definido', () => {
            const polimorficos = entidadePostagem.obterPolimorficos();
            
            expect(polimorficos).toHaveLength(0);
            expect(Array.isArray(polimorficos)).toBe(true);
        });
    });

    describe('Padrões Comuns', () => {
        it('suporta padrão comentário em múltiplas entidades', () => {
            const polimorfico = entidadeComentario.obterPolimorficos()[0];
            
            expect(polimorfico.nomePropriedade).toBe('comentavel');
            expect(polimorfico.entidadesPossiveis).toContain('Postagem');
            expect(polimorfico.entidadesPossiveis).toContain('Video');
        });

        it('suporta padrão atividade em múltiplas entidades', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Atividade", "Atividade", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "ator", "ator", 5, -1),
                        'texto',
                        [new Decorador(-1, 5, 'polimorfico', {
                            entidades: ['Usuario', 'Aplicacao', 'Servico']
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const polimorfico = entidade.obterPolimorficos()[0];
            
            expect(polimorfico.entidadesPossiveis).toHaveLength(3);
        });
    });
});
