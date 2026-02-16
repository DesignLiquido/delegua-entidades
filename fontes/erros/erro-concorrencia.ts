/**
 * Erro lançado quando uma operação de atualização falha
 * devido a um conflito de concorrência otimista.
 * 
 * Indica que a versão do registro foi modificada por outro
 * processo desde a última leitura.
 */
export class ErroConcorrencia extends Error {
    constructor(
        mensagem: string = 'Conflito de concorrência: o registro foi modificado por outro processo.'
    ) {
        super(mensagem);
        this.name = 'ErroConcorrencia';
    }
}
