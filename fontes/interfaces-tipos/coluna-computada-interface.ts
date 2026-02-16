/**
 * Interface que representa uma coluna computada (gerada) no banco de dados.
 *
 * @interface ColunaComputadaInterface
 * @property {string} nome - Nome da coluna computada
 * @property {string} tipo - Tipo da coluna (ex: INTEIRO, TEXTO)
 * @property {string} expressao - Expressao SQL da coluna computada
 * @property {boolean} [persistida] - Se a coluna e armazenada (STORED) ou virtual
 */
export interface ColunaComputadaInterface {
    nome: string;
    tipo: string;
    expressao: string;
    persistida?: boolean;
}
