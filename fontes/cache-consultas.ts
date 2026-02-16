/**
 * Cache de Consultas Compiladas
 * 
 * Armazena consultas compiladas para reutilização,
 * evitando recompilação de consultas frequentes.
 */
interface EntradaCache<T = any> {
    consulta: T;
    acessos: number;
    ultimoAcesso: Date;
}

export class CacheConsultas<T = any> {
    private cache: Map<string, EntradaCache<T>> = new Map();
    private limite: number;
    private estatisticas = {
        acertos: 0,
        extravios: 0,
        limpezas: 0
    };

    constructor(limite: number = 100) {
        this.limite = limite;
    }

    /**
     * Gera chave única para a consulta
     */
    private gerarChave(sql: string, parametros: any[] = []): string {
        const parametrosStr = JSON.stringify(parametros);
        return `${sql}:${parametrosStr}`;
    }

    /**
     * Obtém consulta do cache se existir
     */
    obter(sql: string, parametros?: any[]): T | null {
        const chave = this.gerarChave(sql, parametros);
        const entrada = this.cache.get(chave);

        if (entrada) {
            entrada.acessos++;
            entrada.ultimoAcesso = new Date();
            this.estatisticas.acertos++;
            return entrada.consulta;
        }

        this.estatisticas.extravios++;
        return null;
    }

    /**
     * Armazena consulta no cache
     */
    armazenar(sql: string, consulta: T, parametros?: any[]): void {
        const chave = this.gerarChave(sql, parametros);

        // Limpar se cache cheio
        if (this.cache.size >= this.limite) {
            this.limparEntrada();
        }

        this.cache.set(chave, {
            consulta,
            acessos: 0,
            ultimoAcesso: new Date()
        });
    }

    /**
     * Remove entrada menos usada/mais antiga
     */
    private limparEntrada(): void {
        let chaveParaRemover: string | null = null;
        let menorPontuacao = Infinity;

        for (const [chave, entrada] of this.cache.entries()) {
            // Pontuação = acessos + dias desde último acesso (penalidade)
            const diasDesdeAcesso = 
                (new Date().getTime() - entrada.ultimoAcesso.getTime()) / (1000 * 60 * 60 * 24);
            const pontuacao = entrada.acessos - (diasDesdeAcesso * 0.1);

            if (pontuacao < menorPontuacao) {
                menorPontuacao = pontuacao;
                chaveParaRemover = chave;
            }
        }

        if (chaveParaRemover) {
            this.cache.delete(chaveParaRemover);
            this.estatisticas.limpezas++;
        }
    }

    /**
     * Limpa todo o cache
     */
    limparTudo(): void {
        this.cache.clear();
        this.estatisticas = { acertos: 0, extravios: 0, limpezas: 0 };
    }

    /**
     * Retorna estatísticas de cache
     */
    obterEstatisticas() {
        const total = this.estatisticas.acertos + this.estatisticas.extravios;
        const taxaAcerto = total > 0 
            ? ((this.estatisticas.acertos / total) * 100).toFixed(2)
            : "0.00";

        return {
            tamanho: this.cache.size,
            limite: this.limite,
            acertos: this.estatisticas.acertos,
            extravios: this.estatisticas.extravios,
            limpezas: this.estatisticas.limpezas,
            taxaAcerto: `${taxaAcerto}%`,
            utilizacao: `${((this.cache.size / this.limite) * 100).toFixed(2)}%`
        };
    }
}
