import { Selecionar, Condicao, ReferenciaColuna, Literal, Inserir, Atualizar, Excluir, TecnologiaLinconesInterface } from "@designliquido/lincones-js";
import { RetornoComandoInterface } from "@designliquido/lincones-js/interfaces/retorno-comando-interface";
import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { EventoGancho, FuncaoGancho, GanchosInterface } from "./interfaces-tipos/ganchos";
import { ConstrutorConsulta } from "./construtor-consulta";
import { Validador } from "./validacoes/validador";
import { ErroDeValidacao } from "./erros/erro-validacao";
import { Taquigrafo } from "./taquigrafia";

export class Colecao<TEntidade extends EntidadeInterface> {
    tipoEntidade: TEntidade;
    tecnologia: TecnologiaLinconesInterface;
    ganchos: GanchosInterface;
    taquigrafo?: Taquigrafo;

    constructor(tipoEntidade: TEntidade, tecnologia?: TecnologiaLinconesInterface, taquigrafo?: Taquigrafo) {
        this.tipoEntidade = tipoEntidade;
        this.tecnologia = tecnologia;
        this.taquigrafo = taquigrafo;
        this.ganchos = {
            antesDeInserir: [],
            aposInserir: [],
            antesDeAtualizar: [],
            aposAtualizar: [],
            antesDeExcluir: [],
            aposExcluir: []
        };

        this.registrarGanchosCarimboTempo();
    }

    private registrarGanchosCarimboTempo(): void {
        const possuiCriadoEm = this.tipoEntidade.possuiCriadoEm();
        const possuiAtualizadoEm = this.tipoEntidade.possuiAtualizadoEm();

        if (possuiCriadoEm || possuiAtualizadoEm) {
            this.adicionarHook('antesDeInserir', (registro: ObjetoDeleguaClasse) => {
                const agora = new Date().toISOString();
                if (possuiCriadoEm) {
                    registro.propriedades['criado_em'] = agora;
                }
                if (possuiAtualizadoEm) {
                    registro.propriedades['atualizado_em'] = agora;
                }
            });
        }

        if (possuiAtualizadoEm) {
            this.adicionarHook('antesDeAtualizar', (registro: ObjetoDeleguaClasse) => {
                registro.propriedades['atualizado_em'] = new Date().toISOString();
            });
        }
    }

    adicionarHook(evento: EventoGancho, funcao: FuncaoGancho): void {
        this.ganchos[evento].push(funcao);
    }

    private async executarHooks(evento: EventoGancho, registro: ObjetoDeleguaClasse): Promise<void> {
        for (const hook of this.ganchos[evento]) {
            await hook(registro);
        }
    }

    consulta(): ConstrutorConsulta {
        this.verificarTecnologia();
        return new ConstrutorConsulta(this.tipoEntidade, this.tecnologia);
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

    private validarRegistro(registro: ObjetoDeleguaClasse): void {
        const erros = Validador.validar(this.tipoEntidade, registro);
        if (erros.length > 0) {
            throw new ErroDeValidacao(erros);
        }
    }

    private async executarComandoComLog(comando: any, operacao: string): Promise<RetornoComandoInterface[]> {
        const tabela = this.tipoEntidade.obterNome();
        this.taquigrafo?.depuracao(`${operacao} em ${tabela}`, { comando: comando.constructor.name });
        const inicio = Date.now();
        try {
            const resultado = await this.tecnologia.executarComando(comando);
            const duracao = Date.now() - inicio;
            this.taquigrafo?.info(`${operacao} em ${tabela} concluído em ${duracao}ms`);
            return resultado;
        } catch (erro) {
            const duracao = Date.now() - inicio;
            this.taquigrafo?.erro(`${operacao} em ${tabela} falhou após ${duracao}ms`, erro);
            throw erro;
        }
    }

    async buscarTodos(): Promise<ObjetoDeleguaClasse[]> {
        this.verificarTecnologia();
        const comando = this.todos();
        const resultados = await this.executarComandoComLog(comando, 'SELECT *');
        if (resultados.length === 0 || resultados[0].linhasRetornadas.length === 0) {
            return [];
        }
        return this.tipoEntidade.hidratarRegistros(resultados[0].linhasRetornadas);
    }

    async buscarPorId(valorId: any): Promise<ObjetoDeleguaClasse | null> {
        this.verificarTecnologia();
        const comando = this.obterPorId(valorId);
        const resultados = await this.executarComandoComLog(comando, 'SELECT WHERE id');
        if (resultados.length === 0 || resultados[0].linhasRetornadas.length === 0) {
            return null;
        }
        return this.tipoEntidade.hidratarRegistro(resultados[0].linhasRetornadas[0]);
    }

    async salvar(registro: ObjetoDeleguaClasse): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        this.validarRegistro(registro);
        await this.executarHooks('antesDeInserir', registro);
        const comando = this.inserir(registro);
        const resultado = await this.executarComandoComLog(comando, 'INSERT');
        await this.executarHooks('aposInserir', registro);
        return resultado;
    }

    async modificar(registro: ObjetoDeleguaClasse, colunas: string[] = []): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        this.validarRegistro(registro);
        await this.executarHooks('antesDeAtualizar', registro);
        const comando = this.atualizar(registro, colunas);
        const resultado = await this.executarComandoComLog(comando, 'UPDATE');
        await this.executarHooks('aposAtualizar', registro);
        return resultado;
    }

    async remover(registro: ObjetoDeleguaClasse): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        await this.executarHooks('antesDeExcluir', registro);
        const comando = this.excluir(registro);
        const resultado = await this.executarComandoComLog(comando, 'DELETE');
        await this.executarHooks('aposExcluir', registro);
        return resultado;
    }
}
