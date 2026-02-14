import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { Validador } from "../fontes/validacoes/validador";
import { ErroDeValidacao } from "../fontes/erros/erro-validacao";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Validações', () => {
    describe('Validador', () => {
        it('valida campo obrigatório - valor nulo', () => {
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

            const erros = Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].campo).toBe('nome');
            expect(erros[0].mensagem).toContain('obrigatório');
        });

        it('valida campo obrigatório - valor vazio', () => {
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

            const erros = Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
        });

        it('valida campo obrigatório - valor válido não gera erro', () => {
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

            const erros = Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });

        it('valida comprimento máximo', () => {
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

            const erros = Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].mensagem).toContain('máximo');
            expect(erros[0].mensagem).toContain('5');
        });

        it('valida comprimento mínimo', () => {
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

            const erros = Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].mensagem).toContain('mínimo');
            expect(erros[0].mensagem).toContain('3');
        });

        it('agrega múltiplos erros', () => {
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

            const erros = Validador.validar(entidade, registro);
            expect(erros).toHaveLength(2);
        });

        it('sem decoradores não gera erros', () => {
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

            const erros = Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });
    });

    describe('ErroDeValidacao', () => {
        it('contém a lista de erros', () => {
            const erros = [
                { campo: 'nome', mensagem: 'Campo obrigatório' },
                { campo: 'email', mensagem: 'Campo obrigatório' }
            ];
            const erro = new ErroDeValidacao(erros);
            expect(erro.erros).toHaveLength(2);
            expect(erro.name).toBe('ErroDeValidacao');
            expect(erro.message).toContain('nome');
            expect(erro.message).toContain('email');
        });
    });

    describe('Integração com Colecao', () => {
        it('salvar() lança ErroDeValidacao quando registro é inválido', async () => {
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
            const tecnologiaMock = new BonecoTecnologia();
            tecnologiaMock.dadosEmMemoria['Pessoa'] = [];
            const colecao = new Colecao(entidade, tecnologiaMock);

            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = null;

            await expect(colecao.salvar(registro)).rejects.toThrow(ErroDeValidacao);
        });

        it('modificar() lança ErroDeValidacao quando registro é inválido', async () => {
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
            const tecnologiaMock = new BonecoTecnologia();
            tecnologiaMock.dadosEmMemoria['Pessoa'] = [];
            const colecao = new Colecao(entidade, tecnologiaMock);

            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = '';

            await expect(colecao.modificar(registro)).rejects.toThrow(ErroDeValidacao);
        });

        it('salvar() funciona quando registro é válido', async () => {
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
            const tecnologiaMock = new BonecoTecnologia();
            tecnologiaMock.dadosEmMemoria['Pessoa'] = [];
            const colecao = new Colecao(entidade, tecnologiaMock);

            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = 'Maria';

            const resultado = await colecao.salvar(registro);
            expect(resultado[0].linhasAfetadas).toBe(1);
        });
    });
});
