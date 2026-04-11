import { EntradaCache, OpcoesCacheL2 } from "./interfaces-tipos/cache";

/**
 * Gerenciador de cache com suporte a cache de primeira nível (identity map)
 * e segunda nível (L2) opcional.
 * 
 * Primera nivel (Identity Map): Garante que apenas uma instância de cada
 * objeto existe na memória durante uma operação.
 * 
 * Segunda nivel (L2): Cache persistente entre operações, com TTL e limite de tamanho.
 */
export class GerenciadorCache {
    /** Cache de primeira nível: entidade -> id -> objeto */
    private cacheNivel1: Map<string, Map<any, any>> = new Map();

    /** Cache de segunda nível: chave composta -> valor com timestamp */
    private cacheNivel2: Map<string, EntradaCache> = new Map();

    /** Opções de cache L2 */
    private opcoes: OpcoesCacheL2;

    /**
     * Cria uma nova instância do gerenciador de cache.
     * @param opcoes Opções de configuração do cache L2 (opcionais)
     */
    constructor(opcoes?: OpcoesCacheL2) {
        this.opcoes = opcoes || { ttl: 60000, tamanhMaximo: 1000 };
    }

    /**
     * Obtém um objeto do cache de primeira nível (identity map).
     * @param nomeEntidade Nome da entidade
     * @param id Identificador do objeto
     * @returns Objeto em cache ou undefined
     */
    obterNivel1(nomeEntidade: string, id: any): any | undefined {
        const map = this.cacheNivel1.get(nomeEntidade);
        if (!map) return undefined;
        return map.get(id);
    }

    /**
     * Armazena um objeto no cache de primeira nível (identity map).
     * @param nomeEntidade Nome da entidade
     * @param id Identificador do objeto
     * @param valor Objeto a armazenar
     */
    armazenarNivel1(nomeEntidade: string, id: any, valor: any): void {
        if (!this.cacheNivel1.has(nomeEntidade)) {
            this.cacheNivel1.set(nomeEntidade, new Map());
        }
        this.cacheNivel1.get(nomeEntidade)!.set(id, valor);

        // Também armazena no cache L2
        this.armazenarNivel2(nomeEntidade, id, valor);
    }

    /**
     * Obtém um objeto do cache de segunda nível.
     * @param nomeEntidade Nome da entidade
     * @param id Identificador do objeto
     * @returns Objeto em cache ou undefined (se expirou)
     */
    obterNivel2(nomeEntidade: string, id: any): any | undefined {
        const chave = this._gerarChave(nomeEntidade, id);
        const entrada = this.cacheNivel2.get(chave);

        if (!entrada) return undefined;

        // Verifica se expirou (TTL)
        if (this.opcoes.ttl && Date.now() - entrada.timestamp > this.opcoes.ttl) {
            this.cacheNivel2.delete(chave);
            return undefined;
        }

        return entrada.valor;
    }

    /**
     * Armazena um objeto no cache de segunda nível.
     * @param nomeEntidade Nome da entidade
     * @param id Identificador do objeto
     * @param valor Objeto a armazenar
     */
    armazenarNivel2(nomeEntidade: string, id: any, valor: any): void {
        if (!this.opcoes.tamanhMaximo || this.cacheNivel2.size < this.opcoes.tamanhMaximo) {
            const chave = this._gerarChave(nomeEntidade, id);
            this.cacheNivel2.set(chave, {
                valor,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Remove um objeto do cache (ambos os níveis).
     * @param nomeEntidade Nome da entidade
     * @param id Identificador do objeto
     */
    remover(nomeEntidade: string, id: any): void {
        // Remove do cache L1
        const map = this.cacheNivel1.get(nomeEntidade);
        if (map) {
            map.delete(id);
            if (map.size === 0) {
                this.cacheNivel1.delete(nomeEntidade);
            }
        }

        // Remove do cache L2
        const chave = this._gerarChave(nomeEntidade, id);
        this.cacheNivel2.delete(chave);
    }

    /**
     * Limpa todo o cache de uma entidade.
     * @param nomeEntidade Nome da entidade (opcional, limpa tudo se não fornecido)
     */
    limparEntidade(nomeEntidade?: string): void {
        if (!nomeEntidade) {
            this.cacheNivel1.clear();
            this.cacheNivel2.clear();
            return;
        }

        // Remove do cache L1
        this.cacheNivel1.delete(nomeEntidade);

        // Remove do cache L2
        const chaves = Array.from(this.cacheNivel2.keys()).filter(chave =>
            chave.startsWith(`${nomeEntidade}:`)
        );
        chaves.forEach(chave => this.cacheNivel2.delete(chave));
    }

    /**
     * Limpa todo o cache.
     */
    limparTudo(): void {
        this.cacheNivel1.clear();
        this.cacheNivel2.clear();
    }

    /**
     * Retorna estatísticas do cache.
     */
    obterEstatisticas(): {
        nivel1: number;
        nivel2: number;
        total: number;
    } {
        let totalNivel1 = 0;
        this.cacheNivel1.forEach(map => {
            totalNivel1 += map.size;
        });

        return {
            nivel1: totalNivel1,
            nivel2: this.cacheNivel2.size,
            total: totalNivel1 + this.cacheNivel2.size
        };
    }

    /**
     * Gera chave composta para o cache L2.
     */
    private _gerarChave(nomeEntidade: string, id: any): string {
        return `${nomeEntidade}:${String(id)}`;
    }
}
