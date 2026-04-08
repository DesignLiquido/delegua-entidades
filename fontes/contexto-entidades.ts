import { DescritorTipoClasse, ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

import { Colecao } from "./colecao";
import { Entidade } from "./entidade";
import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { Taquigrafo } from "./taquigrafia";
import { RastreadorMudancas } from "./rastreador-mudancas";
import { Transacao } from "./transacao";
import { TransacaoInterface } from "./interfaces-tipos/transacao-interface";
import { RoteadorBancos } from "./roteador-bancos";
import { ConfiguracoesBancos } from "./interfaces-tipos/configuracao-banco-dados-interface";
import { GerenciadorCache, OpcoesCacheL2 } from "./gerenciador-cache";

/**
 * O contexto de entidades é usado para manter todas as entidades e seus relacionamentos
 * em um só lugar. Suporta múltiplos bancos de dados com roteamento automático.
 * Também gerencia cache L1 (identity map) e L2 (cache persistente).
 */
export class ContextoEntidades {
    tecnologia: TecnologiaLinconesInterface | undefined;
    colecoes: {[key: string]: Colecao<EntidadeInterface>};
    taquigrafo?: Taquigrafo;
    rastreador: RastreadorMudancas;
    private transacao: Transacao | null = null;
    private roteador: RoteadorBancos;
    private cache: GerenciadorCache;

    constructor(tecnologia?: TecnologiaLinconesInterface | unknown, taquigrafo?: Taquigrafo, opcoesCacheL2?: OpcoesCacheL2) {
        // ClassePadrao do Delégua passa argumentos como array; ignorar se não for tecnologia válida
        const tecnologiaValida = Array.isArray(tecnologia) || !tecnologia ? undefined : tecnologia as TecnologiaLinconesInterface;
        this.tecnologia = tecnologiaValida;
        this.colecoes = {};
        this.taquigrafo = taquigrafo;
        this.rastreador = new RastreadorMudancas();
        this.cache = new GerenciadorCache(opcoesCacheL2);

        // Inicializar roteador com o banco padrão, se tecnologia fornecida
        this.roteador = new RoteadorBancos();
        if (tecnologiaValida) {
            this.roteador.registrarBanco('padrão', tecnologiaValida, true);
        }
    }

    registrarColecao(entidade: EntidadeInterface): Colecao<EntidadeInterface> {
        const nome = entidade.obterNome();
        // Obter a tecnologia para o banco da entidade (pode ser undefined sem tecnologia)
        const tecnologiaEntidade = this.tecnologia ? this.roteador.obterTecnologiaParaEntidade(entidade) : undefined;
        const colecao = new Colecao(entidade, tecnologiaEntidade, this.taquigrafo);
        this.colecoes[nome] = colecao;
        return colecao;
    }

    colecao(tipoModelo: DescritorTipoClasse | unknown): Colecao<EntidadeInterface> {
        // Desencapsular argumento do caminho nativo do Delégua (envelopagem {nome, valor})
        let tipoDescritor: object = tipoModelo as object;
        while (
            tipoDescritor !== null &&
            tipoDescritor !== undefined &&
            typeof tipoDescritor === 'object' &&
            Object.prototype.hasOwnProperty.call(tipoDescritor, 'valor') &&
            !(tipoDescritor instanceof DescritorTipoClasse)
        ) {
            tipoDescritor = (tipoDescritor as {valor: object}).valor;
        }
        const descritor = tipoDescritor as DescritorTipoClasse;
        const nome = descritor.simboloOriginal?.lexema || '';
        if (!this.colecoes[nome]) {
            const entidade = new Entidade(descritor);
            this.registrarColecao(entidade);
        }

        return this.colecoes[nome];
    }

    novo(nomeEntidade: string, registro: ObjetoDeleguaClasse): void {
        this.rastreador.rastrear(registro, nomeEntidade, 'novo');
    }

    excluirRegistro(nomeEntidade: string, registro: ObjetoDeleguaClasse): void {
        const estado = this.rastreador.obterEstado(registro);
        if (estado === null) {
            this.rastreador.rastrear(registro, nomeEntidade, 'excluido');
        } else {
            this.rastreador.marcarExcluido(registro);
        }
    }

    async buscarTodos(nomeEntidade: string): Promise<ObjetoDeleguaClasse[]> {
        const col = this.colecoes[nomeEntidade];
        if (!col) {
            throw new Error(`Coleção '${nomeEntidade}' não registrada.`);
        }
        const registros = await col.buscarTodos();
        for (const registro of registros) {
            this.rastreador.rastrear(registro, nomeEntidade, 'inalterado');
        }
        return registros;
    }

    async buscarPorId(nomeEntidade: string, valorId: any): Promise<ObjetoDeleguaClasse | null> {
        const col = this.colecoes[nomeEntidade];
        if (!col) {
            throw new Error(`Coleção '${nomeEntidade}' não registrada.`);
        }
        const registro = await col.buscarPorId(valorId);
        if (registro) {
            this.rastreador.rastrear(registro, nomeEntidade, 'inalterado');
        }
        return registro;
    }

    async salvarMudancas(): Promise<void> {
        this.rastreador.detectarMudancas();
        const alterados = this.rastreador.obterAlterados();

        for (const rastreado of alterados) {
            const col = this.colecoes[rastreado.nomeEntidade];
            if (!col) {
                throw new Error(`Coleção '${rastreado.nomeEntidade}' não registrada.`);
            }

            switch (rastreado.estado) {
                case 'novo':
                    await col.salvar(rastreado.registro);
                    // Processar cascata de inserção
                    await this.processarCascataInserir(rastreado.nomeEntidade, rastreado.registro);
                    break;
                case 'modificado':
                    await col.modificar(rastreado.registro, rastreado.camposAlterados);
                    // Processar cascata de atualização
                    await this.processarCascataAtualizar(rastreado.nomeEntidade, rastreado.registro);
                    break;
                case 'excluido':
                    // Processar cascata de exclusão antes de remover
                    await this.processarCascataExcluir(rastreado.nomeEntidade, rastreado.registro);
                    await col.remover(rastreado.registro);
                    break;
            }
        }

        this.rastreador.limpar();
    }

    /**
     * Processa cascata de inserção para relacionamentos.
     */
    private async processarCascataInserir(nomeEntidade: string, registro: ObjetoDeleguaClasse): Promise<void> {
        const colecao = this.colecoes[nomeEntidade];
        if (!colecao) return;

        const relacionamentos = colecao.tipoEntidade.obterRelacionamentos();
        
        for (const relacionamento of relacionamentos) {
            if (!relacionamento.cascata || !relacionamento.cascata.includes('inserir')) continue;
            
            const filhos = registro.propriedades[relacionamento.nomePropriedade];
            if (!filhos) continue;

            const colFilha = this.colecoes[relacionamento.entidadeDestino || ''];
            if (!colFilha) continue;

            const listaFilhos = Array.isArray(filhos) ? filhos : [filhos];
            
            for (const filho of listaFilhos) {
                if (filho && typeof filho === 'object') {
                    // Definir a chave estrangeira no filho
                    if (filho.propriedades) {
                        // É um ObjetoDeleguaClasse
                        filho.propriedades[relacionamento.colunaDestino || ''] = registro.propriedades[relacionamento.colunaOrigem || ''];
                    } else {
                        // É um objeto plain
                        filho[relacionamento.colunaDestino || ''] = registro.propriedades[relacionamento.colunaOrigem || ''];
                    }
                    
                    // Salvar o filho
                    await colFilha.salvar(filho);
                }
            }
        }
    }

    /**
     * Processa cascata de atualização para relacionamentos.
     */
    private async processarCascataAtualizar(nomeEntidade: string, registro: ObjetoDeleguaClasse): Promise<void> {
        const colecao = this.colecoes[nomeEntidade];
        if (!colecao) return;

        const relacionamentos = colecao.tipoEntidade.obterRelacionamentos();
        
        for (const relacionamento of relacionamentos) {
            if (!relacionamento.cascata || !relacionamento.cascata.includes('atualizar')) continue;
            
            const filhos = registro.propriedades[relacionamento.nomePropriedade];
            if (!filhos) continue;

            const colFilha = this.colecoes[relacionamento.entidadeDestino || ''];
            if (!colFilha) continue;

            const listaFilhos = Array.isArray(filhos) ? filhos : [filhos];
            
            for (const filho of listaFilhos) {
                if (filho && typeof filho === 'object') {
                    const filhoId = filho.propriedades ? filho.propriedades.id : filho.id;
                    if (filhoId) {
                        // Atualizar o filho
                        await colFilha.modificar(filho);
                    }
                }
            }
        }
    }

    /**
     * Processa cascata de exclusão para relacionamentos.
     */
    private async processarCascataExcluir(nomeEntidade: string, registro: ObjetoDeleguaClasse): Promise<void> {
        const colecao = this.colecoes[nomeEntidade];
        if (!colecao) return;

        const relacionamentos = colecao.tipoEntidade.obterRelacionamentos();
        
        for (const relacionamento of relacionamentos) {
            if (!relacionamento.cascata || !relacionamento.cascata.includes('excluir')) continue;

            const colecaoFilha = this.colecoes[relacionamento.entidadeDestino || ''];
            if (!colecaoFilha) continue;

            // Verificar se os filhos estão carregados
            const filhos = registro.propriedades[relacionamento.nomePropriedade];
            
            if (filhos) {
                // Filhos estão carregados, excluí-los diretamente
                const listaFilhos = Array.isArray(filhos) ? filhos : [filhos];
                
                for (const filho of listaFilhos) {
                    if (filho && typeof filho === 'object') {
                        await colecaoFilha.remover(filho);
                    }
                }
            } else {
                // Filhos não estão carregados, executar DELETE WHERE
                const valorId = registro.propriedades[relacionamento.colunaOrigem || ''];
                if (valorId !== undefined && valorId !== null) {
                    const sql = `DELETE FROM ${relacionamento.entidadeDestino} WHERE ${relacionamento.colunaDestino} = ${
                        typeof valorId === 'string' ? `'${valorId}'` : valorId
                    }`;
                    await this.tecnologia?.executar(null, sql, []);
                }
            }
        }
    }

    async iniciar(caminho: string): Promise<void> {
        if (!this.tecnologia) throw new Error("Tecnologia não configurada no contexto");
        await this.tecnologia.iniciar(caminho);
        for (const nome in this.colecoes) {
            const criar = this.colecoes[nome].tipoEntidade.gerarComandoCriarTabela();
            await this.tecnologia.executarComando(criar);
        }
    }

    /**
     * Inicia uma nova transação.
     * Retorna a transação criada.
     */
    iniciarTransacao(): TransacaoInterface {
        if (this.transacao && this.transacao.estaAtiva()) {
            throw new Error('Já existe uma transação ativa neste contexto');
        }
        
        this.transacao = new Transacao(this.tecnologia!);
        this.taquigrafo?.info('Transação iniciada');
        return this.transacao;
    }

    /**
     * Obtém a transação atual, se houver.
     */
    obterTransacao(): TransacaoInterface | null {
        return this.transacao;
    }

    /**
     * Indica se existe uma transação ativa.
     */
    possuiTransacao(): boolean {
        return this.transacao !== null && this.transacao.estaAtiva();
    }

    /**
     * Confirma a transação atual.
     */
    async confirmarTransacao(): Promise<void> {
        if (!this.transacao) {
            throw new Error('Nenhuma transação ativa');
        }

        await this.transacao.confirmar();
        this.taquigrafo?.info('Transação confirmada');
        this.transacao = null;
    }

    /**
     * Reverte a transação atual.
     */
    async reverterTransacao(): Promise<void> {
        if (!this.transacao) {
            throw new Error('Nenhuma transação ativa');
        }

        await this.transacao.reverter();
        this.taquigrafo?.info('Transação revertida');
        this.transacao = null;
    }

    /**
     * Registra um novo banco de dados.
     */
    registrarBanco(nome: string, tecnologia: TecnologiaLinconesInterface, ehPadrao: boolean = false): void {
        this.roteador.registrarBanco(nome, tecnologia, ehPadrao);
        if (ehPadrao) {
            this.tecnologia = tecnologia;
        }
    }

    /**
     * Registra múltiplos bancos a partir de configurações.
     */
    registrarBancos(configuracoes: ConfiguracoesBancos, tecnologias: { [nome: string]: TecnologiaLinconesInterface }): void {
        this.roteador.registrarBancos(configuracoes, tecnologias);
    }

    /**
     * Obtém a tecnologia para um banco específico.
     */
    obterTecnologia(nomeBanco: string = 'padrão'): TecnologiaLinconesInterface {
        return this.roteador.obterTecnologia(nomeBanco);
    }

    /**
     * Obtém a tecnologia padrão.
     */
    obterTecnologiaPadrao(): TecnologiaLinconesInterface {
        return this.roteador.obterTecnologiaPadrao();
    }

    /**
     * Obtém o roteador de bancos para acesso avançado.
     */
    obterRoteador(): RoteadorBancos {
        return this.roteador;
    }

    // --- Métodos de Cache ---

    /**
     * Obtém um registro do cache.
     */
    obterDoCache(nomeEntidade: string, id: any): ObjetoDeleguaClasse | undefined {
        return this.cache.obterNivel1(nomeEntidade, id);
    }

    /**
     * Armazena um registro no cache.
     */
    armazenarenCache(nomeEntidade: string, id: any, registro: ObjetoDeleguaClasse): void {
        this.cache.armazenarNivel1(nomeEntidade, id, registro);
    }

    /**
     * Remove um registro do cache.
     */
    removerDoCache(nomeEntidade: string, id: any): void {
        this.cache.remover(nomeEntidade, id);
    }

    /**
     * Limpa o cache de uma entidade.
     */
    limparCacheEntidade(nomeEntidade?: string): void {
        this.cache.limparEntidade(nomeEntidade);
    }

    /**
     * Limpa todo o cache.
     */
    limparCacheTudo(): void {
        this.cache.limparTudo();
    }

    /**
     * Obtém estatísticas do cache.
     */
    obterEstatisticasCache(): { nivel1: number; nivel2: number; total: number } {
        return this.cache.obterEstatisticas();
    }
}
