import { Entidade } from './fontes/entidade';

export { Entidade } from './fontes/entidade';
export { Colecao } from './fontes/colecao';
export { ContextoEntidades } from './fontes/contexto-entidades';
export { EntidadeInterface } from './fontes/interfaces/entidade-interface';

/**
 * Essa função inicializa uma instância de `Entidade` com um modelo carregado.
 * Este modelo é o ponto de partida para quaisquer operações de banco de dados,
 * seja a partir da tabela que representa, seja através dos relacionamentos dessa
 * tabela com outras.
 * @param {ObjetoDeleguaClasse} _modelo O modelo de ponto de partida para as operações
 *                                      de bancos de dados.
 */
export function modelo(_modelo: any): Entidade {
    const entidades = new Entidade(_modelo);
    return entidades;
}