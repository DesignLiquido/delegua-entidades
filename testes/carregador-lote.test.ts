import { CarregadorLote, GerenciadorCarregadoresLote } from "../fontes/carregador-lotes";

describe("Carregador em Lote (DataLoader)", () => {
    describe("CarregadorLote", () => {
        it("deve aguardar múltiplas requisições e processar em lote", async () => {
            const idCarregado: number[] = [];
            let chamadas = 0;

            const funcaoCarregamento = async (ids: number[]) => {
                chamadas++;
                idCarregado.push(...ids);
                const resultado = new Map(ids.map(id => [id, `usuario_${id}`]));
                return resultado;
            };

            const carregador = new CarregadorLote(funcaoCarregamento, {
                tamanhoLote: 3,
                intervaloMs: 50,
                cache: false
            });

            // Requisita 3 items sem delay
            const promessas = [
                carregador.carregar(1),
                carregador.carregar(2),
                carregador.carregar(3)
            ];

            const resultados = await Promise.all(promessas);

            expect(chamadas).toBe(1); // Uma única chamada
            expect(resultados).toEqual(["usuario_1", "usuario_2", "usuario_3"]);
            expect(idCarregado).toEqual([1, 2, 3]);
        });

        it("deve processar por delay se não atingir tamanho do lote", async () => {
            const idCarregado: number[] = [];
            let chamadas = 0;

            const funcaoCarregamento = async (ids: number[]) => {
                chamadas++;
                idCarregado.push(...ids);
                const resultado = new Map(ids.map(id => [id, `usuario_${id}`]));
                return resultado;
            };

            const carregador = new CarregadorLote(funcaoCarregamento, {
                tamanhoLote: 5,
                intervaloMs: 100,
                cache: false
            });

            const promessas = [
                carregador.carregar(1),
                carregador.carregar(2)
            ];

            const resultados = await Promise.all(promessas);

            expect(chamadas).toBe(1); // Processou por delay
            expect(resultados).toEqual(["usuario_1", "usuario_2"]);
        });

        it("deve armazenar em cache quando configurado", async () => {
            let chamadas = 0;

            const funcaoCarregamento = async (ids: number[]) => {
                chamadas++;
                const resultado = new Map(ids.map(id => [id, `usuario_${id}`]));
                return resultado;
            };

            const carregador = new CarregadorLote(funcaoCarregamento, {
                tamanhoLote: 1,
                intervaloMs: 10,
                cache: true
            });

            // Primeira requisição
            const resultado1 = await carregador.carregar(1);
            expect(resultado1).toBe("usuario_1");
            expect(chamadas).toBe(1);

            // Segunda requisição do mesmo ID (deve vir do cache)
            const resultado2 = await carregador.carregar(1);
            expect(resultado2).toBe("usuario_1");
            expect(chamadas).toBe(1); // Não aumentou
        });

        it("deve rejeitar promise em caso de erro", async () => {
            const funcaoCarregamento = async () => {
                throw new Error("Erro de banco de dados");
            };

            const carregador = new CarregadorLote(funcaoCarregamento, {
                tamanhoLote: 1,
                intervaloMs: 10
            });

            await expect(carregador.carregar(1)).rejects.toThrow("Erro de banco de dados");
        });

        it("deve agrupar requisições se houver mais de um lote", async () => {
            let chamadas = 0;

            const funcaoCarregamento = async (ids: number[]) => {
                chamadas++;
                const resultado = new Map(ids.map(id => [id, `usuario_${id}`]));
                return resultado;
            };

            const carregador = new CarregadorLote(funcaoCarregamento, {
                tamanhoLote: 2,
                intervaloMs: 10,
                cache: false
            });

            // 5 requisições = 3 partes (2 + 2 + 1)
            const promessas = Array.from({ length: 5 }, (_, i) => 
                carregador.carregar(i + 1)
            );

            const resultados = await Promise.all(promessas);

            expect(chamadas).toBe(3); // 3 chamadas
            expect(resultados.length).toBe(5);
        });

        it("deve limpar cache e retornar estatísticas corretas", async () => {
            let chamadas = 0;

            const funcaoCarregamento = async (ids: number[]) => {
                chamadas++;
                const resultado = new Map(ids.map(id => [id, `usuario_${id}`]));
                return resultado;
            };

            const carregador = new CarregadorLote(funcaoCarregamento, {
                tamanhoLote: 1,
                intervaloMs: 10,
                cache: true
            });

            // Carrega alguns items
            await carregador.carregar(1);
            await carregador.carregar(2);
            await carregador.carregar(1); // Cache hit

            let stats = carregador.obterEstatisticas();
            expect(stats.tamanhoCache).toBeGreaterThan(0);

            carregador.limparCache();

            stats = carregador.obterEstatisticas();
            expect(stats.tamanhoCache).toBe(0);
        });
    });

    describe("GerenciadorCarregadoresLote", () => {
        it("deve criar e gerenciar múltiplos carregadores", async () => {
            const gerenciador = new GerenciadorCarregadoresLote();

            const funcaoCarregamento1 = async (ids: number[]) => {
                const resultado = new Map(ids.map(id => [id, `usuario_${id}`]));
                return resultado;
            };

            const funcaoCarregamento2 = async (ids: number[]) => {
                const resultado = new Map(ids.map(id => [id, `post_${id}`]));
                return resultado;
            };

            const carregador1 = gerenciador.criarCarregador("usuarios", funcaoCarregamento1);
            const carregador2 = gerenciador.criarCarregador("posts", funcaoCarregamento2);

            const resultado1 = await carregador1.carregar(1);
            const resultado2 = await carregador2.carregar(1);

            expect(resultado1).toBe("usuario_1");
            expect(resultado2).toBe("post_1");
        });

        it("deve obter carregador existente", () => {
            const gerenciador = new GerenciadorCarregadoresLote();

            const funcaoCarregamento = async (ids: number[]) => 
                new Map(ids.map(id => [id, `usuario_${id}`]));

            const carregador = gerenciador.criarCarregador("usuarios", funcaoCarregamento);
            const carregadorRecuperado = gerenciador.obterCarregador("usuarios");

            expect(carregadorRecuperado).toBe(carregador);
        });

        it("deve retornar null para carregador inexistente", () => {
            const gerenciador = new GerenciadorCarregadoresLote();
            const resultado = gerenciador.obterCarregador("inexistente");

            expect(resultado).toBeNull();
        });

        it("deve limpar todos os carregadores", () => {
            const gerenciador = new GerenciadorCarregadoresLote();

            const funcao = async (ids: number[]) => 
                new Map(ids.map(id => [id, id]));

            gerenciador.criarCarregador("usuarios", funcao);
            gerenciador.criarCarregador("posts", funcao);

            gerenciador.limparTodos();

            expect(gerenciador.obterCarregador("usuarios")).toBeNull();
            expect(gerenciador.obterCarregador("posts")).toBeNull();
        });

        it("deve retornar status de todos os carregadores", async () => {
            const gerenciador = new GerenciadorCarregadoresLote();

            const funcao = async (ids: number[]) => 
                new Map(ids.map(id => [id, id]));

            const carregador1 = gerenciador.criarCarregador("usuarios", funcao, { cache: true });
            const carregador2 = gerenciador.criarCarregador("posts", funcao, { cache: true });

            await carregador1.carregar(1);
            await carregador2.carregar(1);

            const status = gerenciador.obterStatus();

            expect(status.usuarios).toBeDefined();
            expect(status.posts).toBeDefined();
            expect(status.usuarios.tamanhoCache).toBeGreaterThan(0);
        });
    });
});
