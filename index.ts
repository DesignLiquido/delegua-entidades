import { Entidade } from './fontes/entidade';

export { Entidade } from './fontes/entidade';
export { Colecao } from './fontes/colecao';
export { ConstrutorConsulta } from './fontes/construtor-consulta';
export { ContextoEntidades } from './fontes/contexto-entidades';
export { Relacionamento } from './fontes/relacionamento';
export { Validador } from './fontes/validacoes/validador';
export { ErroDeValidacao, ErroValidacao } from './fontes/erros/erro-validacao';

export { EntidadeInterface } from './fontes/interfaces-tipos/entidade-interface';
export { GanchosInterface, FuncaoGancho, EventoGancho } from './fontes/interfaces-tipos/ganchos';
export { RelacionamentoInterface, TipoRelacionamento, AcaoCascata } from './fontes/interfaces-tipos/relacionamento-interface';

export { Taquigrafo, NivelDetalhamentoTaquigrafia, FuncaoTaquigrafia } from './fontes/taquigrafia';
export { RastreadorMudancas, EstadoEntidade, RegistroRastreado } from './fontes/rastreador-mudancas';
export { Migracao, OperacaoMigracao } from './fontes/migracoes/migracao';
export { ExecutorMigracoes } from './fontes/migracoes/executor-migracoes';
export { GeradorMigracoes, SchemaInfo } from './fontes/migracoes/gerador-migracoes';
export { Semeador, ClasseSemente } from './fontes/migracoes/semeador';
export { CarregadorPreguicoso } from './fontes/carregador-preguicoso';
export { Transacao } from './fontes/transacao';
export { TransacaoInterface } from './fontes/interfaces-tipos/transacao-interface';
export { RoteadorBancos } from './fontes/roteador-bancos';
export { ConfiguracaoBancoDados, ConfiguracoesBancos } from './fontes/interfaces-tipos/configuracao-banco-dados-interface';
export { SementeInterface } from './fontes/interfaces-tipos/semente-interface';

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
