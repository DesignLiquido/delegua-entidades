/**
 * Suite de Benchmarks de Performance
 * 
 * Fornece utilities para medir performance de operações ORM.
 */

export interface ResultadoPerformance {
    nome: string;
    duracao: number;
    iteracoes: number;
    mediaMs: number;
    min: number;
    max: number;
    desvio: number;
}

export interface ConfiguradorAnalisePerformance {
    iteracoes?: number;
    aquecimento?: number;
    tempoMaximo?: number;
}

/**
 * Executor de análise de performance
 */
export class ExecutorAnalisePerformance {
    private resultados: ResultadoPerformance[] = [];

    /**
     * Executa um benchmark
     */
    async executar(
        nome: string,
        funcao: () => Promise<void> | void,
        config?: ConfiguradorAnalisePerformance
    ): Promise<ResultadoPerformance> {
        const iteracoes = config?.iteracoes ?? 100;
        const aquecimento = config?.aquecimento ?? 10;
        const tempoMaximo = config?.tempoMaximo ?? 30000;

        // Fase de aquecimento
        for (let i = 0; i < aquecimento; i++) {
            await Promise.resolve(funcao());
        }

        // Realiza medições
        const tempos: number[] = [];
        const inicioTotal = performance.now();

        for (let i = 0; i < iteracoes; i++) {
            const inicio = performance.now();
            await Promise.resolve(funcao());
            const duracao = performance.now() - inicio;
            tempos.push(duracao);

            // Verifica tempo máximo
            if (performance.now() - inicioTotal > tempoMaximo) {
                throw new Error(`Benchmark '${nome}' excedeu o tempo máximo de ${tempoMaximo}ms`);
            }
        }

        const duracaoTotal = performance.now() - inicioTotal;

        // Calcula estatísticas
        const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
        const min = Math.min(...tempos);
        const max = Math.max(...tempos);
        
        const desvio = Math.sqrt(
            tempos.reduce((sq, n) => sq + Math.pow(n - media, 2), 0) / tempos.length
        );

        const resultado: ResultadoPerformance = {
            nome,
            duracao: duracaoTotal,
            iteracoes,
            mediaMs: media,
            min,
            max,
            desvio
        };

        this.resultados.push(resultado);
        return resultado;
    }

    /**
     * Executa benchmark síncrono
     */
    executarSync(
        nome: string,
        funcao: () => void,
        config?: ConfiguradorAnalisePerformance
    ): ResultadoPerformance {
        const iteracoes = config?.iteracoes ?? 100;
        const aquecimento = config?.aquecimento ?? 10;

        // Aquecimento
        for (let i = 0; i < aquecimento; i++) {
            funcao();
        }

        // Medições
        const tempos: number[] = [];
        const inicioTotal = performance.now();

        for (let i = 0; i < iteracoes; i++) {
            const inicio = performance.now();
            funcao();
            const duracao = performance.now() - inicio;
            tempos.push(duracao);
        }

        const duracaoTotal = performance.now() - inicioTotal;

        // Estatísticas
        const media = tempos.reduce((a, b) => a + b, 0) / tempos.length;
        const min = Math.min(...tempos);
        const max = Math.max(...tempos);
        const desvio = Math.sqrt(
            tempos.reduce((sq, n) => sq + Math.pow(n - media, 2), 0) / tempos.length
        );

        const resultado: ResultadoPerformance = {
            nome,
            duracao: duracaoTotal,
            iteracoes,
            mediaMs: media,
            min,
            max,
            desvio
        };

        this.resultados.push(resultado);
        return resultado;
    }

    /**
     * Compara desempenho de duas funções
     */
    async comparar(
        nome: string,
        nomeA: string,
        funcaoA: () => Promise<void> | void,
        nomeB: string,
        funcaoB: () => Promise<void> | void,
        config?: ConfiguradorAnalisePerformance
    ) {
        const resultadoA = await this.executar(nomeA, funcaoA, config);
        const resultadoB = await this.executar(nomeB, funcaoB, config);

        const diferencaMs = resultadoA.mediaMs - resultadoB.mediaMs;
        const percentual = ((diferencaMs / resultadoB.mediaMs) * 100).toFixed(2);
        const vencedor = diferencaMs < 0 ? "A" : "B";

        return {
            teste: nome,
            resultadoA,
            resultadoB,
            diferenca: {
                ms: Math.abs(diferencaMs),
                percentual: `${percentual}%`,
                vencedor,
                mensagem: diferencaMs < 0 
                    ? `${nomeA} é ${Math.abs(parseFloat(percentual))}% mais rápido`
                    : `${nomeB} é ${Math.abs(parseFloat(percentual))}% mais rápido`
            }
        };
    }

    /**
     * Obtém relatório de performance dos benchmarks executados
     */
    obterRelatorio(): string {
        if (this.resultados.length === 0) {
            return "Nenhum benchmark executado";
        }

        const linhas = [
            "═════════════════════════════════════════════════════════════",
            "📊 RELATÓRIO DE PERFORMANCE",
            "═════════════════════════════════════════════════════════════",
            ""
        ];

        // Classifica por média (mais rápido primeiro)
        const ordenados = [...this.resultados].sort((a, b) => a.mediaMs - b.mediaMs);

        for (const resultado of ordenados) {
            const icone = resultado === ordenados[0] ? "🏆" : "  ";
            linhas.push(`${icone} ${resultado.nome}`);
            linhas.push(
                `   ├─ Média:     ${resultado.mediaMs.toFixed(3)}ms`
            );
            linhas.push(
                `   ├─ Min:       ${resultado.min.toFixed(3)}ms`
            );
            linhas.push(
                `   ├─ Max:       ${resultado.max.toFixed(3)}ms`
            );
            linhas.push(
                `   ├─ Desvio:    ${resultado.desvio.toFixed(3)}ms`
            );
            linhas.push(
                `   └─ Iterações: ${resultado.iteracoes}`
            );
            linhas.push("");
        }

        if (this.resultados.length > 1) {
            const maisRapido = ordenados[0];
            const maisLento = ordenados[ordenados.length - 1];
            const diferenca = ((
                (maisLento.mediaMs - maisRapido.mediaMs) / maisRapido.mediaMs
            ) * 100).toFixed(2);

            linhas.push("═════════════════════════════════════════════════════════════");
            linhas.push(`Diferença: ${maisLento.nome} é ${diferenca}% mais lento que ${maisRapido.nome}`);
            linhas.push("═════════════════════════════════════════════════════════════");
        }

        return linhas.join("\n");
    }

    /**
     * Limpa resultados
     */
    limpar(): void {
        this.resultados = [];
    }

    /**
     * Obtém resultados armazenados
     */
    obterResultados(): ResultadoPerformance[] {
        return [...this.resultados];
    }
}

/**
 * Utilidades para testes de carga
 */
export class TestadorCarga {
    /**
     * Executa função com múltipla concorrência
     */
    static async testarConcorrencia(
        funcao: () => Promise<void>,
        paralelo: number,
        iteracoes: number
    ) {
        const inicio = performance.now();
        const erros: Error[] = [];

        for (let i = 0; i < iteracoes; i += paralelo) {
            const promessas = [];
            for (let j = 0; j < paralelo && i + j < iteracoes; j++) {
                promessas.push(
                    funcao().catch(e => erros.push(e))
                );
            }
            await Promise.all(promessas);
        }

        const duracao = performance.now() - inicio;

        return {
            iteracoes,
            paralelo,
            duracaoTotal: duracao,
            mediaMs: duracao / iteracoes,
            erros: erros.length,
            sucessos: iteracoes - erros.length
        };
    }

    /**
     * Teste de estresse: aumenta carga gradualmente
     */
    static async testeEstresse(
        funcao: () => Promise<void>,
        cargasIniciais: number[] = [1, 5, 10, 20, 50]
    ) {
        const resultados = [];

        for (const carga of cargasIniciais) {
            const resultado = await this.testarConcorrencia(funcao, carga, 100);
            resultados.push({ carga, ...resultado });

            // Para se houver muitos erros
            if (resultado.erros > resultado.sucessos * 0.1) {
                console.warn(`⚠️ Taxa de erro alta na carga ${carga}: ${resultado.erros} erros`);
                break;
            }
        }

        return resultados;
    }
}
