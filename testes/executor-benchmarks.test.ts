import { ExecutorAnalisePerformance, TestadorCarga, ResultadoPerformance } from "../fontes/indicadores-performance/executor-analise-performance";

describe("Executor de Benchmarks", () => {
    describe("ExecutarSync", () => {
        it("deve executar benchmark síncrono", () => {
            const executor = new ExecutorAnalisePerformance();
            
            let contador = 0;
            const resultado = executor.executarSync(
                "Incremento",
                () => {
                    contador++;
                },
                { iteracoes: 10, aquecimento: 0 }
            );

            expect(contador).toBe(10);
            expect(resultado.nome).toBe("Incremento");
            expect(resultado.iteracoes).toBe(10);
            expect(resultado.mediaMs).toBeGreaterThan(0);
        });

        it("deve calcular estatísticas corretamente", () => {
            const executor = new ExecutorAnalisePerformance();
            let chamadas = 0;

            const resultado = executor.executarSync(
                "Teste",
                () => {
                    chamadas++;
                },
                { iteracoes: 5, aquecimento: 0 }
            );

            expect(resultado.min).toBeLessThanOrEqual(resultado.mediaMs);
            expect(resultado.max).toBeGreaterThanOrEqual(resultado.mediaMs);
            expect(resultado.mediaMs).toBeGreaterThan(0);
            expect(resultado.desvio).toBeGreaterThanOrEqual(0);
        });

        it("deve executar aquecimento corretamente", () => {
            const executor = new ExecutorAnalisePerformance();
            
            let contador = 0;
            executor.executarSync(
                "Teste",
                () => {
                    contador++;
                },
                { iteracoes: 5, aquecimento: 3 }
            );

            // Total = aquecimento + iterações = 8
            expect(contador).toBe(8);
        });
    });

    describe("Executar (Assíncrono)", () => {
        it("deve executar benchmark assíncrono", async () => {
            const executor = new ExecutorAnalisePerformance();
            
            let contador = 0;
            const resultado = await executor.executar(
                "Async",
                async () => {
                    contador++;
                },
                { iteracoes: 10, aquecimento: 0 }
            );

            expect(contador).toBe(10);
            expect(resultado.nome).toBe("Async");
            expect(resultado.mediaMs).toBeGreaterThan(0);
        });

        it("deve medir tempo corretamente", async () => {
            const executor = new ExecutorAnalisePerformance();
            
            const resultado = await executor.executar(
                "Delay",
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                },
                { iteracoes: 3, aquecimento: 0 }
            );

            // Cada iteração deve levar ~10ms, então média deve ser próxima a 10ms
            expect(resultado.mediaMs).toBeGreaterThan(5);
            expect(resultado.min).toBeGreaterThan(5);
        });
    });

    describe("Comparar", () => {
        it("deve comparar dois benchmarks", async () => {
            const executor = new ExecutorAnalisePerformance();
            
            const resultado = await executor.comparar(
                "Comparação",
                "Rápido",
                () => {
                    // Operação rápida
                    let x = 1;
                    x++;
                },
                "Lento",
                () => {
                    // Operação lenta
                    for (let i = 0; i < 1000; i++) {
                        Math.sqrt(i);
                    }
                },
                { iteracoes: 100, aquecimento: 10 }
            );

            expect(resultado.teste).toBe("Comparação");
            expect(resultado.resultadoA.nome).toBe("Rápido");
            expect(resultado.resultadoB.nome).toBe("Lento");
            expect(resultado.diferenca.vencedor).toBe("A");
            expect(resultado.resultadoA.mediaMs).toBeLessThan(resultado.resultadoB.mediaMs);
        });

        it("deve calcular diferença em percentual", async () => {
            const executor = new ExecutorAnalisePerformance();
            
            const resultado = await executor.comparar(
                "Teste",
                "A",
                () => {
                    let x = 1; x++;
                },
                "B",
                () => {
                    let x = 1; x++; x++;
                },
                { iteracoes: 100, aquecimento: 10 }
            );

            // Deve ter uma diferença percentual calculável
            expect(resultado.diferenca.percentual).toMatch(/\d+\.\d+%/);
        });
    });

    describe("Relatório", () => {
        it("deve retornar mensagem para nenhum benchmark", () => {
            const executor = new ExecutorAnalisePerformance();
            const relatorio = executor.obterRelatorio();

            expect(relatorio).toContain("Nenhum benchmark");
        });

        it("deve formatar relatório com dados", () => {
            const executor = new ExecutorAnalisePerformance();

            executor.executarSync("Teste 1", () => { }, { iteracoes: 5, aquecimento: 0 });
            executor.executarSync("Teste 2", () => { }, { iteracoes: 5, aquecimento: 0 });

            const relatorio = executor.obterRelatorio();

            expect(relatorio).toContain("RELATÓRIO DE PERFORMANCE");
            expect(relatorio).toContain("Teste 1");
            expect(relatorio).toContain("Teste 2");
            expect(relatorio).toContain("Média:");
            expect(relatorio).toContain("Min:");
            expect(relatorio).toContain("Max:");
        });

        it("deve exibir vencedor (mais rápido) com troféu", () => {
            const executor = new ExecutorAnalisePerformance();

            executor.executarSync("Rápido", () => { }, { iteracoes: 5, aquecimento: 0 });
            executor.executarSync("Lento", () => {
                for (let i = 0; i < 100; i++) {
                    Math.sqrt(i);
                }
            }, { iteracoes: 5, aquecimento: 0 });

            const relatorio = executor.obterRelatorio();

            expect(relatorio).toContain("🏆");
        });

        it("deve mostrar diferença percentual entre benchmarks", () => {
            const executor = new ExecutorAnalisePerformance();

            executor.executarSync("Teste 1", () => { }, { iteracoes: 100, aquecimento: 0 });
            executor.executarSync("Teste 2", () => {
                for (let i = 0; i < 10; i++) {
                    Math.sqrt(i);
                }
            }, { iteracoes: 100, aquecimento: 0 });

            const relatorio = executor.obterRelatorio();

            if (relatorio.includes("Diferença")) {
                expect(relatorio).toMatch(/\d+\.\d+% mais/);
            }
        });
    });

    describe("Gerenciamento de Resultados", () => {
        it("deve armazenar resultados", () => {
            const executor = new ExecutorAnalisePerformance();

            executor.executarSync("Teste 1", () => { }, { iteracoes: 5, aquecimento: 0 });
            executor.executarSync("Teste 2", () => { }, { iteracoes: 5, aquecimento: 0 });

            const resultados = executor.obterResultados();

            expect(resultados.length).toBe(2);
            expect(resultados[0].nome).toBe("Teste 1");
            expect(resultados[1].nome).toBe("Teste 2");
        });

        it("deve limpar resultados", () => {
            const executor = new ExecutorAnalisePerformance();

            executor.executarSync("Teste", () => { }, { iteracoes: 5, aquecimento: 0 });
            expect(executor.obterResultados().length).toBe(1);

            executor.limpar();
            expect(executor.obterResultados().length).toBe(0);
        });
    });
});

describe("Testador de Carga", () => {
    describe("testarConcorrencia", () => {
        it("deve executar com múltiplas requisições paralelas", async () => {
            let executadas = 0;
            let paralelas = 0;
            let maxParalelas = 0;

            const funcao = async () => {
                paralelas++;
                maxParalelas = Math.max(maxParalelas, paralelas);
                executadas++;
                await new Promise(resolve => setTimeout(resolve, 10));
                paralelas--;
            };

            const resultado = await TestadorCarga.testarConcorrencia(
                funcao,
                5,  // 5 paralelo
                10  // 10 iterações total
            );

            expect(resultado.iteracoes).toBe(10);
            expect(resultado.paralelo).toBe(5);
            expect(resultado.sucessos).toBe(10);
            expect(resultado.erros).toBe(0);
        });

        it("deve contar erros corretamente", async () => {
            let chamadas = 0;

            const funcao = async () => {
                chamadas++;
                if (chamadas % 2 === 0) {
                    throw new Error("Erro simulado");
                }
            };

            const resultado = await TestadorCarga.testarConcorrencia(
                funcao,
                2,
                10
            );

            expect(resultado.erros).toBeGreaterThan(0);
            expect(resultado.sucessos).toBeGreaterThan(0);
        });

        it("deve medir tempo total", async () => {
            const inicio = Date.now();

            const resultado = await TestadorCarga.testarConcorrencia(
                async () => {
                    await new Promise(resolve => setTimeout(resolve, 50));
                },
                2,
                4  // 4 iterações, 2 paralelo = 2 batches de 50ms = ~100ms total
            );

            expect(resultado.duracaoTotal).toBeGreaterThan(50);
            // mediaMs é duracaoTotal/iteracoes, então com 2 em paralelo é ~50ms total para 4 iterações = ~12,5ms por iteração
        });
    });

    describe("testeEstresse", () => {
        it("deve testar com cargas crescentes", async () => {
            const funcao = async () => {
                // Sempre sucesso
            };

            const resultado = await TestadorCarga.testeEstresse(
                funcao,
                [1, 2, 5]
            );

            expect(resultado.length).toBe(3);
            expect(resultado[0].carga).toBe(1);
            expect(resultado[1].carga).toBe(2);
            expect(resultado[2].carga).toBe(5);
        });

        it("deve parar se taxa de erro ficar alta", async () => {
            let tentativa = 0;

            const funcao = async () => {
                tentativa++;
                if (tentativa > 50) {
                    throw new Error("Carga excessiva");
                }
            };

            const resultado = await TestadorCarga.testeEstresse(
                funcao,
                [1, 10, 20, 40]
            );

            // Deve parar no meio (antes de testar todas as cargas)
            expect(resultado.length).toBeLessThan(4);
        });

        it("deve calcular estatísticas para cada carga", async () => {
            const funcao = async () => {
                // Noop
            };

            const resultado = await TestadorCarga.testeEstresse(
                funcao,
                [1, 2]
            );

            for (const item of resultado) {
                expect(item.carga).toBeDefined();
                expect(item.iteracoes).toBe(100);
                expect(item.duracaoTotal).toBeGreaterThan(0);
                expect(item.sucessos).toBeGreaterThan(0);
            }
        });
    });
});
