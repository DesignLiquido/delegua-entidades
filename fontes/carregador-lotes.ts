/**
 * Carregador em Lote (DataLoader)
 * 
 * Agrupa múltiplas requisições de relacionamentos em poucas queries,
 * evitando o problema N+1 através de batching inteligente.
 */

interface ConfiguracaoLote {
    tamanhoLote: number;
    intervaloMs: number;
    cache: boolean;
}

interface RequisicaoLote<T> {
    chave: any;
    resolver: (valor: T) => void;
    rejeitar: (erro: Error) => void;
}

export class CarregadorLote<T> {
    private fila: RequisicaoLote<T>[] = [];
    private tempoMaximo: NodeJS.Timeout | null = null;
    private cache: Map<string, T> = new Map();
    private configuracao: ConfiguracaoLote;

    constructor(
        private funcaoCarregamento: (chaves: any[]) => Promise<Map<any, T>>,
        config?: Partial<ConfiguracaoLote>
    ) {
        this.configuracao = {
            tamanhoLote: config?.tamanhoLote ?? 100,
            intervaloMs: config?.intervaloMs ?? 16,
            cache: config?.cache ?? true
        };
    }

    /**
     * Solicita carregamento de um item
     */
    carregar(chave: any): Promise<T> {
        return new Promise((resolver, rejeitar) => {
            // Verifica cache primeiro
            if (this.configuracao.cache) {
                const chaveStr = String(chave);
                const emCache = this.cache.get(chaveStr);
                if (emCache) {
                    return resolver(emCache);
                }
            }

            // Adiciona à fila
            this.fila.push({ chave, resolver, rejeitar });

            // Processa se atingiu tamanho do lote
            if (this.fila.length >= this.configuracao.tamanhoLote) {
                this.processar();
            } else if (!this.tempoMaximo) {
                // Agenda processamento após delay
                this.tempoMaximo = setTimeout(() => this.processar(), this.configuracao.intervaloMs);
            }
        });
    }

    /**
     * Processa lote de carregamentos
     */
    private async processar(): Promise<void> {
        const loteAtual = this.fila.splice(0, this.configuracao.tamanhoLote);
        
        if (this.tempoMaximo) {
            clearTimeout(this.tempoMaximo);
            this.tempoMaximo = null;
        }

        if (loteAtual.length === 0) return;

        try {
            const chaves = loteAtual.map(r => r.chave);
            const resultados = await this.funcaoCarregamento(chaves);

            // Distribui resultados
            for (const requisicao of loteAtual) {
                const resultado = resultados.get(requisicao.chave);
                
                if (resultado !== undefined) {
                    // Armazena em cache
                    if (this.configuracao.cache) {
                        this.cache.set(String(requisicao.chave), resultado);
                    }
                    requisicao.resolver(resultado);
                } else {
                    requisicao.rejeitar(
                        new Error(`Nenhum resultado para chave: ${requisicao.chave}`)
                    );
                }
            }
        } catch (erro) {
            // Rejeita todos em caso de erro
            for (const requisicao of loteAtual) {
                requisicao.rejeitar(erro as Error);
            }
        }

        // Processa próximo lote se houver
        if (this.fila.length > 0) {
            this.processar();
        }
    }

    /**
     * Limpa cache
     */
    limparCache(): void {
        this.cache.clear();
    }

    /**
     * Retorna estatísticas
     */
    obterEstatisticas() {
        return {
            filaAtual: this.fila.length,
            tamanhoCache: this.cache.size,
            tamanhoLote: this.configuracao.tamanhoLote,
            intervaloMs: this.configuracao.intervaloMs
        };
    }
}

/**
 * Gerenciador de Carregadores em Lote para Relacionamentos
 */
export class GerenciadorCarregadoresLote {
    private carregadores: Map<string, CarregadorLote<any>> = new Map();

    /**
     * Cria carregador para um relacionamento específico
     */
    criarCarregador<T>(
        chave: string,
        funcaoCarregamento: (ids: any[]) => Promise<Map<any, T>>,
        config?: Partial<ConfiguracaoLote>
    ): CarregadorLote<T> {
        const carregador = new CarregadorLote(funcaoCarregamento, config);
        this.carregadores.set(chave, carregador);
        return carregador;
    }

    /**
     * Obtém carregador existente
     */
    obterCarregador<T>(chave: string): CarregadorLote<T> | null {
        return this.carregadores.get(chave) || null;
    }

    /**
     * Limpa todos os carregadores
     */
    limparTodos(): void {
        for (const carregador of this.carregadores.values()) {
            carregador.limparCache();
        }
        this.carregadores.clear();
    }

    /**
     * Obtém status de todos os carregadores
     */
    obterStatus() {
        const status: Record<string, any> = {};
        
        for (const [chave, carregador] of this.carregadores.entries()) {
            status[chave] = carregador.obterEstatisticas();
        }

        return status;
    }
}
