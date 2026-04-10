import { DescritorTipoClasse } from "@designliquido/delegua/interpretador/estruturas";
import LinconesSQLite from "@designliquido/lincones-sqlite";

import { Entidade } from "./entidade";
import { criarAdaptadorDaConfiguracaoGlobal } from "./configuracoes";
import { obterAdaptadorPadrao } from "./ilc/leitor-configuracao";

/**
 * Registro global de modelos observados pela classe `Base`.
 * Separado da classe para sobreviver a reimportações do módulo.
 */
const _modelosObservados: DescritorTipoClasse[] = [];

/**
 * Ponto de entrada estático para registro e inicialização de esquema.
 * Permite registrar classes Delégua como entidades e criar suas tabelas
 * antes de abrir qualquer contexto de dados.
 *
 * Exemplo de uso em Delégua:
 * ```
 * entidades.Base.observar(Artigo)
 * entidades.Base.inicializar()
 * ```
 */
export class Base {
    /**
     * Registra uma classe Delégua para criação de tabela ao chamar `inicializar()`.
     * Desencapsula o envelope `{ valor: ... }` que o interpretador Delégua injeta
     * ao passar classes como argumentos.
     * @param classe O descritor da classe Delégua a ser observada.
     */
    static observar(classe: any): void {
        let descritor: any = classe;
        while (
            descritor !== null &&
            descritor !== undefined &&
            typeof descritor === 'object' &&
            Object.prototype.hasOwnProperty.call(descritor, 'valor') &&
            !(descritor instanceof DescritorTipoClasse)
        ) {
            descritor = descritor.valor;
        }

        if (!(descritor instanceof DescritorTipoClasse)) {
            return;
        }

        const jaRegistrado = _modelosObservados.some(
            (m) => m.simboloOriginal?.lexema === descritor.simboloOriginal?.lexema
        );
        if (!jaRegistrado) {
            _modelosObservados.push(descritor);
        }
    }

    /**
     * Cria as tabelas de todos os modelos registrados via `observar()`.
     * Usa a configuração global ativada por `Configuracoes.aplicar()`,
     * o arquivo `configuracao.delprops` ou SQLite como padrão.
     */
    static async inicializar(): Promise<void> {
        const tecnologia =
            criarAdaptadorDaConfiguracaoGlobal() ??
            obterAdaptadorPadrao() ??
            new LinconesSQLite();

        await tecnologia.iniciar(null as any);

        for (const descritor of _modelosObservados) {
            const entidade = new Entidade(descritor);
            const comando = entidade.gerarComandoCriarTabela();
            await tecnologia.executarComando(comando);
        }
    }

    /**
     * Remove todos os modelos registrados.
     * Útil em testes para resetar o estado global entre execuções.
     */
    static limpar(): void {
        _modelosObservados.splice(0, _modelosObservados.length);
    }
}
