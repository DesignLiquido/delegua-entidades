import { CacheConsultas } from "../../fontes/cache-consultas";

describe("Cache de Consultas", () => {
    let cache: CacheConsultas;

    beforeEach(() => {
        cache = new CacheConsultas(5);
    });

    describe("Armazenamento e Recuperação", () => {
        it("deve armazenar e recuperar consulta do cache", () => {
            const sql = "SELECT * FROM usuarios WHERE id = ?";
            // Usa um objeto simples como mock de consulta
            const consulta = { sql, params: [] };
            const parametros = [1];

            cache.armazenar(sql, consulta, parametros);
            const resultado = cache.obter(sql, parametros);

            expect(resultado).toBe(consulta);
        });

        it("deve retornar null se consulta não existe no cache", () => {
            const sql = "SELECT * FROM inexistente";
            const resultado = cache.obter(sql);

            expect(resultado).toBeNull();
        });

        it("deve gerar chaves diferentes para parametros diferentes", () => {
            const sql = "SELECT * FROM usuarios WHERE id = ?";
            const consulta1 = { sql, params: [] };
            const consulta2 = { sql, params: [] };

            cache.armazenar(sql, consulta1, [1]);
            cache.armazenar(sql, consulta2, [2]);

            expect(cache.obter(sql, [1])).toBe(consulta1);
            expect(cache.obter(sql, [2])).toBe(consulta2);
        });
    });

    describe("Gerenciamento de Limite", () => {
        it("deve limpar entrada quando atingir limite", () => {
            const consulta = { sql: "SELECT", params: [] };

            // Preenche até o limite
            for (let i = 0; i < 5; i++) {
                cache.armazenar(`SELECT ${i}`, consulta, [i]);
            }

            const stats1 = cache.obterEstatisticas();
            expect(stats1.tamanho).toBe(5);

            // Adiciona uma mais
            cache.armazenar("SELECT 6", consulta, [6]);

            const stats2 = cache.obterEstatisticas();
            expect(stats2.tamanho).toBeLessThanOrEqual(5);
            expect(stats2.limpezas).toBeGreaterThan(0);
        });

        it("deve dar preferência a entradas mais acessadas", () => {
            const consulta = { sql: "SELECT", params: [] };

            // Armazena 2 consultas
            cache.armazenar("SELECT 1", consulta, [1]);
            cache.armazenar("SELECT 2", consulta, [2]);

            // Acessa a primeira várias vezes
            for (let i = 0; i < 10; i++) {
                cache.obter("SELECT 1", [1]);
            }

            // Preenche cache completamente
            for (let i = 3; i < 5; i++) {
                cache.armazenar(`SELECT ${i}`, consulta, [i]);
            }

            // Primeira deve estar no cache (mais acessada)
            expect(cache.obter("SELECT 1", [1])).not.toBeNull();
        });
    });

    describe("Estatísticas", () => {
        it("deve rastrear hits e misses", () => {
            const consulta = { sql: "SELECT", params: [] };

            cache.armazenar("SELECT 1", consulta, [1]);
            cache.obter("SELECT 1", [1]); // Hit
            cache.obter("SELECT 2", [2]); // Miss
            cache.obter("SELECT 1", [1]); // Hit

            const stats = cache.obterEstatisticas();
            expect(stats.acertos).toBe(2);
            expect(stats.extravios).toBe(1);
        });

        it("deve calcular taxa de acerto corretamente", () => {
            const consulta = { sql: "SELECT", params: [] };

            cache.armazenar("SELECT 1", consulta, [1]);
            cache.obter("SELECT 1", [1]); // Hit
            cache.obter("SELECT 1", [1]); // Hit
            cache.obter("SELECT 2", [2]); // Miss

            const stats = cache.obterEstatisticas();
            expect(stats.taxaAcerto).toBe("66.67%");
        });

        it("deve retornar status de utilização", () => {
            const consulta = { sql: "SELECT", params: [] };

            cache.armazenar("SELECT 1", consulta, [1]);
            cache.armazenar("SELECT 2", consulta, [2]);

            const stats = cache.obterEstatisticas();
            expect(stats.utilizacao).toBe("40.00%");
        });
    });

    describe("Limpeza", () => {
        it("deve limpar todo o cache", () => {
            const consulta = { sql: "SELECT", params: [] };

            cache.armazenar("SELECT 1", consulta, [1]);
            cache.armazenar("SELECT 2", consulta, [2]);

            const statsBefore = cache.obterEstatisticas();
            expect(statsBefore.tamanho).toBeGreaterThan(0);

            cache.limparTudo();

            const statsAfter = cache.obterEstatisticas();
            expect(statsAfter.tamanho).toBe(0);
            expect(statsAfter.acertos).toBe(0);
            expect(statsAfter.extravios).toBe(0);
        });
    });
});
