/**
 * Tipos suportados de relacionamentos entre entidades.
 * - temUm: Um-para-um (entidade tem uma instância de outra)
 * - temMuitos: Um-para-muitos (entidade tem múltiplas instâncias de outra)
 * - pertenceA: Muitos-para-um (entidade pertence a uma instância de outra)
 * - muitoParaMuitos: Muitos-para-muitos (através de tabela intermediária)
 * - polimorfico: Relacionamento polimórfico (com múltiplas entidades possíveis)
 */
export type TipoRelacionamento = 'temUm' | 'temMuitos' | 'pertenceA' | 'muitoParaMuitos' | 'polimorfico';

export type AcaoCascata = 'inserir' | 'atualizar' | 'excluir';

/**
 * Interface base para relacionamentos entre entidades.
 * Implementa os relacionamentos básicos: um-para-um, um-para-muitos, muitos-para-um.
 */
export interface RelacionamentoInterface {
    tipo: TipoRelacionamento;
    nomePropriedade: string;
    entidadeDestino?: string;
    colunaOrigem?: string;
    colunaDestino?: string;
    cascata?: AcaoCascata[];
}
