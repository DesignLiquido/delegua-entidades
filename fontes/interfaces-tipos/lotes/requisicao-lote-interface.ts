export interface RequisicaoLote<T> {
    chave: any;
    resolver: (valor: T) => void;
    rejeitar: (erro: Error) => void;
}
