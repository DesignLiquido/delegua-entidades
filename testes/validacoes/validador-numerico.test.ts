import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../../fontes/entidade";
import { Validador } from "../../fontes/validacoes/validador";

describe('Validadores Numéricos', () => {
    describe('@minimo', () => {
        it('valida valor mínimo correto', async () => {
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
                        new Simbolo("IDENTIFICADOR", "preco", "preco", 4, -1),
                        'número',
                        [new Decorador(-1, 1, 'minimo', { valor: 0 })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['preco'] = 10;

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });

        it('falha na validação de valor mínimo', async () => {
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
                        new Simbolo("IDENTIFICADOR", "preco", "preco", 4, -1),
                        'número',
                        [new Decorador(-1, 1, 'minimo', { valor: 0 })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['preco'] = -5;

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].campo).toBe('preco');
            expect(erros[0].mensagem).toContain('no mínimo');
        });
    });

    describe('@maximo', () => {
        it('valida valor máximo correto', async () => {
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
                        new Simbolo("IDENTIFICADOR", "estoque", "estoque", 4, -1),
                        'número',
                        [new Decorador(-1, 1, 'maximo', { valor: 1000 })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['estoque'] = 500;

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(0);
        });

        it('falha na validação de valor máximo', async () => {
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
                        new Simbolo("IDENTIFICADOR", "estoque", "estoque", 4, -1),
                        'número',
                        [new Decorador(-1, 1, 'maximo', { valor: 1000 })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(descritor);
            registro.propriedades['id'] = 1;
            registro.propriedades['estoque'] = 1500;

            const erros = await Validador.validar(entidade, registro);
            expect(erros).toHaveLength(1);
            expect(erros[0].campo).toBe('estoque');
            expect(erros[0].mensagem).toContain('no máximo');
        });
    });
});
