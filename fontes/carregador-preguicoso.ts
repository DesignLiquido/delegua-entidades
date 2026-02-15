import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { RelacionamentoInterface } from "./interfaces-tipos/relacionamento-interface";

/**
 * Carregador preguiçoso (lazy loader) que usa Proxies para carregar 
 * relacionamentos sob demanda.
 */
export class CarregadorPreguicoso {
    private tecnologia: TecnologiaLinconesInterface;
    private entidadesCache: Map<string, any> = new Map();

    constructor(tecnologia: TecnologiaLinconesInterface) {
        this.tecnologia = tecnologia;
    }

    /**
     * Envolve um registro com proxies para carregamento preguiçoso de relacionamentos.
     * Quando uma propriedade relacionada é acessada, o proxy carrega os dados.
     */
    envolverComProxies(
        registro: ObjetoDeleguaClasse,
        entidade: EntidadeInterface,
        nomeTabela: string
    ): ObjetoDeleguaClasse {
        const relacionamentos = entidade.obterRelacionamentos();
        const self = this;

        return new Proxy(registro, {
            get(target: any, prop: string | symbol) {
                // Se for propriedade normal ou método, retornar normalmente
                if (typeof prop !== 'string' || !target.propriedades.hasOwnProperty(prop)) {
                    return Reflect.get(target, prop);
                }

                // Verificar se é um relacionamento
                const rel = relacionamentos.find(r => r.nomePropriedade === prop);
                if (!rel) {
                    return Reflect.get(target, prop);
                }

                // Se já foi carregado, retornar do cache
                const chaveCache = `${nomeTabela}:${target.propriedades.id}:${prop}`;
                if (self.entidadesCache.has(chaveCache)) {
                    return self.entidadesCache.get(chaveCache);
                }

                // Carregar sob demanda
                const valor = target.propriedades[prop as string];
                
                // Se já tem um valor, usar ele
                if (valor !== undefined && valor !== null) {
                    self.entidadesCache.set(chaveCache, valor);
                    return valor;
                }

                // Carregar dinamicamente (síncronamente não é possível com async)
                // Por enquanto, retornar undefined até que seja acessado de forma async
                return undefined;
            },

            set(target: any, prop: string | symbol, valor: any) {
                if (typeof prop === 'string') {
                    const chaveCache = `${nomeTabela}:${target.propriedades.id}:${prop}`;
                    self.entidadesCache.set(chaveCache, valor);
                    target.propriedades[prop] = valor;
                }
                return true;
            }
        });
    }

    /**
     * Carrega um relacionamento específico de forma assíncrona.
     * Retorna a promise do relacionamento carregado.
     */
    async carregarRelacionamento(
        registro: ObjetoDeleguaClasse,
        entidade: EntidadeInterface,
        nomeRelacionamento: string,
        colecoes: { [key: string]: any }
    ): Promise<any> {
        const relacionamentos = entidade.obterRelacionamentos();
        const rel = relacionamentos.find(r => r.nomePropriedade === nomeRelacionamento);
        
        if (!rel) {
            throw new Error(`Relacionamento '${nomeRelacionamento}' não encontrado`);
        }

        const chaveCache = `${entidade.obterNome()}:${registro.propriedades[entidade.obterNomeChavePrimaria()]}:${nomeRelacionamento}`;
        
        // Se já foi carregado, retornar do cache
        if (this.entidadesCache.has(chaveCache)) {
            return this.entidadesCache.get(chaveCache);
        }

        // Obter a coleção da entidade relacionada
        const colecaoDestino = colecoes[rel.entidadeDestino];
        if (!colecaoDestino) {
            throw new Error(`Coleção '${rel.entidadeDestino}' não registrada`);
        }

        let resultado: any;

        if (rel.tipo === 'pertenceA' || rel.tipo === 'temUm') {
            // Um-para-um: carregar um único registro
            const valorChave = registro.propriedades[rel.colunaOrigem];
            resultado = await colecaoDestino.buscarPorId(valorChave);
        } else if (rel.tipo === 'temMuitos') {
            // Um-para-muitos: carregar múltiplos registros
            const valorChaveOrigem = registro.propriedades[rel.colunaOrigem];
            resultado = await colecaoDestino
                .consulta()
                .onde(rel.colunaDestino, 'IGUAL', valorChaveOrigem)
                .todos();
        }

        // Armazenar no cache
        this.entidadesCache.set(chaveCache, resultado);
        return resultado;
    }

    /**
     * Limpa o cache de entidades carregadas.
     */
    limparCache(): void {
        this.entidadesCache.clear();
    }
}
