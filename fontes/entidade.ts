import {
    DescritorTipoClasse,
    DeleguaFuncao,
    ObjetoDeleguaClasse
} from "@designliquido/delegua/interpretador/estruturas";
import { Classe } from "@designliquido/delegua/declaracoes";
import { ColunaEValor, Condicao, Literal, ReferenciaColuna } from "@designliquido/lincones-js";
import { pluralizar } from "@designliquido/flexoes";

import { TabelaInterface } from "./interfaces/tabela-interface";
import { EntidadeInterface } from "./interfaces/entidade-interface";

/**
 * Classe responsável por intermediar um registro (normalmente um `ObjetoDeleguaClasse`)
 * e interfaces de manipulação de dados. Normalmente usada por objetos do tipo `Colecao`
 * para gerar comandos de alto nível para bibliotecas como `lincones-js`. 
 */
export class Entidade implements EntidadeInterface {
    modelo: DescritorTipoClasse;
    nomePropriedadeChavePrimaria: string;

    /**
     * Construtor da classe Entidades.
     * @param diretorioAtual O diretório atual.
     * @param caminhoModelos O caminho dos modelos de tabelas.
     * @param tecnologia A tecnologia utilizada.
     */
    constructor(modelo: DescritorTipoClasse | Classe) {
        if (modelo instanceof DescritorTipoClasse) {
            this.validarTipoModelo(modelo);
            this.modelo = modelo;
        }

        if (modelo instanceof Classe) {
            const descritorClasse = this.validarModeloClasse(modelo);
            this.modelo = descritorClasse;
        }
    }

    private validarModeloClasse(modelo: Classe) {
        // Validações:
        // Deve ter uma propriedade chamada `id` ou então pelo menos uma propriedade que tenha um
        // decorador @chave.
        for (const propriedade of modelo.propriedades) {
            if (propriedade.nome.lexema === "id") {
                this.nomePropriedadeChavePrimaria = "id";
                break;
            }

            for (const decorador of propriedade.decoradores) {
                if (decorador.nome === "@chave") {
                    this.nomePropriedadeChavePrimaria = propriedade.nome.lexema;
                    break;
                }
            }
        }

        return this.construirDescritorTipoClasse(modelo);
    }

    private construirDescritorTipoClasse(modelo: Classe): DescritorTipoClasse {
        const metodos = {};
        const definirMetodos = modelo.metodos;
        for (let i = 0; i < modelo.metodos.length; i++) {
            const metodoAtual = definirMetodos[i];
            const eInicializador = metodoAtual.simbolo.lexema === "construtor";
            const funcao = new DeleguaFuncao(
                metodoAtual.simbolo.lexema,
                metodoAtual.funcao,
                undefined,
                eInicializador
            );
            metodos[metodoAtual.simbolo.lexema] = funcao;
        }

        const descritorTipoClasse: DescritorTipoClasse =
            new DescritorTipoClasse(
                modelo.simbolo,
                undefined, // Por enquanto não teremos herança.
                metodos,
                modelo.propriedades
            );

        return descritorTipoClasse;
    }

    private validarTipoModelo(modelo: DescritorTipoClasse): void {
        // Validações:
        // Deve ter uma propriedade chamada `id` ou então pelo menos uma propriedade que tenha um
        // decorador @chave.
        let possuiChavePrimaria = false;
        for (const propriedade of modelo.propriedades) {
            if (propriedade.nome.lexema === "id") {
                possuiChavePrimaria = true;
                break;
            }

            for (const decorador of propriedade.decoradores) {
                if (decorador.nome === "chave") {
                    possuiChavePrimaria = true;
                    break;
                }
            }
        }

        if (!possuiChavePrimaria) {
            throw new Error(
                "Modelo não possui uma chave primária definida. " +
                    "Para definir uma chave primária, você pode ou declarar uma propriedade `id` com o tipo `número`, " +
                    "ou declarar uma propriedade com o tipo número e decorá-la com `@chave`."
            );
        }
    }

    obterNome(): string {
        return this.modelo.simboloOriginal.lexema;
    }

    obterNomeChavePrimaria(): string {
        return this.nomePropriedadeChavePrimaria;
    }

    obterNomesColunas(): string[] {
        let nomesColunas: string[] = [];
        for (let propriedade of this.modelo.propriedades) {
            nomesColunas.push(propriedade.nome.lexema);
        }

        return nomesColunas;
    }

    /**
     * Traduz um tipo para o equivalente em SQL.
     * @param tipo O tipo a ser traduzido.
     * @returns O tipo traduzido em SQL.
     */
    traduzirTipo(tipo: string): string {
        switch (tipo) {
            case "numero":
                return "int";
            case "texto":
                return "varchar";
            default:
                throw new Error(
                    `EntidadesError: O tipo: ${tipo} não é valido.`
                );
        }
    }

    obterValoresDasPropriedades(
        tabela: TabelaInterface,
        classe: ObjetoDeleguaClasse
    ): string {
        return tabela.atributos
            .map((atributo) => {
                const propriedade = Object.entries(classe.propriedades).find(
                    ([key, value]) => key === atributo.nome
                );
                return propriedade ? propriedade[1] : null;
            })
            .join(", ");
    }

    resolverValoresParaColunas(registro: ObjetoDeleguaClasse, colunas: string[]): any[] {
        const valores: any[] = [];
        for (const coluna of colunas) {
            if (!this.modelo.propriedades.some(p => p.nome.lexema === coluna)) {
                throw new Error(`Coluna ${coluna} não existe em entidade ${this.modelo.simboloOriginal.lexema}.`);
            }

            valores.push(registro.propriedades[coluna]);
        }

        return valores;
    }

    resolverColunasEValores(registro: ObjetoDeleguaClasse, colunas: string[]): ColunaEValor[] {
        const colunasEValores: ColunaEValor[] = [];
        for (const coluna of colunas) {
            if (!this.modelo.propriedades.some(p => p.nome.lexema === coluna)) {
                throw new Error(`Coluna ${coluna} não existe em entidade ${this.modelo.simboloOriginal.lexema}.`);
            }

            colunasEValores.push(
                new ColunaEValor(
                    new ReferenciaColuna(coluna), 
                    new Literal(registro.propriedades[coluna])
                )
            );
        }

        return colunasEValores;
    }

    resolverCondicaoPorChavePrimaria(registro: ObjetoDeleguaClasse): Condicao {
        const chave = this.nomePropriedadeChavePrimaria;
        const valor = registro.propriedades[chave];
        return new Condicao(
            new ReferenciaColuna(chave),
            'IGUAL',
            new Literal(valor, typeof valor === 'number' ? "INTEIRO" : "TEXTO")
        );
    }
}
