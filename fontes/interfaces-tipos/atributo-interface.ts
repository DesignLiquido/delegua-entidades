/**
 * Interface que representa um atributo.
 *
 * @interface AtributoInterface
 * @property {string} nome - O nome do atributo.
 * @property {string} tipo - O tipo do atributo.
 * @property {number} [precisao] - Para tipos numéricos: número total de dígitos
 * @property {number} [escala] - Para tipos decimais: número de dígitos após o ponto decimal
 * @property {number} [tamanho] - Para tipos texto/varchar: comprimento máximo
 * @property {any} [valorPadrao] - Valor padrão para a coluna
 * @property {boolean} [anulavel] - Se aceita valores null (padrão: true)
 * @property {boolean} [unico] - Se os valores devem ser únicos
 * @property {boolean} [autoIncremento] - Se é auto incrementada
 * @property {boolean} [chavePrimaria] - Se é chave primária
 * @property {string} [restricaoCheck] - Expressão SQL para restrição CHECK
 */
export interface AtributoInterface {
  nome: string;
  tipo: string;
    precisao?: number;
    escala?: number;
    tamanho?: number;
    valorPadrao?: any;
    anulavel?: boolean;
    unico?: boolean;
    autoIncremento?: boolean;
    chavePrimaria?: boolean;
    restricaoCheck?: string;
}
