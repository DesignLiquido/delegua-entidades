import { instanciarAdaptador } from "./ilc/leitor-configuracao";
import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

let configuracaoAtual: Configuracoes | null = null;

/**
 * Retorna a configuração global ativada pela última chamada a `aplicar()`.
 * Retorna `null` se nenhuma configuração foi aplicada.
 */
export function obterConfiguracaoGlobal(): Configuracoes | null {
    return configuracaoAtual;
}

/**
 * Instancia o adaptador de banco de dados a partir da configuração global atual.
 * Retorna `null` se nenhuma configuração foi aplicada ou se o adaptador não puder ser criado.
 */
export function criarAdaptadorDaConfiguracaoGlobal(): TecnologiaLinconesInterface | null {
    if (!configuracaoAtual) return null;
    return instanciarAdaptador({
        tecnologia: configuracaoAtual.tecnologia,
        caminho: configuracaoAtual.caminho,
        host: configuracaoAtual.host,
        porta: configuracaoAtual.porta,
        usuario: configuracaoAtual.usuario,
        senha: configuracaoAtual.senha,
        banco: configuracaoAtual.banco,
    });
}

/**
 * Permite configurar a conexão com o banco de dados em tempo de execução.
 * Após ajustar as propriedades desejadas, chame `aplicar()` para ativar a configuração.
 *
 * Exemplo de uso em Delégua:
 * ```
 * var configuracoes = entidades.Configuracoes()
 * configuracoes.caminho = "meu-banco.db"
 * configuracoes.porta = 5432
 * configuracoes.aplicar()
 * ```
 */
export class Configuracoes {
    /** Caminho do arquivo de banco de dados (SQLite). */
    caminho?: string;

    /** Porta do servidor de banco de dados (PostgreSQL, MySQL). */
    porta?: number;

    /** Endereço do servidor de banco de dados. */
    host?: string;

    /** Nome de usuário para autenticação. */
    usuario?: string;

    /** Senha para autenticação. */
    senha?: string;

    /** Nome do banco de dados. */
    banco?: string;

    /** Tipo de tecnologia: 'sqlite', 'postgresql', 'mysql', etc. */
    tecnologia?: string;

    /**
     * Ativa esta configuração globalmente.
     * O próximo `ContextoEntidades` criado sem argumento explícito usará estas definições.
     */
    aplicar(): void {
        configuracaoAtual = this;
    }
}
