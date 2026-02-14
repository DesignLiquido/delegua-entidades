import { Selecionar, Condicao, ReferenciaColuna, Literal, Inserir, Atualizar, Excluir, TecnologiaLinconesInterface } from "@designliquido/lincones-js";
import { RetornoComandoInterface } from "@designliquido/lincones-js/interfaces/retorno-comando-interface";
import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EntidadeInterface } from "./interfaces/entidade-interface";

export class Colecao<TEntidade extends EntidadeInterface> {
    tipoEntidade: TEntidade;
    tecnologia: TecnologiaLinconesInterface;

    constructor(tipoEntidade: TEntidade, tecnologia?: TecnologiaLinconesInterface) {
        this.tipoEntidade = tipoEntidade;
        this.tecnologia = tecnologia;
    }

    todos(): Selecionar {
        return new Selecionar(
            -1, 
            this.tipoEntidade.obterNome(), 
            this.tipoEntidade.obterNomesColunas(), 
            [], 
            true
        );
    }

    obterPorId(valorId: any): Selecionar {
        const colunaChavePrimaria = this.tipoEntidade.obterNomeChavePrimaria();
        return new Selecionar(
            -1, 
            this.tipoEntidade.obterNome(), 
            this.tipoEntidade.obterNomesColunas(),
            [new Condicao(
                new ReferenciaColuna(colunaChavePrimaria),
                'IGUAL',
                new Literal(valorId, "INTEIRO")
            )], 
            false
        );
    }

    inserir(registro: ObjetoDeleguaClasse): Inserir {
        const nomesColunas = this.tipoEntidade.obterNomesColunas();
        const valoresColunas = this.tipoEntidade.resolverValoresParaColunas(registro, nomesColunas);
        return new Inserir(-1, this.tipoEntidade.obterNome(), nomesColunas, valoresColunas);
    }

    atualizar(registro: ObjetoDeleguaClasse, colunas: string[] = []): Atualizar {
        let colunasAtualizacao = colunas;
        if (colunasAtualizacao.length === 0) {
            colunasAtualizacao = this.tipoEntidade.obterNomesColunas();
        }

        const colunasEValores = this.tipoEntidade.resolverColunasEValores(registro, colunasAtualizacao);
        const condicao = this.tipoEntidade.resolverCondicaoPorChavePrimaria(registro);
        return new Atualizar(-1, this.tipoEntidade.obterNome(), colunasEValores, [condicao]);
    }

    excluir(registro: ObjetoDeleguaClasse): Excluir {
        const condicao = this.tipoEntidade.resolverCondicaoPorChavePrimaria(registro);
        return new Excluir(-1, this.tipoEntidade.obterNome(), [condicao]);
    }

    // --- Métodos de execução (requerem tecnologia configurada) ---

    private verificarTecnologia(): void {
        if (!this.tecnologia) {
            throw new Error(
                "Nenhuma tecnologia de banco de dados configurada. " +
                "Use ContextoEntidades para gerenciar coleções com uma tecnologia."
            );
        }
    }

    async buscarTodos(): Promise<ObjetoDeleguaClasse[]> {
        this.verificarTecnologia();
        const comando = this.todos();
        const resultados = await this.tecnologia.executarComando(comando);
        if (resultados.length === 0 || resultados[0].linhasRetornadas.length === 0) {
            return [];
        }
        return this.tipoEntidade.hidratarRegistros(resultados[0].linhasRetornadas);
    }

    async buscarPorId(valorId: any): Promise<ObjetoDeleguaClasse | null> {
        this.verificarTecnologia();
        const comando = this.obterPorId(valorId);
        const resultados = await this.tecnologia.executarComando(comando);
        if (resultados.length === 0 || resultados[0].linhasRetornadas.length === 0) {
            return null;
        }
        return this.tipoEntidade.hidratarRegistro(resultados[0].linhasRetornadas[0]);
    }

    async salvar(registro: ObjetoDeleguaClasse): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        const comando = this.inserir(registro);
        return this.tecnologia.executarComando(comando);
    }

    async modificar(registro: ObjetoDeleguaClasse, colunas: string[] = []): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        const comando = this.atualizar(registro, colunas);
        return this.tecnologia.executarComando(comando);
    }

    async remover(registro: ObjetoDeleguaClasse): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        const comando = this.excluir(registro);
        return this.tecnologia.executarComando(comando);
    }
}