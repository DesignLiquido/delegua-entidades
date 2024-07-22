import { Entidades } from './fontes/entidades';

/**
 * Essa função inicializa uma instância de `Entidades` com um modelo carregado.
 * Este modelo é o ponto de partida para quaisquer operações de banco de dados,
 * seja a partir da tabela que representa, seja através dos relacionamentos dessa
 * tabela com outras.
 * @param {ObjetoDeleguaClasse} _modelo O modelo de ponto de partida para as operações
 *                                      de bancos de dados.
 */
export function modelo(_modelo: any): Entidades {
    const entidades = new Entidades(_modelo);
    return entidades;
}