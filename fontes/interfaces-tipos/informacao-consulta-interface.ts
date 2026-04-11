/**
 * Informações sobre uma consulta executada.
 */
export interface InformacaoConsultaInterface {
    sql: string;
    linhaExecucao: Error;
    carimboTempo: Date;
    tempoExecucao: number;
    quantidadeRegistros: number;
    nomeEntidade?: string;
}