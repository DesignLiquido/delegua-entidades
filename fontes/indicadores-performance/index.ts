/**
 * Benchmarks de Performance - Suite Completa
 * 
 * Testa performance de cache, batch loading, e operações principais
 */

import { ExecutorAnalisePerformance } from "./executor-analise-performance";
import { CacheConsultas } from "../cache-consultas";
import { CarregadorLote } from "../carregador-lotes";

/**
 * Benchmarks de Cache
 */
export async function performanceCache() {
    console.log("\n📊 BENCHMARKS DE CACHE DE CONSULTAS\n");
    
    const executor = new ExecutorAnalisePerformance();
    const cache = new CacheConsultas(1000);

    // Benchmark 1: Armazenamento
    await executor.executarSync(
        "Cache: Armazenar consulta",
        () => {
            const consulta = { sql: "SELECT * FROM usuarios", params: [] };
            cache.armazenar("SELECT * FROM usuarios", consulta, [1]);
        },
        { iteracoes: 10000 }
    );

    // Benchmark 2: Busca com hit
    cache.limparTudo();
    const consulta = { sql: "SELECT * FROM usuarios", params: [] };
    cache.armazenar("SELECT * FROM usuarios", consulta, [1]);

    await executor.executarSync(
        "Cache: Busca sucesso (hit)",
        () => {
            cache.obter("SELECT * FROM usuarios", [1]);
        },
        { iteracoes: 10000 }
    );

    // Benchmark 3: Busca com miss
    await executor.executarSync(
        "Cache: Busca falha (miss)",
        () => {
            cache.obter("SELECT * FROM inexistente", [1]);
        },
        { iteracoes: 10000 }
    );

    // Benchmark 4: Taxa de acerto com muitos acessos
    cache.limparTudo();
    for (let i = 0; i < 100; i++) {
        const consulta2 = { sql: `SELECT ${i}`, params: [] };
        cache.armazenar(`SELECT ${i}`, consulta2, [i]);
    }

    let hits = 0;
    await executor.executarSync(
        "Cache: 90% hits (acesso repetido)",
        () => {
            if (Math.random() < 0.9) {
                cache.obter("SELECT 1", [1]);
                hits++;
            } else {
                cache.obter("SELECT inexistente", [1]);
            }
        },
        { iteracoes: 1000 }
    );

    console.log(executor.obterRelatorio());
    console.log(`\nTaxa de acerto: ${cache.obterEstatisticas().taxaAcerto}`);
}

/**
 * Benchmarks de Carregador em Lote
 */
export async function performanceCarregadorLote() {
    console.log("\n📊 BENCHMARKS DE CARREGADOR EM LOTE\n");
    
    const executor = new ExecutorAnalisePerformance();

    // Benchmark 1: Carregamento simples (sem batch)
    let chamadas1 = 0;
    const funcao1 = async (ids: number[]) => {
        chamadas1++;
        return new Map(ids.map(id => [id, `usuario_${id}`]));
    };

    const carregador1 = new CarregadorLote(funcao1, { tamanhoLote: 1000, cache: false });

    const tempo1 = await executor.executar(
        "Carregador: 100 hits sequenciais (sem batch)",
        async () => {
            await carregador1.carregar(Math.floor(Math.random() * 100));
        },
        { iteracoes: 100, aquecimento: 0 }
    );

    // Benchmark 2: Carregamento com batching
    let chamadas2 = 0;
    const funcao2 = async (ids: number[]) => {
        chamadas2++;
        // Simula I/O
        return new Map(ids.map(id => [id, `usuario_${id}`]));
    };

    const carregador2 = new CarregadorLote(funcao2, { 
        tamanhoLote: 10, 
        intervaloMs: 5, 
        cache: false 
    });

    const tempo2 = await executor.executar(
        "Carregador: 100 hits com batching",
        async () => {
            await carregador2.carregar(Math.floor(Math.random() * 100));
        },
        { iteracoes: 100, aquecimento: 0 }
    );

    // Benchmark 3: Com cache ativado
    let chamadas3 = 0;
    const funcao3 = async (ids: number[]) => {
        chamadas3++;
        return new Map(ids.map(id => [id, `usuario_${id}`]));
    };

    const carregador3 = new CarregadorLote(funcao3, {
        tamanhoLote: 10,
        intervaloMs: 5,
        cache: true
    });

    const tempo3 = await executor.executar(
        "Carregador: 100 hits com batching + cache",
        async () => {
            await carregador3.carregar(Math.floor(Math.random() * 20)); // Menos IDs = mais cache hits
        },
        { iteracoes: 100, aquecimento: 0 }
    );

    console.log(executor.obterRelatorio());
    console.log(`\nChamadas de banco:`);
    console.log(`  Sem batch: ${chamadas1}`);
    console.log(`  Com batch: ${chamadas2}`);
    console.log(`  Com cache: ${chamadas3}`);
    console.log(`\nRedução de queries:`);
    console.log(`  Lote: ${((1 - chamadas2 / chamadas1) * 100).toFixed(1)}% menos queries`);
    console.log(`  Cache: ${((1 - chamadas3 / chamadas1) * 100).toFixed(1)}% menos queries`);
}

/**
 * Comparação: Com vs Sem Cache
 */
export async function performanceComparativoCache() {
    console.log("\n📊 BENCHMARK COMPARATIVO: COM VS SEM CACHE\n");
    
    const executor = new ExecutorAnalisePerformance();

    // Sem cache
    let chamadas1 = 0;
    const funcao1 = async (ids: number[]) => {
        chamadas1++;
        return new Map(ids.map(id => [id, `usuario_${id}`]));
    };

    // Com cache
    let chamadas2 = 0;
    const funcao2 = async (ids: number[]) => {
        chamadas2++;
        return new Map(ids.map(id => [id, `usuario_${id}`]));
    };

    const carregadorSemCache = new CarregadorLote(funcao1, { 
        tamanhoLote: 10, 
        cache: false 
    });

    const carregadorComCache = new CarregadorLote(funcao2, {
        tamanhoLote: 10,
        cache: true
    });

    const resultado = await executor.comparar(
        "Carregamento com/sem cache",
        "Sem cache",
        async () => {
            await carregadorSemCache.carregar(1); // Sempre o mesmo ID
        },
        "Com cache",
        async () => {
            await carregadorComCache.carregar(1);
        },
        { iteracoes: 100, aquecimento: 10 }
    );

    console.log("\n📈 Resultado Comparativo:");
    console.log(`  ${resultado.resultadoA.nome}: ${resultado.resultadoA.mediaMs.toFixed(3)}ms`);
    console.log(`  ${resultado.resultadoB.nome}: ${resultado.resultadoB.mediaMs.toFixed(3)}ms`);
    console.log(`  ${resultado.diferenca.mensagem}`);
    console.log(`\nChamadas de banco:`);
    console.log(`  Sem cache: ${chamadas1} chamadas`);
    console.log(`  Com cache: ${chamadas2} chamadas`);
}

/**
 * Teste de Estresse do Cache
 */
export async function testeEstressCache() {
    console.log("\n📊 TESTE DE ESTRESSE: CACHE\n");
    
    const executor = new ExecutorAnalisePerformance();
    const cache = new CacheConsultas(100);

    // Teste 1: Armazenamento sob pressão
    await executor.executar(
        "Cache: Armazenar 10000 consultas diferentes",
        () => {
            const id = Math.floor(Math.random() * 10000);
            const consulta = { sql: `SELECT ${id}`, params: [] };
            cache.armazenar(`SELECT ${id}`, consulta, [id]);
        },
        { iteracoes: 10000, aquecimento: 0 }
    );

    // Teste 2: Acesso sob pressão (cache cheio)
    await executor.executar(
        "Cache: Buscar em cache de 100 items",
        () => {
            const id = Math.floor(Math.random() * 10000);
            cache.obter(`SELECT ${id}`, [id]);
        },
        { iteracoes: 10000, aquecimento: 0 }
    );

    console.log(executor.obterRelatorio());
    
    const stats = cache.obterEstatisticas();
    console.log(`\nEstatísticas finais:`);
    console.log(`  Tamanho: ${stats.tamanho}/${stats.limite}`);
    console.log(`  Taxa de acerto: ${stats.taxaAcerto}`);
    console.log(`  Limpezas: ${stats.limpezas}`);
}

/**
 * Executa todos os benchmarks
 */
export async function executarTodosIndicadoresPerformance() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║               SUITE COMPLETA DE PERFORMANCE                ║");
    console.log("╚════════════════════════════════════════════════════════════╝");

    try {
        await performanceCache();
        await performanceCarregadorLote();
        await performanceComparativoCache();
        await testeEstressCache();

        console.log("\n✅ Todos os indicadores de performance foram executados com sucesso!");
    } catch (erro) {
        console.error("\n❌ Erro durante indicadores de performance:", erro);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarTodosIndicadoresPerformance();
}
