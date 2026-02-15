import { Selecionar, Condicao, ReferenciaColuna, Literal, Inserir, Atualizar, Excluir, TecnologiaLinconesInterface, ColunaEValor } from "@designliquido/lincones-js";
import { RetornoComandoInterface } from "@designliquido/lincones-js/interfaces/retorno-comando-interface";
import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { EventoGancho, FuncaoGancho, GanchosInterface } from "./interfaces-tipos/ganchos";
import { ConstrutorConsulta } from "./construtor-consulta";
import { Validador } from "./validacoes/validador";
import { ErroDeValidacao } from "./erros/erro-validacao";
import { Taquigrafo } from "./taquigrafia";
import { Serializador, OpcoesSerializacao } from "./serializador";

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
            this.adicionarGancho('antesDeInserir', (registro: ObjetoDeleguaClasse) => {
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
            this.adicionarGancho('antesDeAtualizar', (registro: ObjetoDeleguaClasse) => {
                registro.propriedades['atualizado_em'] = new Date().toISOString();
            });
        }
    }

    adicionarGancho(evento: EventoGancho, funcao: FuncaoGancho): void {
        this.ganchos[evento].push(funcao);
    }

    private async executarGanchos(evento: EventoGancho, registro: ObjetoDeleguaClasse): Promise<void> {
        for (const gancho of this.ganchos[evento]) {
            await gancho(registro);
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

        const colunasEValores: ColunaEValor[] = this.tipoEntidade.resolverColunasEValores(registro, colunasAtualizacao);
        const condicao = this.tipoEntidade.resolverCondicaoPorChavePrimaria(registro);
        return new Atualizar(-1, this.tipoEntidade.obterNome(), colunasEValores, [condicao]);
    }

    excluir(registro: ObjetoDeleguaClasse): Excluir | Atualizar {
        const condicao = this.tipoEntidade.resolverCondicaoPorChavePrimaria(registro);
        
        // Se a entidade possui exclusão lógica, atualizar o campo de exclusão em vez de deletar
        if (this.tipoEntidade.possuiExclusaoLogica()) {
            const colunaExclusao = this.tipoEntidade.obterNomeColunaExclusaoLogica();
            const dataExclusao = new Date().toISOString();
            registro.propriedades[colunaExclusao] = dataExclusao;
            
            const colunasEValores: ColunaEValor[] = [
                new ColunaEValor(
                    new ReferenciaColuna(colunaExclusao),
                    new Literal(dataExclusao)
                )
            ];
            
            return new Atualizar(-1, this.tipoEntidade.obterNome(), colunasEValores, [condicao]);
        }
        
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

    private async executarComandoComRegistroOperacao(comando: any, operacao: string): Promise<RetornoComandoInterface[]> {
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
        const resultados = await this.executarComandoComRegistroOperacao(comando, 'SELECT *');
        if (resultados.length === 0 || resultados[0].linhasRetornadas.length === 0) {
            return [];
        }
        return this.tipoEntidade.hidratarRegistros(resultados[0].linhasRetornadas);
    }

    async buscarPorId(valorId: any): Promise<ObjetoDeleguaClasse | null> {
        this.verificarTecnologia();
        const comando = this.obterPorId(valorId);
        const resultados = await this.executarComandoComRegistroOperacao(comando, 'SELECT WHERE id');
        if (resultados.length === 0 || resultados[0].linhasRetornadas.length === 0) {
            return null;
        }
        return this.tipoEntidade.hidratarRegistro(resultados[0].linhasRetornadas[0]);
    }

    async salvar(registro: ObjetoDeleguaClasse): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        this.validarRegistro(registro);
        await this.executarGanchos('antesDeInserir', registro);
        const comando = this.inserir(registro);
        const resultado = await this.executarComandoComRegistroOperacao(comando, 'INSERT');
        await this.executarGanchos('aposInserir', registro);
        return resultado;
    }

    async modificar(registro: ObjetoDeleguaClasse, colunas: string[] = []): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        this.validarRegistro(registro);
        await this.executarGanchos('antesDeAtualizar', registro);
        const comando = this.atualizar(registro, colunas);
        const resultado = await this.executarComandoComRegistroOperacao(comando, 'UPDATE');
        await this.executarGanchos('aposAtualizar', registro);
        return resultado;
    }

    async remover(registro: ObjetoDeleguaClasse): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        await this.executarGanchos('antesDeExcluir', registro);
        const comando = this.excluir(registro);
        const resultado = await this.executarComandoComRegistroOperacao(comando, 'DELETE');
        await this.executarGanchos('aposExcluir', registro);
        return resultado;
    }

    /**
     * Insere múltiplos registros em uma operação.
     * Executa ganchos de inserção para cada registro.
     */
    async inserirVarios(registros: ObjetoDeleguaClasse[]): Promise<RetornoComandoInterface[][]> {
        this.verificarTecnologia();
        
        if (registros.length === 0) {
            return [];
        }

        const resultados: RetornoComandoInterface[][] = [];

        for (const registro of registros) {
            this.validarRegistro(registro);
            await this.executarGanchos('antesDeInserir', registro);
            const comando = this.inserir(registro);
            const resultado = await this.executarComandoComRegistroOperacao(comando, 'INSERT LOTE');
            resultados.push(resultado);
            await this.executarGanchos('aposInserir', registro);
        }

        return resultados;
    }

    /**
     * Atualiza múltiplos registros em uma operação.
     * Executa ganchos de atualização para cada registro.
     */
    async atualizarVarios(registros: ObjetoDeleguaClasse[], colunas: string[] = []): Promise<RetornoComandoInterface[][]> {
        this.verificarTecnologia();
        
        if (registros.length === 0) {
            return [];
        }

        const resultados: RetornoComandoInterface[][] = [];

        for (const registro of registros) {
            this.validarRegistro(registro);
            await this.executarGanchos('antesDeAtualizar', registro);
            const comando = this.atualizar(registro, colunas);
            const resultado = await this.executarComandoComRegistroOperacao(comando, 'UPDATE LOTE');
            resultados.push(resultado);
            await this.executarGanchos('aposAtualizar', registro);
        }

        return resultados;
    }

    /**
     * Exclui múltiplos registros em uma operação.
     * Executa ganchos de exclusão para cada registro.
     */
    async excluirVarios(registros: ObjetoDeleguaClasse[]): Promise<RetornoComandoInterface[][]> {
        this.verificarTecnologia();
        
        if (registros.length === 0) {
            return [];
        }

        const resultados: RetornoComandoInterface[][] = [];

        for (const registro of registros) {
            await this.executarGanchos('antesDeExcluir', registro);
            const comando = this.excluir(registro);
            const resultado = await this.executarComandoComRegistroOperacao(comando, 'DELETE LOTE');
            resultados.push(resultado);
            await this.executarGanchos('aposExcluir', registro);
        }

        return resultados;
    }

    /**
     * Restaura um registro excluído logicamente (_soft delete_).
     * Remove a marca de exclusão do registro.
     * Lança erro se a entidade não possui exclusão lógica habilitada.
     */
    async restaurar(registro: ObjetoDeleguaClasse): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();

        if (!this.tipoEntidade.possuiExclusaoLogica()) {
            throw new Error('Esta entidade não possui exclusão lógica habilitada');
        }

        const colunaExclusao = this.tipoEntidade.obterNomeColunaExclusaoLogica();
        const condicao = this.tipoEntidade.resolverCondicaoPorChavePrimaria(registro);

        // Limpar o campo de exclusão
        registro.propriedades[colunaExclusao] = null;

        const colunasEValores: ColunaEValor[] = [
            new ColunaEValor(
                new ReferenciaColuna(colunaExclusao),
                new Literal(null, 'TEXTO')
            )
        ];

        const comando = new Atualizar(-1, this.tipoEntidade.obterNome(), colunasEValores as ColunaEValor[], [condicao]);
        const resultado = await this.executarComandoComRegistroOperacao(comando, 'RESTAURAR');

        return resultado;
    }

    // --- Métodos de Serialização ---

    /**
     * Serializa um registro para dicionário (objeto JavaScript).
     */
    serializarParaDicionario(
        registro: ObjetoDeleguaClasse,
        opcoes?: OpcoesSerializacao
    ): Record<string, any> {
        return Serializador.paraDicionario(registro, this.tipoEntidade, opcoes);
    }

    /**
     * Serializa um registro para JSON.
     */
    serializarParaJson(
        registro: ObjetoDeleguaClasse,
        opcoes?: OpcoesSerializacao
    ): string {
        return Serializador.paraJson(registro, this.tipoEntidade, opcoes);
    }

    /**
     * Serializa múltiplos registros para array de dicionários.
     */
    serializarMuitosParaDicionario(
        registros: ObjetoDeleguaClasse[],
        opcoes?: OpcoesSerializacao
    ): Record<string, any>[] {
        return Serializador.muitosParaDicionario(registros, this.tipoEntidade, opcoes);
    }

    /**
     * Serializa múltiplos registros para JSON com array.
     */
    serializarMuitosParaJson(
        registros: ObjetoDeleguaClasse[],
        opcoes?: OpcoesSerializacao
    ): string {
        return Serializador.muitosParaJson(registros, this.tipoEntidade, opcoes);
    }
}
