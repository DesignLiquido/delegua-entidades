import { Selecionar, Condicao, ReferenciaColuna, Literal, Inserir, Atualizar, Excluir, TecnologiaLinconesInterface, ColunaEValor } from "@designliquido/lincones-js";
import { RetornoComandoInterface } from "@designliquido/lincones-js/interfaces/retorno-comando-interface";
import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { EventoGancho, FuncaoGancho, GanchosInterface } from "./interfaces-tipos/ganchos";
import { ConstrutorConsulta } from "./construtor-consulta";
import { Validador } from "./validacoes/validador";
import { ErroDeValidacao } from "./erros/erro-validacao";
import { ErroConcorrencia } from "./erros/erro-concorrencia";
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

        const nomePropriedadeVersao = this.tipoEntidade.obterNomePropriedadeVersao?.() || "";
        
        // Se a entidade possui campo de versão, preparar versão
        let versaoAtual: any = null;
        let novaVersao: any = null;
        
        if (nomePropriedadeVersao) {
            versaoAtual = registro.propriedades ? registro.propriedades[nomePropriedadeVersao] : (registro as any)[nomePropriedadeVersao];
            novaVersao = typeof versaoAtual === 'number' ? versaoAtual + 1 : 1;
            
            // Atualizar versão no próprio registro
            if (registro.propriedades) {
                registro.propriedades[nomePropriedadeVersao] = novaVersao;
            } else {
                (registro as any)[nomePropriedadeVersao] = novaVersao;
            }
        }

        const colunasEValores: ColunaEValor[] = this.tipoEntidade.resolverColunasEValores(registro, colunasAtualizacao);
        const condicoes: Condicao[] = [this.tipoEntidade.resolverCondicaoPorChavePrimaria(registro)];
        
        // Se a entidade possui campo de versão, adicionar condição de versão
        if (nomePropriedadeVersao) {
            // Adicionar condição de versão atual ao WHERE
            condicoes.push({
                coluna: new ReferenciaColuna(nomePropriedadeVersao),
                operador: '=',
                valor: new Literal(versaoAtual || 0)
            } as any);
        }
        
        return new Atualizar(-1, this.tipoEntidade.obterNome(), colunasEValores, condicoes);
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

    private aplicarValoresPadrao(registro: ObjetoDeleguaClasse): void {
        for (const propriedade of this.tipoEntidade.modelo.propriedades) {
            const nomeCampo = propriedade.nome.lexema;
            
            // Aplicar valor padrão apenas se o campo não foi definido
            if (registro.propriedades[nomeCampo] === undefined || registro.propriedades[nomeCampo] === null) {
                for (const decorador of propriedade.decoradores) {
                    const nomeDecorador = decorador.nome.replace(/^@/, '');
                    
                    if (nomeDecorador === 'padrao') {
                        const valorPadrao = decorador.atributos?.valor || decorador.atributos?.padrao;
                        if (valorPadrao !== undefined) {
                            registro.propriedades[nomeCampo] = valorPadrao;
                        }
                        break;
                    }
                }
            }
        }
    }

    private async validarRegistro(registro: ObjetoDeleguaClasse): Promise<void> {
        // Função para verificar unicidade no banco
        const verificadorUnicidade = async (campo: string, valor: any, idExcluir?: any): Promise<boolean> => {
            const chavePrimaria = this.tipoEntidade.obterNomeChavePrimaria();
            const nomeTabela = this.tipoEntidade.obterNome();
            
            // Construir consulta para verificar se já existe outro registro com este valor
            const construtor = this.consulta();
            construtor.onde(campo, 'IGUAL', valor);
            
            // Se estiver atualizando, excluir o registro atual da verificação
            if (idExcluir !== undefined && idExcluir !== null) {
                construtor.e(chavePrimaria, 'DIFERENTE', idExcluir);
            }
            
            const registros = await construtor.todos();
            return registros.length > 0;
        };

        const erros = await Validador.validar(this.tipoEntidade, registro, verificadorUnicidade);
        if (erros.length > 0) {
            throw new ErroDeValidacao(erros);
        }
    }

    private async existeRegistroPorChaves(registro: ObjetoDeleguaClasse): Promise<boolean> {
        const chaves = this.tipoEntidade.obterNomesChavesPrimarias();
        if (chaves.length === 0) {
            return false;
        }

        const construtor = this.consulta();
        let primeiraCondicao = true;

        for (const chave of chaves) {
            const valor = registro.propriedades[chave];
            if (valor === undefined || valor === null) {
                return false;
            }

            if (primeiraCondicao) {
                construtor.onde(chave, 'IGUAL', valor);
                primeiraCondicao = false;
            } else {
                construtor.e(chave, 'IGUAL', valor);
            }
        }

        const registros = await construtor.todos();
        return registros.length > 0;
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
        this.aplicarValoresPadrao(registro);
        await this.validarRegistro(registro);
        await this.executarGanchos('antesDeInserir', registro);
        const comando = this.inserir(registro);
        const resultado = await this.executarComandoComRegistroOperacao(comando, 'INSERT');
        await this.executarGanchos('aposInserir', registro);
        return resultado;
    }

    async modificar(registro: ObjetoDeleguaClasse, colunas: string[] = []): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();
        await this.validarRegistro(registro);
        await this.executarGanchos('antesDeAtualizar', registro);
        const comando = this.atualizar(registro, colunas);
        const resultado = await this.executarComandoComRegistroOperacao(comando, 'UPDATE');
        
        // Verificar conflito de concorrência
        const nomePropriedadeVersao = this.tipoEntidade.obterNomePropriedadeVersao?.();
        if (nomePropriedadeVersao && resultado[0] && resultado[0][0]?.affectedRows === 0) {
            throw new ErroConcorrencia(
                `Não foi possível atualizar o registro. Possível conflito de versão: o registro foi modificado por outro processo.`
            );
        }
        
        await this.executarGanchos('aposAtualizar', registro);
        return resultado;
    }

    async salvarOuAtualizar(registro: ObjetoDeleguaClasse, colunas: string[] = []): Promise<RetornoComandoInterface[]> {
        this.verificarTecnologia();

        const existe = await this.existeRegistroPorChaves(registro);
        if (existe) {
            return this.modificar(registro, colunas);
        }

        return this.salvar(registro);
    }

    async upsert(registro: ObjetoDeleguaClasse, colunas: string[] = []): Promise<RetornoComandoInterface[]> {
        return this.salvarOuAtualizar(registro, colunas);
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
            this.aplicarValoresPadrao(registro);
            await this.validarRegistro(registro);
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
        const nomePropriedadeVersao = this.tipoEntidade.obterNomePropriedadeVersao?.();

        for (const registro of registros) {
            await this.validarRegistro(registro);
            await this.executarGanchos('antesDeAtualizar', registro);
            const comando = this.atualizar(registro, colunas);
            const resultado = await this.executarComandoComRegistroOperacao(comando, 'UPDATE LOTE');
            
            // Verificar conflito de concorrência
            if (nomePropriedadeVersao && resultado[0] && resultado[0][0]?.affectedRows === 0) {
                throw new ErroConcorrencia(
                    `Não foi possível atualizar o registro. Possível conflito de versão: o registro foi modificado por outro processo.`
                );
            }
            
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
