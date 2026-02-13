import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { Classe } from "@designliquido/delegua/declaracoes";
import { Lexador } from "@designliquido/delegua/lexador";
import { AvaliadorSintatico } from "@designliquido/delegua/avaliador-sintatico";

import { Entidade } from "../fontes/entidade";

describe('Entidade', () => {
    let lexador: Lexador;
    let avaliadorSintatico: AvaliadorSintatico;

    beforeEach(() => {
        lexador = new Lexador();
        avaliadorSintatico = new AvaliadorSintatico();
    });

    describe('Inicialização por classe', () => {
        it('Classe com id', async () => {
            const retornoLexador = lexador.mapear(
                [
                    'classe Artigo {',
                    '  id: numero',
                    '  titulo: texto',
                    '  conteudo: texto',
                    '}'
                ],
                -1
            );
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);

            const classe = retornoAvaliadorSintatico.declaracoes[0] as Classe;

            let entidade: Entidade;
            expect(() => {
                entidade = new Entidade(classe);
            }).not.toThrow();
            expect(entidade.modelo).toBeInstanceOf(DescritorTipoClasse);
            expect(entidade.modelo.propriedades).toHaveLength(3);
        });

        it('Classe com decorador de chave', async () => {
            const retornoLexador = lexador.mapear(
                [
                    'classe Artigo {',
                    '  @chave',
                    '  artigoId: numero',
                    '  titulo: texto',
                    '  conteudo: texto',
                    '}'
                ],
                -1
            );
            const retornoAvaliadorSintatico = await avaliadorSintatico.analisar(retornoLexador, -1);
            expect(retornoAvaliadorSintatico).toBeTruthy();
            expect(retornoAvaliadorSintatico.declaracoes).toHaveLength(1);

            const classe = retornoAvaliadorSintatico.declaracoes[0] as Classe;
            let entidade: Entidade;
            expect(() => {
                entidade = new Entidade(classe);
            }).not.toThrow();
            expect(entidade.modelo).toBeInstanceOf(DescritorTipoClasse);
            expect(entidade.modelo.propriedades).toHaveLength(3);
        });
    });
});
