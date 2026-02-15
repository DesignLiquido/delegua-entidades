/**
 * Configuração de conexão com banco de dados.
 */
export interface ConfiguracaoBancoDados {
    /**
     * Nome único identificador do banco de dados.
     */
    nome: string;

    /**
     * Tipo de banco de dados.
     */
    tipo: 'sqlite' | 'postgresql' | 'mysql';

    /**
     * Caminho do arquivo (para SQLite).
     */
    caminho?: string;

    /**
     * Host do servidor (para PostgreSQL, MySQL).
     */
    host?: string;

    /**
     * Porta do servidor.
     */
    porta?: number;

    /**
     * Nome do banco de dados.
     */
    banco: string;

    /**
     * Usuário para autenticação.
     */
    usuario?: string;

    /**
     * Senha para autenticação.
     */
    senha?: string;

    /**
     * Indica se é o banco padrão.
     */
    padrao?: boolean;
}

/**
 * Mapa de configurações de banco de dados.
 */
export type ConfiguracoesBancos = { [nome: string]: ConfiguracaoBancoDados };
