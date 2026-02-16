/**
 * Interface que representa um índice de banco de dados.
 *
 * @interface IndiceInterface
 * @property {string} nome - O nome do índice
 * @property {string[]} colunas - As colunas que compõem o índice
 * @property {boolean} unico - Se o índice deve ser único
 * @property {string} [tipo] - O tipo de índice (BTREE, HASH, GIST, GIN)
 */
export interface IndiceInterface {
    nome: string;
    colunas: string[];
    unico: boolean;
    tipo?: 'BTREE' | 'HASH' | 'GIST' | 'GIN';
}
