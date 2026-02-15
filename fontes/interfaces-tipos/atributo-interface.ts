/**
 * Interface que representa um atributo.
 *
 * @interface AtributoInterface
 * @property {string} nome - O nome do atributo.
 * @property {string} tipo - O tipo do atributo.
 */
export interface AtributoInterface {
  nome: string;
  tipo: string;
    precisao?: number; // Para tipos numéricos decimais: número total de dígitos
    escala?: number; // Para tipos numéricos decimais: número de dígitos após o ponto decimal
    tamanho?: number; // Para tipos texto/varchar: comprimento máximo da string
    valorPadrao?: any; // Valor padrão para a coluna
    anulavel?: boolean; // Se a coluna aceita valores null (padrão: true)
    unico?: boolean; // Se os valores da coluna devem ser únicos
    autoIncremento?: boolean; // Se a coluna é auto incrementada
