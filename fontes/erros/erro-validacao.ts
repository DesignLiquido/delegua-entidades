export interface ErroValidacao {
    campo: string;
    mensagem: string;
}

export class ErroDeValidacao extends Error {
    erros: ErroValidacao[];

    constructor(erros: ErroValidacao[]) {
        const mensagens = erros.map(e => `${e.campo}: ${e.mensagem}`).join('; ');
        super(`Erro de validação: ${mensagens}`);
        this.name = 'ErroDeValidacao';
        this.erros = erros;
    }
}
