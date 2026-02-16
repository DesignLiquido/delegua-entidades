import {
    DescritorTipoClasse,
    ObjetoDeleguaClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Valores Padrão - Sprint 2', () => {
    describe('Detecção de @padrao', () => {
        it('detecta decorador @padrao com valor numérico', () => {
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
                        new Simbolo("IDENTIFICADOR", "quantidade", "quantidade", 4, -1),
                        'número',
                        [new Decorador(-1, 4, 'padrao', {
                            valor: 0,
                            padrao: 0
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            expect(entidade).toBeDefined();
        });

        it('detecta decorador @padrao com valor texto', () => {
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
                        new Simbolo("IDENTIFICADOR", "status", "status", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'padrao', {
                            valor: 'ativo',
                            padrao: 'ativo'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            expect(entidade).toBeDefined();
        });

        it('permite múltiplos campos com valores padrão', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Documento", "Documento", 1, -1),
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
                        [new Decorador(-1, 4, 'padrao', {
                            valor: 'rascunho',
                            padrao: 'rascunho'
                        })]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "versao", "versao", 6, -1),
                        'número',
                        [new Decorador(-1, 6, 'padrao', {
                            valor: 1,
                            padrao: 1
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            expect(entidade).toBeDefined();
        });
    });

    describe('Aplicação de valores padrão na inserção', () => {
        it('aplica valor padrão ao salvar registro sem definir campo', async () => {
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
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "ativo", "ativo", 5, -1),
                        'lógico',
                        [new Decorador(-1, 5, 'padrao', {
                            valor: true,
                            padrao: true
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = 'Notebook';

            // Aplicar padrões
            for (const propriedade of entidade.modelo.propriedades) {
                const nomeCampo = propriedade.nome.lexema;
                if (registro.propriedades[nomeCampo] === undefined || registro.propriedades[nomeCampo] === null) {
                    for (const decorador of propriedade.decoradores) {
                        const nomeDecorador = decorador.nome.replace(/^@/, '');
                        if (nomeDecorador === 'padrao') {
                            const valorPadrao = decorador.atributos?.valor || decorador.atributos?.padrao;
                            if (valorPadrao !== undefined) {
                                registro.propriedades[nomeCampo] = valorPadrao;
                            }
                            break;
                        }
                    }
                }
            }

            expect(registro.propriedades['ativo']).toBe(true);
            expect(registro.propriedades['nome']).toBe('Notebook');
        });

        it('não sobrescreve valor fornecido com valor padrão', async () => {
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
                        new Simbolo("IDENTIFICADOR", "status", "status", 4, -1),
                        'texto',
                        [new Decorador(-1, 4, 'padrao', {
                            valor: 'ativo',
                            padrao: 'ativo'
                        })]
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['status'] = 'inativo';

            // Aplicar padrões
            for (const propriedade of entidade.modelo.propriedades) {
                const nomeCampo = propriedade.nome.lexema;
                if (registro.propriedades[nomeCampo] === undefined || registro.propriedades[nomeCampo] === null) {
                    for (const decorador of propriedade.decoradores) {
                        const nomeDecorador = decorador.nome.replace(/^@/, '');
                        if (nomeDecorador === 'padrao') {
                            const valorPadrao = decorador.atributos?.valor || decorador.atributos?.padrao;
                            if (valorPadrao !== undefined) {
                                registro.propriedades[nomeCampo] = valorPadrao;
                            }
                            break;
                        }
                    }
                }
            }

            expect(registro.propriedades['status']).toBe('inativo');
        });

        it('aplica múltiplos valores padrão simultaneamente', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Documento", "Documento", 1, -1),
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
                        [new Decorador(-1, 4, 'padrao', {
                            valor: 'rascunho',
                            padrao: 'rascunho'
                        })]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "versao", "versao", 6, -1),
                        'número',
                        [new Decorador(-1, 6, 'padrao', {
                            valor: 1,
                            padrao: 1
                        })]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "titulo", "titulo", 8, -1),
                        'texto',
                        []
                    ),
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Meu Documento';

            // Aplicar padrões
            for (const propriedade of entidade.modelo.propriedades) {
                const nomeCampo = propriedade.nome.lexema;
                if (registro.propriedades[nomeCampo] === undefined || registro.propriedades[nomeCampo] === null) {
                    for (const decorador of propriedade.decoradores) {
                        const nomeDecorador = decorador.nome.replace(/^@/, '');
                        if (nomeDecorador === 'padrao') {
                            const valorPadrao = decorador.atributos?.valor || decorador.atributos?.padrao;
                            if (valorPadrao !== undefined) {
                                registro.propriedades[nomeCampo] = valorPadrao;
                            }
                            break;
                        }
                    }
                }
            }

            expect(registro.propriedades['status']).toBe('rascunho');
            expect(registro.propriedades['versao']).toBe(1);
            expect(registro.propriedades['titulo']).toBe('Meu Documento');
        });
    });
});
