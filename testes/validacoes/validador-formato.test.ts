import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../../fontes/entidade";
import { Validador } from "../../fontes/validacoes/validador";

describe('Validadores de Formato', () => {
    describe('@formato - Validação com Regex', () => {
        it('valida formato com padrão correto', async () => {
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
                        new Simbolo("IDENTIFICADOR", "codigo", "codigo", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'formato', { padrao: '^PRD-\\d{4}$' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['codigo'] = 'PRD-1234';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });

        it('falha na validação de formato com padrão incorreto', async () => {
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
                        new Simbolo("IDENTIFICADOR", "codigo", "codigo", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'formato', { padrao: '^PRD-\\d{4}$' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['codigo'] = 'ABC-123';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].campo).toBe('codigo');
            expect(erros[0].mensagem).toContain('formato esperado');
        });

        it('valida formato com mensagem personalizada', async () => {
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
                        new Simbolo("IDENTIFICADOR", "codigo", "codigo", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'formato', { 
                            padrao: '^PRD-\\d{4}$',
                            mensagem: 'Código deve estar no formato PRD-XXXX'
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['codigo'] = 'invalido';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].mensagem).toBe('Código deve estar no formato PRD-XXXX');
        });
    });

    describe('@email - Validação de Email', () => {
        it('valida email correto', async () => {
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
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'email', {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['email'] = 'usuario@exemplo.com';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });

        it('falha na validação de email inválido', async () => {
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
                        new Simbolo("IDENTIFICADOR", "email", "email", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'email', {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['email'] = 'email-invalido';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].campo).toBe('email');
            expect(erros[0].mensagem).toContain('email válido');
        });
    });

    describe('@url - Validação de URL', () => {
        it('valida URL correta', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Site", "Site", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "endereco", "endereco", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'url', {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['endereco'] = 'https://exemplo.com';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });

        it('falha na validação de URL inválida', async () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Site", "Site", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "endereco", "endereco", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'url', {})]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['endereco'] = 'url-invalida';

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].campo).toBe('endereco');
            expect(erros[0].mensagem).toContain('URL válida');
        });
    });
});
