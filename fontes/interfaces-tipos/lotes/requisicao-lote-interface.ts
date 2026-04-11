export interface RequisicaoLoteInterface<T> {
    chave: any;
    resolver: (valor: T) => void;
    rejeitar: (erro: Error) => void;
}
