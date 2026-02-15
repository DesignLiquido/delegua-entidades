import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../../fontes/entidade";
import { Validador } from "../../fontes/validacoes/validador";

describe('Validadores Básicos', () => {
    describe('@obrigatorio', () => {
        it('valida campo obrigatório - valor nulo', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
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

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = null;

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].campo).toBe('nome');
            expect(erros[0].mensagem).toContain('obrigatório');
        });

        it('valida campo obrigatório - valor vazio', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
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

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = '';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
        });

        it('valida campo obrigatório - valor válido não gera erro', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
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

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = 'Maria';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });
    });

    describe('@comprimentoMaximo', () => {
        it('valida comprimento máximo', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
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
                        [new Decorador(-1, 1, 'comprimentoMaximo', { valor: 5 })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = 'Maria Silva';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].mensagem).toContain('máximo');
            expect(erros[0].mensagem).toContain('5');
        });
    });

    describe('@comprimentoMinimo', () => {
        it('valida comprimento mínimo', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
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
                        [new Decorador(-1, 1, 'comprimentoMinimo', { valor: 3 })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = 'AB';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].mensagem).toContain('mínimo');
            expect(erros[0].mensagem).toContain('3');
        });
    });

    describe('Múltiplos validadores', () => {
        it('agrega múltiplos erros', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
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
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "email", "email", 5, -1),
                        'texto',
                        [new Decorador(-1, 1, 'obrigatorio', {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = null;
            registro.propriedades['email'] = '';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(2);
        });

        it('sem decoradores não gera erros', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pessoa", "Pessoa", 1, -1),
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
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = null;

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });
    });
});
