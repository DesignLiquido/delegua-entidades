/**
 * Interface que representa uma restrição (constraint) de banco de dados.
 *
 * @interface RestriacaoInterface
 * @property {string} nome - O nome da restrição
 * @property {string} sql - A expressão SQL da restrição (ex: "idade > 0")
 * @property {string} tipo - O tipo de restrição (CHECK, UNIQUE, FOREIGN_KEY)
 */
export interface RestriacaoInterface {
    nome: string;
    sql: string;
    tipo: 'CHECK' | 'UNIQUE' | 'FOREIGN_KEY';
}
