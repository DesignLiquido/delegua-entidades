import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../../fontes/entidade";
import { Validador } from "../../fontes/validacoes/validador";

describe('Validador Customizado', () => {
    it('valida com validador customizado que retorna true', async () => {
        const validadorCustomizado = (valor: any) => {
            return valor.startsWith('CUSTOM-');
        };

        const descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Item", "Item", 1, -1),
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
                    [new Decorador(-1, 1, 'validadorCustomizado', { 
                        validador: validadorCustomizado,
                        mensagem: 'Código deve começar com CUSTOM-'
                    })]
                )
            ]
        );

        const entidade = new Entidade(descritor);
        const registro = new ObjetoDeleguaClasse(descritor);
        registro.propriedades['id'] = 1;
        registro.propriedades['codigo'] = 'CUSTOM-123';

        const erros = await Validador.validar(entidade, registro);
        expect(erros).toHaveLength(0);
    });

    it('falha com validador customizado que retorna false', async () => {
        const validadorCustomizado = (valor: any) => {
            return valor.startsWith('CUSTOM-');
        };

        const descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Item", "Item", 1, -1),
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
                    [new Decorador(-1, 1, 'validadorCustomizado', { 
                        validador: validadorCustomizado,
                        mensagem: 'Código deve começar com CUSTOM-'
                    })]
                )
            ]
        );

        const entidade = new Entidade(descritor);
        const registro = new ObjetoDeleguaClasse(descritor);
        registro.propriedades['id'] = 1;
        registro.propriedades['codigo'] = 'INVALID-123';

        const erros = await Validador.validar(entidade, registro);
        expect(erros).toHaveLength(1);
        expect(erros[0].campo).toBe('codigo');
        expect(erros[0].mensagem).toBe('Código deve começar com CUSTOM-');
    });

    it('valida com validador customizado assíncrono', async () => {
        const validadorAsync = async (valor: any) => {
            // Simula uma verificação assíncrona
            await new Promise(resolve => setTimeout(resolve, 10));
            return valor.length > 5;
        };

        const descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Item", "Item", 1, -1),
            null,
            {},
            [
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                    'número',
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "descricao", "descricao", 4, -1),
                    'texto',
                    [new Decorador(-1, 1, 'validadorCustomizado', { 
                        validador: validadorAsync,
                        mensagem: 'Descrição muito curta'
                    })]
                )
            ]
        );

        const entidade = new Entidade(descritor);
        const registro = new ObjetoDeleguaClasse(descritor);
        registro.propriedades['id'] = 1;
        registro.propriedades['descricao'] = 'Descrição longa o suficiente';

        const erros = await Validador.validar(entidade, registro);
        expect(erros).toHaveLength(0);
    });
});
