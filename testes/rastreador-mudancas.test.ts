import {
    DescritorTipoClasse,
    ObjetoDeleguaClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { RastreadorMudancas } from "../fontes/rastreador-mudancas";
import { Entidade } from "../fontes/entidade";
import { ContextoEntidades } from "../fontes/contexto-entidades";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('RastreadorMudancas', () => {
    const descritorArtigo = new DescritorTipoClasse(
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
        ]
    );

    describe('Rastreamento básico', () => {
        it('rastreia registro como novo', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Teste';

            rastreador.rastrear(registro, 'Artigo', 'novo');

            expect(rastreador.obterEstado(registro)).toBe('novo');
        });

        it('rastreia registro como inalterado', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Teste';

            rastreador.rastrear(registro, 'Artigo', 'inalterado');

            expect(rastreador.obterEstado(registro)).toBe('inalterado');
        });

        it('retorna null para registro não rastreado', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);

            expect(rastreador.obterEstado(registro)).toBeNull();
        });

        it('marca registro como modificado', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;

            rastreador.rastrear(registro, 'Artigo', 'inalterado');
            rastreador.marcarModificado(registro);

            expect(rastreador.obterEstado(registro)).toBe('modificado');
        });

        it('marca registro como excluido', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;

            rastreador.rastrear(registro, 'Artigo', 'inalterado');
            rastreador.marcarExcluido(registro);

            expect(rastreador.obterEstado(registro)).toBe('excluido');
        });
    });

    describe('Detecção de mudanças', () => {
        it('detecta mudança em propriedade', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Original';

            rastreador.rastrear(registro, 'Artigo', 'inalterado');

            registro.propriedades['titulo'] = 'Modificado';
            rastreador.detectarMudancas();

            expect(rastreador.obterEstado(registro)).toBe('modificado');
            expect(rastreador.obterCamposAlterados(registro)).toContain('titulo');
        });

        it('não marca como modificado se não houve mudança', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Mesmo';

            rastreador.rastrear(registro, 'Artigo', 'inalterado');
            rastreador.detectarMudancas();

            expect(rastreador.obterEstado(registro)).toBe('inalterado');
            expect(rastreador.obterCamposAlterados(registro)).toHaveLength(0);
        });

        it('detecta múltiplos campos alterados', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Original';

            rastreador.rastrear(registro, 'Artigo', 'inalterado');

            registro.propriedades['id'] = 2;
            registro.propriedades['titulo'] = 'Modificado';
            rastreador.detectarMudancas();

            const campos = rastreador.obterCamposAlterados(registro);
            expect(campos).toContain('id');
            expect(campos).toContain('titulo');
        });
    });

    describe('obterAlterados e obterTodosRastreados', () => {
        it('obterAlterados retorna apenas registros alterados', () => {
            const rastreador = new RastreadorMudancas();

            const reg1 = new ObjetoDeleguaClasse(descritorArtigo);
            reg1.propriedades['id'] = 1;
            rastreador.rastrear(reg1, 'Artigo', 'novo');

            const reg2 = new ObjetoDeleguaClasse(descritorArtigo);
            reg2.propriedades['id'] = 2;
            rastreador.rastrear(reg2, 'Artigo', 'inalterado');

            const alterados = rastreador.obterAlterados();
            expect(alterados).toHaveLength(1);
            expect(alterados[0].estado).toBe('novo');
        });

        it('obterTodosRastreados retorna todos os registros', () => {
            const rastreador = new RastreadorMudancas();

            const reg1 = new ObjetoDeleguaClasse(descritorArtigo);
            reg1.propriedades['id'] = 1;
            rastreador.rastrear(reg1, 'Artigo', 'novo');

            const reg2 = new ObjetoDeleguaClasse(descritorArtigo);
            reg2.propriedades['id'] = 2;
            rastreador.rastrear(reg2, 'Artigo', 'inalterado');

            expect(rastreador.obterTodosRastreados()).toHaveLength(2);
        });

        it('limpar remove todos os registros', () => {
            const rastreador = new RastreadorMudancas();
            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            rastreador.rastrear(registro, 'Artigo', 'novo');

            rastreador.limpar();

            expect(rastreador.obterTodosRastreados()).toHaveLength(0);
            expect(rastreador.obterEstado(registro)).toBeNull();
        });
    });

    describe('Integração com ContextoEntidades', () => {
        let tecnologiaMock: BonecoTecnologia;

        beforeEach(() => {
            tecnologiaMock = new BonecoTecnologia();
        });

        it('novo() registra entidade para inserção', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            contexto.registrarColecao(new Entidade(descritorArtigo));
            await contexto.iniciar(':memory:');

            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Novo artigo';

            contexto.novo('Artigo', registro);

            expect(contexto.rastreador.obterEstado(registro)).toBe('novo');
        });

        it('excluirRegistro() marca entidade para exclusão', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            contexto.registrarColecao(new Entidade(descritorArtigo));
            await contexto.iniciar(':memory:');

            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Artigo';

            contexto.novo('Artigo', registro);
            contexto.excluirRegistro('Artigo', registro);

            expect(contexto.rastreador.obterEstado(registro)).toBe('excluido');
        });

        it('buscarTodos() rastreia resultados como inalterados', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            contexto.registrarColecao(new Entidade(descritorArtigo));
            await contexto.iniciar(':memory:');

            tecnologiaMock.dadosEmMemoria['Artigo'] = [
                { id: 1, titulo: 'Artigo 1' },
                { id: 2, titulo: 'Artigo 2' }
            ];

            const resultados = await contexto.buscarTodos('Artigo');

            expect(resultados).toHaveLength(2);
            for (const reg of resultados) {
                expect(contexto.rastreador.obterEstado(reg)).toBe('inalterado');
            }
        });

        it('buscarPorId() rastreia resultado como inalterado', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            contexto.registrarColecao(new Entidade(descritorArtigo));
            await contexto.iniciar(':memory:');

            tecnologiaMock.dadosEmMemoria['Artigo'] = [
                { id: 1, titulo: 'Artigo 1' }
            ];

            const resultado = await contexto.buscarPorId('Artigo', 1);

            expect(resultado).toBeTruthy();
            expect(contexto.rastreador.obterEstado(resultado)).toBe('inalterado');
        });

        it('salvarMudancas() insere registros novos', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            contexto.registrarColecao(new Entidade(descritorArtigo));
            await contexto.iniciar(':memory:');

            const registro = new ObjetoDeleguaClasse(descritorArtigo);
            registro.propriedades['id'] = 1;
            registro.propriedades['titulo'] = 'Novo';

            contexto.novo('Artigo', registro);
            await contexto.salvarMudancas();

            expect(tecnologiaMock.dadosEmMemoria['Artigo']).toHaveLength(1);
            expect(contexto.rastreador.obterTodosRastreados()).toHaveLength(0);
        });

        it('salvarMudancas() exclui registros marcados', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);
            contexto.registrarColecao(new Entidade(descritorArtigo));
            await contexto.iniciar(':memory:');

            tecnologiaMock.dadosEmMemoria['Artigo'] = [
                { id: 1, titulo: 'Artigo 1' }
            ];

            const resultados = await contexto.buscarTodos('Artigo');
            contexto.excluirRegistro('Artigo', resultados[0]);
            await contexto.salvarMudancas();

            expect(tecnologiaMock.dadosEmMemoria['Artigo']).toHaveLength(0);
        });

        it('buscarTodos() lança erro para coleção não registrada', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);

            await expect(contexto.buscarTodos('Inexistente'))
                .rejects.toThrow("Coleção 'Inexistente' não registrada.");
        });

        it('buscarPorId() lança erro para coleção não registrada', async () => {
            const contexto = new ContextoEntidades(tecnologiaMock);

            await expect(contexto.buscarPorId('Inexistente', 1))
                .rejects.toThrow("Coleção 'Inexistente' não registrada.");
        });
    });
});
