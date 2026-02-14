import { DescritorTipoClasse, ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

import { Colecao } from "./colecao";
import { Entidade } from "./entidade";
import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { Taquigrafo } from "./taquigrafia";
import { RastreadorMudancas } from "./rastreador-mudancas";

/**
 * O contexto de entidades é usado para manter todas as entidades e seus relacionamentos
 * em um só lugar.
 */
export class ContextoEntidades {
    tecnologia: TecnologiaLinconesInterface;
    colecoes: {[key: string]: Colecao<EntidadeInterface>};
    logger?: Taquigrafo;
    rastreador: RastreadorMudancas;

    constructor(tecnologia: TecnologiaLinconesInterface, logger?: Taquigrafo) {
        this.tecnologia = tecnologia;
        this.colecoes = {};
        this.logger = logger;
        this.rastreador = new RastreadorMudancas();
    }

    registrarColecao(entidade: EntidadeInterface): Colecao<EntidadeInterface> {
        const nome = entidade.obterNome();
        const colecao = new Colecao(entidade, this.tecnologia, this.logger);
        this.colecoes[nome] = colecao;
        return colecao;
    }

    colecao(tipoModelo: DescritorTipoClasse): Colecao<EntidadeInterface> {
        const nome = tipoModelo.simboloOriginal.lexema;
        if (!this.colecoes[nome]) {
            const entidade = new Entidade(tipoModelo);
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
                    break;
                case 'modificado':
                    await col.modificar(rastreado.registro, rastreado.camposAlterados);
                    break;
                case 'excluido':
                    await col.remover(rastreado.registro);
                    break;
            }
        }

        this.rastreador.limpar();
    }

    async iniciar(caminho: string): Promise<void> {
        await this.tecnologia.iniciar(caminho);
        for (const nome in this.colecoes) {
            const criar = this.colecoes[nome].tipoEntidade.gerarComandoCriarTabela();
            await this.tecnologia.executarComando(criar);
        }
    }
}
