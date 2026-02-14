import { AtributoInterface } from "./atributo-interface";

/**
 * Interface que representa uma tabela.
 * @interface TabelaInterface
 * @property {string} nome_tabela - O nome da tabela.
 * @property {AtributoInterface[]} atributos - Os atributos da tabela.
 */
export interface TabelaInterface {
  nomeTabela: string;
  atributos: AtributoInterface[];
}
