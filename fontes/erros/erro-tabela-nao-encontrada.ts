export class ErroTabelaNaoEncontrada extends Error {
    constructor(nomeTabela: string) {
        super(`Tabela '${nomeTabela}' não encontrada ou não existe.`);
        this.name = 'ErroTabelaNaoEncontrada';
    }
}
