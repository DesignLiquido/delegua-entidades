import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { GerenciadorCache } from "../../fontes/gerenciador-cache";
import { ContextoEntidades } from "../../fontes/contexto-entidades";
import { Entidade } from "../../fontes/entidade";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Cache (4.7)', () => {
    describe('Cache de Primeira Nível (Identity Map)', () => {
        test('deve armazenar e recuperar objeto do cache L1', () => {
            const cache = new GerenciadorCache();
            const objeto = { id: 1, nome: "João" };

            cache.armazenarNivel1("Usuario", 1, objeto);
            const recuperado = cache.obterNivel1("Usuario", 1);

            expect(recuperado).toBe(objeto); // Deve ser a mesma referência
        });

        test('deve retornar undefined para objeto não cacheado', () => {
            const cache = new GerenciadorCache();

            const recuperado = cache.obterNivel1("Usuario", 999);

            expect(recuperado).toBeUndefined();
        });

        test('deve armazenar múltiplos objetos diferentes', () => {
            const cache = new GerenciadorCache();
            const obj1 = { id: 1, nome: "João" };
            const obj2 = { id: 2, nome: "Maria" };

            cache.armazenarNivel1("Usuario", 1, obj1);
            cache.armazenarNivel1("Usuario", 2, obj2);

            expect(cache.obterNivel1("Usuario", 1)).toBe(obj1);
            expect(cache.obterNivel1("Usuario", 2)).toBe(obj2);
        });

        test('deve manter identidade de múltiplas entidades', () => {
            const cache = new GerenciadorCache();
            const usuario = { id: 1, nome: "João" };
            const produto = { id: 1, nome: "Notebook" };

            cache.armazenarNivel1("Usuario", 1, usuario);
            cache.armazenarNivel1("Produto", 1, produto);

            expect(cache.obterNivel1("Usuario", 1)).toBe(usuario);
            expect(cache.obterNivel1("Produto", 1)).toBe(produto);
            expect(cache.obterNivel1("Usuario", 1)).not.toBe(produto);
        });
    });

    describe('Cache de Segunda Nível (L2)', () => {
        test('deve armazenar e recuperar objeto do cache L2', () => {
            const cache = new GerenciadorCache();
            const objeto = { id: 1, nome: "João" };

            cache.armazenarNivel2("Usuario", 1, objeto);
            const recuperado = cache.obterNivel2("Usuario", 1);

            expect(recuperado).toEqual(objeto);
        });

        test('deve respeitar TTL (time to live)', async () => {
            const cache = new GerenciadorCache({ ttl: 100 });
            const objeto = { id: 1, nome: "João" };

            cache.armazenarNivel2("Usuario", 1, objeto);

            expect(cache.obterNivel2("Usuario", 1)).toEqual(objeto);

            // Aguardar mais que o TTL
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(cache.obterNivel2("Usuario", 1)).toBeUndefined();
        });

        test('deve respeitar tamanho máximo do cache', () => {
            const cache = new GerenciadorCache({ tamanhMaximo: 3 });

            cache.armazenarNivel2("Usuario", 1, { id: 1 });
            cache.armazenarNivel2("Usuario", 2, { id: 2 });
            cache.armazenarNivel2("Usuario", 3, { id: 3 });
            cache.armazenarNivel2("Usuario", 4, { id: 4 });

            // Não deve ultrapassar o tamanho máximo
            const stats = cache.obterEstatisticas();
            expect(stats.nivel2).toBeLessThanOrEqual(3);
        });
    });

    describe('Remoção de Cache', () => {
        test('deve remover objeto do cache L1', () => {
            const cache = new GerenciadorCache();
            const objeto = { id: 1, nome: "João" };

            cache.armazenarNivel1("Usuario", 1, objeto);
            expect(cache.obterNivel1("Usuario", 1)).toBe(objeto);

            cache.remover("Usuario", 1);
            expect(cache.obterNivel1("Usuario", 1)).toBeUndefined();
        });

        test('deve remover objeto de ambos os níveis', () => {
            const cache = new GerenciadorCache();
            const objeto = { id: 1, nome: "João" };

            cache.armazenarNivel1("Usuario", 1, objeto);
            expect(cache.obterNivel1("Usuario", 1)).toBe(objeto);
            expect(cache.obterNivel2("Usuario", 1)).toEqual(objeto);

            cache.remover("Usuario", 1);
            expect(cache.obterNivel1("Usuario", 1)).toBeUndefined();
            expect(cache.obterNivel2("Usuario", 1)).toBeUndefined();
        });

        test('deve limpar cache de uma entidade específica', () => {
            const cache = new GerenciadorCache();
            cache.armazenarNivel1("Usuario", 1, { id: 1 });
            cache.armazenarNivel1("Usuario", 2, { id: 2 });
            cache.armazenarNivel1("Produto", 1, { id: 1 });

            cache.limparEntidade("Usuario");

            expect(cache.obterNivel1("Usuario", 1)).toBeUndefined();
            expect(cache.obterNivel1("Usuario", 2)).toBeUndefined();
            expect(cache.obterNivel1("Produto", 1)).toBeDefined();
        });

        test('deve limpar todo o cache', () => {
            const cache = new GerenciadorCache();
            cache.armazenarNivel1("Usuario", 1, { id: 1 });
            cache.armazenarNivel1("Produto", 1, { id: 1 });

            cache.limparTudo();

            expect(cache.obterNivel1("Usuario", 1)).toBeUndefined();
            expect(cache.obterNivel1("Produto", 1)).toBeUndefined();
        });
    });

    describe('Estatísticas do Cache', () => {
        test('deve reportar estatísticas corretas', () => {
            const cache = new GerenciadorCache();
            cache.armazenarNivel1("Usuario", 1, { id: 1 });
            cache.armazenarNivel1("Usuario", 2, { id: 2 });
            cache.armazenarNivel2("Produto", 1, { id: 1 });

            const stats = cache.obterEstatisticas();

            expect(stats.nivel1).toBe(2);
            expect(stats.nivel2).toBeGreaterThan(0);
            expect(stats.total).toBeGreaterThanOrEqual(3);
        });

        test('deve retornar zero para cache vazio', () => {
            const cache = new GerenciadorCache();

            const stats = cache.obterEstatisticas();

            expect(stats.nivel1).toBe(0);
            expect(stats.nivel2).toBe(0);
            expect(stats.total).toBe(0);
        });
    });

    describe('Integração com ContextoEntidades', () => {
        test('deve armazenar registro no cache do contexto', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "nome", "nome", 3, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = { id: 1, nome: "João" };

            contexto.armazenarenCache("Usuario", 1, registro);
            const recuperado = contexto.obterDoCache("Usuario", 1);

            expect(recuperado).toBe(registro);
        });

        test('deve remover registro do cache do contexto', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = { id: 1 };

            contexto.armazenarenCache("Usuario", 1, registro);
            expect(contexto.obterDoCache("Usuario", 1)).toBe(registro);

            contexto.removerDoCache("Usuario", 1);
            expect(contexto.obterDoCache("Usuario", 1)).toBeUndefined();
        });

        test('deve limpar cache de entidade via contexto', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = { id: 1 };

            contexto.armazenarenCache("Usuario", 1, registro);
            expect(contexto.obterDoCache("Usuario", 1)).toBe(registro);

            contexto.limparCacheEntidade("Usuario");
            expect(contexto.obterDoCache("Usuario", 1)).toBeUndefined();
        });

        test('deve limpar todo o cache via contexto', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const descritor1 = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    )
                ]
            );

            const descritor2 = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Produto", "Produto", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidade1 = new Entidade(descritor1);
            const entidade2 = new Entidade(descritor2);

            const registro1 = new ObjetoDeleguaClasse(entidade1.modelo);
            registro1.propriedades = { id: 1 };

            const registro2 = new ObjetoDeleguaClasse(entidade2.modelo);
            registro2.propriedades = { id: 1 };

            contexto.armazenarenCache("Usuario", 1, registro1);
            contexto.armazenarenCache("Produto", 1, registro2);

            contexto.limparCacheTudo();

            expect(contexto.obterDoCache("Usuario", 1)).toBeUndefined();
            expect(contexto.obterDoCache("Produto", 1)).toBeUndefined();
        });

        test('deve obter estatísticas do cache via contexto', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 2, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = { id: 1 };

            contexto.armazenarenCache("Usuario", 1, registro);

            const stats = contexto.obterEstatisticasCache();

            expect(stats.nivel1).toBeGreaterThan(0);
            expect(stats.total).toBeGreaterThan(0);
        });
    });

    describe('Casos Especiais', () => {
        test('deve suportar IDs de diferentes tipos', () => {
            const cache = new GerenciadorCache();

            cache.armazenarNivel1("Usuario", 1, { id: 1 });
            cache.armazenarNivel1("Usuario", "abc", { id: "abc" });
            cache.armazenarNivel1("Usuario", { x: 1 }, { id: "compound" });

            expect(cache.obterNivel1("Usuario", 1)).toBeDefined();
            expect(cache.obterNivel1("Usuario", "abc")).toBeDefined();
            expect(cache.obterNivel1("Usuario", { x: 1 })).toBeUndefined(); // Objetos não são comparados por igualdade
        });

        test('deve manter cache mesmo após múltiplas operações', () => {
            const cache = new GerenciadorCache();
            const objeto = { id: 1, nome: "João" };

            cache.armazenarNivel1("Usuario", 1, objeto);
            cache.remover("Usuario", 2); // Remover algo que não existe
            cache.remover("Produto", 1);

            const recuperado = cache.obterNivel1("Usuario", 1);
            expect(recuperado).toBe(objeto);
        });

        test('deve permitir sobrescrever objeto em cache', () => {
            const cache = new GerenciadorCache();
            const obj1 = { id: 1, nome: "João" };
            const obj2 = { id: 1, nome: "João Atualizado" };

            cache.armazenarNivel1("Usuario", 1, obj1);
            expect(cache.obterNivel1("Usuario", 1)).toBe(obj1);

            cache.armazenarNivel1("Usuario", 1, obj2);
            expect(cache.obterNivel1("Usuario", 1)).toBe(obj2);
        });
    });
});
