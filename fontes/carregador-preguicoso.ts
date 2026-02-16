import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

import { CarregadorLote, GerenciadorCarregadoresLote } from "./carregador-lotes";
import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { RelacionamentoInterface } from "./interfaces-tipos/relacionamento-interface";

/**
 * Carregador preguiçoso (lazy loader) que usa Proxies para carregar 
 * relacionamentos sob demanda.
 */
export class CarregadorPreguicoso {
    private tecnologia: TecnologiaLinconesInterface;
    private entidadesCache: Map<string, any> = new Map();
    private gerenciadorCarregadoresLote: GerenciadorCarregadoresLote = new GerenciadorCarregadoresLote();

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
        const valorChave = registro.propriedades[rel.colunaOrigem];

        if (rel.tipo === 'pertenceA' || rel.tipo === 'temUm' || rel.tipo === 'temMuitos') {
            const carregador = this.obterCarregadorLote(rel, colecaoDestino);
            resultado = await carregador.carregar(valorChave);
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
        this.gerenciadorCarregadoresLote.limparTodos();
    }

    private obterCarregadorLote(
        rel: RelacionamentoInterface,
        colecaoDestino: any
    ): CarregadorLote<any> {
        const chaveCarregador = `${rel.entidadeDestino}:${rel.nomePropriedade}`;
        const existente = this.gerenciadorCarregadoresLote.obterCarregador(chaveCarregador);
        if (existente) {
            return existente;
        }

        const carregador = this.gerenciadorCarregadoresLote.criarCarregador(
            chaveCarregador,
            async (ids: any[]) => this.carregarEmLote(rel, colecaoDestino, ids)
        );

        return carregador;
    }

    private async carregarEmLote(
        rel: RelacionamentoInterface,
        colecaoDestino: any,
        ids: any[]
    ): Promise<Map<any, any>> {
        const valoresUnicos = Array.from(
            new Set(ids.filter((valor) => valor !== undefined && valor !== null))
        );

        if (valoresUnicos.length === 0) {
            return new Map();
        }

        const valoresSql = valoresUnicos.map((valor) => this.formatarValorSql(valor)).join(', ');
        const sql = `SELECT * FROM ${rel.entidadeDestino} WHERE ${rel.colunaDestino} IN (${valoresSql})`;

        const resultados = await this.tecnologia.executar(null, sql, []);
        const linhas = resultados[0]?.linhasRetornadas || [];
        const hidratados = colecaoDestino?.tipoEntidade?.hidratarRegistros
            ? colecaoDestino.tipoEntidade.hidratarRegistros(linhas)
            : linhas;

        const agrupados = new Map<any, any[]>();
        for (const valor of valoresUnicos) {
            agrupados.set(valor, []);
        }

        for (const item of hidratados) {
            const chave = this.obterValorColuna(item, rel.colunaDestino);
            if (!agrupados.has(chave)) {
                agrupados.set(chave, []);
            }
            agrupados.get(chave)!.push(item);
        }

        const resultado = new Map<any, any>();
        for (const valor of valoresUnicos) {
            const itens = agrupados.get(valor) || [];
            if (rel.tipo === 'temMuitos') {
                resultado.set(valor, itens);
            } else {
                resultado.set(valor, itens.length > 0 ? itens[0] : null);
            }
        }

        return resultado;
    }

    private formatarValorSql(valor: any): string {
        if (typeof valor === 'string') {
            return `'${valor}'`;
        }

        if (typeof valor === 'boolean') {
            return valor ? '1' : '0';
        }

        return String(valor);
    }

    private obterValorColuna(item: any, coluna: string): any {
        if (item?.propriedades && coluna in item.propriedades) {
            return item.propriedades[coluna];
        }

        return item?.[coluna];
    }
}
