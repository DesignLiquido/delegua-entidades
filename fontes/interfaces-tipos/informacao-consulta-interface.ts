/**
 * Informações sobre uma consulta executada.
 */
export interface InformacaoConsulta {
    sql: string;
    linhaExecucao: Error;
    carimboTempo: Date;
    tempoExecucao: number;
    quantidadeRegistros: number;
    nomeEntidade?: string;
}