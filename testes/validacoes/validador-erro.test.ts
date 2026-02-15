import { ErroDeValidacao } from "../../fontes/erros/erro-validacao";

describe('ErroDeValidacao', () => {
    it('contém a lista de erros', () => {
        const erros = [
            { campo: 'nome', mensagem: 'Campo obrigatório' },
            { campo: 'email', mensagem: 'Campo obrigatório' }
        ];
        const erro = new ErroDeValidacao(erros);
        expect(erro.erros).toHaveLength(2);
        expect(erro.name).toBe('ErroDeValidacao');
        expect(erro.message).toContain('nome');
        expect(erro.message).toContain('email');
    });
});
