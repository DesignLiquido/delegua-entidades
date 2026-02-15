import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../../fontes/entidade";
import { Colecao } from "../../fontes/colecao";
import { ErroDeValidacao } from "../../fontes/erros/erro-validacao";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Integração de Validação com Colecao', () => {
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
