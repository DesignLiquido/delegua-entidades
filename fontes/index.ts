import { Entidade } from './entidade';

export { Entidade } from './entidade';
export { Colecao } from './colecao';
export { ConstrutorConsulta } from './construtor-consulta';
export { ContextoEntidades } from './contexto-entidades';
export { ContextoEntidades as Contexto } from './contexto-entidades';
export { Relacionamento } from './relacionamento';
export { Validador } from './validacoes/validador';
export { ErroDeValidacao, ErroValidacao } from './erros/erro-validacao';

export { CacheConsultas } from './cache-consultas';
export { CarregadorLote as CarregadorLote, GerenciadorCarregadoresLote } from './carregador-lotes';
export { AnalisadorDicas } from './analisador-dicas';

export { EntidadeInterface } from './interfaces-tipos/entidade-interface';
export { GanchosInterface, FuncaoGancho, EventoGancho } from './interfaces-tipos/ganchos';
export { RelacionamentoInterface, TipoRelacionamento, AcaoCascata } from './interfaces-tipos/relacionamento-interface';

export { Taquigrafo, NivelDetalhamentoTaquigrafia, FuncaoTaquigrafia } from './taquigrafia';
export { RastreadorMudancas } from './rastreador-mudancas';
export { Migracao } from './migracoes/migracao';
export { ExecutorMigracoes } from './migracoes/executor-migracoes';
export { GeradorMigracoes, InformacaoEsquemaInterface as SchemaInfo } from './migracoes/gerador-migracoes';
export { Semeador, ClasseSemente } from './migracoes/semeador';
export { CarregadorPreguicoso } from './carregador-preguicoso';
export { Transacao } from './transacao';
export { TransacaoInterface } from './interfaces-tipos/transacao-interface';
export { RoteadorBancos } from './roteador-bancos';
export { ConfiguracaoBancoDadosInterface as ConfiguracaoBancoDados, ConfiguracoesBancos } from './interfaces-tipos/configuracao-banco-dados-interface';
export { SementeInterface } from './interfaces-tipos/semente-interface';
export { Configuracoes } from './configuracoes';
export { Base } from './base';

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
