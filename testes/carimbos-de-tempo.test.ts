import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Carimbos de tempo automáticos', () => {
    const descritorComCarimbosDeTempo = new DescritorTipoClasse(
        new Simbolo("IDENTIFICADOR", "Artigo", "Artigo", 1, -1),
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
            ),
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "criado_em", "criado_em", 5, -1),
                'texto',
                []
            ),
            new PropriedadeClasse(
                new Simbolo("IDENTIFICADOR", "atualizado_em", "atualizado_em", 6, -1),
                'texto',
                []
            )
        ]
    );

    const descritorSemCarimbosDeTempo = new DescritorTipoClasse(
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
                new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                'texto',
                []
            )
        ]
    );

    describe('Detecção de carimbos de tempo', () => {
        it('detecta criado_em', () => {
            const entidade = new Entidade(descritorComCarimbosDeTempo);
            expect(entidade.possuiCriadoEm()).toBe(true);
        });

        it('detecta atualizado_em', () => {
            const entidade = new Entidade(descritorComCarimbosDeTempo);
            expect(entidade.possuiAtualizadoEm()).toBe(true);
        });

        it('retorna false quando não possui criado_em', () => {
            const entidade = new Entidade(descritorSemCarimbosDeTempo);
            expect(entidade.possuiCriadoEm()).toBe(false);
        });

        it('retorna false quando não possui atualizado_em', () => {
            const entidade = new Entidade(descritorSemCarimbosDeTempo);
            expect(entidade.possuiAtualizadoEm()).toBe(false);
        });
    });

    describe('Preenchimento automático', () => {
        let tecnologiaMock: BonecoTecnologia;

        beforeEach(() => {
            tecnologiaMock = new BonecoTecnologia();
            tecnologiaMock.dadosEmMemoria['Artigo'] = [];
            tecnologiaMock.dadosEmMemoria['Tag'] = [];
        });

        it('preenche criado_em e atualizado_em ao salvar', async () => {
            const entidade = new Entidade(descritorComCarimbosDeTempo);
            const colecao = new Colecao(entidade, tecnologiaMock);

            const registro = new ObjetoDeleguaClasse(descritorComCarimbosDeTempo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Meu Artigo';
            registro.propriedades['criado_em'] = null;
            registro.propriedades['atualizado_em'] = null;

            await colecao.salvar(registro);

            expect(registro.propriedades['criado_em']).toBeTruthy();
            expect(registro.propriedades['atualizado_em']).toBeTruthy();
            expect(typeof registro.propriedades['criado_em']).toBe('string');
        });

        it('preenche atualizado_em ao modificar', async () => {
            const entidade = new Entidade(descritorComCarimbosDeTempo);
            const colecao = new Colecao(entidade, tecnologiaMock);

            const registro = new ObjetoDeleguaClasse(descritorComCarimbosDeTempo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Meu Artigo';
            registro.propriedades['criado_em'] = '2024-01-01T00:00:00.000Z';
            registro.propriedades['atualizado_em'] = '2024-01-01T00:00:00.000Z';

            await colecao.salvar(registro);

            const atualizadoEmAnterior = registro.propriedades['atualizado_em'];

            // Pequeno delay para garantir carimbo de tempo diferente
            await new Promise(resolve => setTimeout(resolve, 10));

            registro.propriedades['titulo'] = 'Artigo Atualizado';
            await colecao.modificar(registro);

            expect(registro.propriedades['atualizado_em']).not.toBe(atualizadoEmAnterior);
        });

        it('não preenche carimbos de tempo em entidades sem os campos', async () => {
            const entidade = new Entidade(descritorSemCarimbosDeTempo);
            const colecao = new Colecao(entidade, tecnologiaMock);

            const registro = new ObjetoDeleguaClasse(descritorSemCarimbosDeTempo);
            registro.propriedades['id'] = 1;
            registro.propriedades['nome'] = 'Tag 1';

            await colecao.salvar(registro);

            expect(registro.propriedades['criado_em']).toBeUndefined();
            expect(registro.propriedades['atualizado_em']).toBeUndefined();
        });
    });
});
