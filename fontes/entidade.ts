import * as sistemaArquivos from "fs";

import { Lexador } from "@designliquido/delegua/lexador";
import { AvaliadorSintatico } from "@designliquido/delegua/avaliador-sintatico";
import { ObjetoDeleguaClasse } from "@designliquido/delegua/estruturas/objeto-delegua-classe";

import { pluralizar } from "@designliquido/flexoes";

import { ErroTabelaNaoEncontrada } from "./erros";
import { TabelaInterface } from "./interfaces/tabela-interface";
import {
    DescritorTipoClasse,
    DeleguaFuncao,
} from "@designliquido/delegua/estruturas";
import { Classe } from "@designliquido/delegua/declaracoes";
import { EntidadeInterface } from "./interfaces/entidade-interface";
import { Selecionar } from "@designliquido/lincones-js";

/**
 * Classe responsável por gerar código SQL com base em modelos de tabelas.
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
            this.validarModeloTipo(modelo);
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

        const descritorTipoclasse: DescritorTipoClasse =
            new DescritorTipoClasse(
                modelo.simbolo,
                undefined, // Por enquanto não teremos herança.
                metodos,
                modelo.propriedades
            );

        return descritorTipoclasse;
    }

    private validarModeloTipo(modelo: DescritorTipoClasse): void {
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

    private obterNomesColunas(): string[] {
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

    /**
     * Procura uma tabela pelo nome.
     * @param nomeTabela O nome da tabela a ser procurada.
     * @returns A tabela encontrada.
     * @throws {ErroTabelaNaoEncontrada} Se a tabela não for encontrada.
     */
    /* procurarTabela(nomeTabela: string): TabelaInterface {
        const tabela = this.tabelas.find(
            (tabela) => tabela.nomeTabela === nomeTabela
        );
        if (!tabela) throw new ErroTabelaNaoEncontrada(nomeTabela);
        return tabela;
    } */

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

    gerarConstrutoSelecionar(): Selecionar {
        return new Selecionar(-1, "", [], []);
    }

    /**
     * Gera o código SQL para criar uma tabela.
     * @param tabela A tabela para a qual o código SQL será gerado.
     * @returns O código SQL para criar a tabela.
     */
    /* gerarSQLCriar(classe: ObjetoDeleguaClasse): string {
        const tabela = this.procurarTabela(
            classe.classe.simboloOriginal.lexema
        );
        const atributosSQL = tabela.atributos
            .map((atributo) => {
                return `${atributo.nome} ${this.traduzirTipo(atributo.tipo)}`;
            })
            .join(", ");
        return `CREATE TABLE ${tabela.nomeTabela} (${atributosSQL});`;
    } */

    /**
     * Gera o código SQL para inserir dados em uma tabela.
     * @param tabela A tabela para a qual o código SQL será gerado.
     * @returns O código SQL para inserir dados na tabela.
     */
    /* gerarSQLInserir(classe: ObjetoDeleguaClasse): string {
        const tabela = this.procurarTabela(
            classe.classe.simboloOriginal.lexema
        );
        const atributosSQL = tabela.atributos
            .map((atributo) => atributo.nome)
            .join(", ");
        const valoresSQL = this.obterValoresDasPropriedades(tabela, classe);
        return `INSERT INTO ${tabela.nomeTabela} (${atributosSQL}) VALUES (${valoresSQL});`;
    } */

    /**
     * Gera o código SQL para atualizar dados em uma tabela.
     * @param tabela A tabela para a qual o código SQL será gerado.
     * @returns O código SQL para atualizar dados na tabela.
     */
    /* gerarSQLAtualizar(classe: ObjetoDeleguaClasse): string {
        const tabela = this.procurarTabela(
            classe.classe.simboloOriginal.lexema
        );
        const atributosSQL = tabela.atributos
            .map((atributo) => {
                const valorPropriedade = classe.propriedades[atributo.nome];
                const valorFormatado =
                    typeof valorPropriedade === "string"
                        ? `'${valorPropriedade}'`
                        : valorPropriedade;
                return `${atributo.nome} = ${valorFormatado}`;
            })
            .join(", ");
        const id = classe.propriedades["id"];
        return `UPDATE ${tabela.nomeTabela} SET ${atributosSQL} WHERE id = ${id};`;
    } */

    /**
     * Gera o código SQL para deletar dados de uma tabela.
     * @param tabela A tabela para a qual o código SQL será gerado.
     * @returns O código SQL para deletar dados da tabela.
     */
    /* gerarSQLExcluir(classe: ObjetoDeleguaClasse): string {
        const tabela = this.procurarTabela(
            classe.classe.simboloOriginal.lexema
        );
        const id = classe.propriedades["id"];
        return `DELETE FROM ${tabela.nomeTabela} WHERE id = ${id};`;
    } */

    /**
     * Gera o código SQL para selecionar dados de uma tabela.
     * @param tabela A tabela para a qual o código SQL será gerado.
     * @returns O código SQL para selecionar dados da tabela.
     */
    gerarSQLSelecionar(condicoes?: { [coluna: string]: any }): string {
        const colunas = this.obterNomesColunas();
        let relacaoColunas = colunas.reduce(
            (total, coluna) => (total += coluna + ", "),
            ""
        );
        relacaoColunas = relacaoColunas.slice(0, -2);

        let relacaoCondicoes = "";
        let operadorAnd = "";
        if (condicoes) {
            relacaoCondicoes = "WHERE ";
            for (const [coluna, valor] of Object.entries(condicoes)) {
                if (
                    !this.modelo.propriedades.some(
                        (p) => p.nome.lexema === coluna
                    )
                ) {
                    throw new Error(
                        `Coluna ${coluna} não existe no modelo ${this.modelo.simboloOriginal.lexema}.`
                    );
                }

                relacaoCondicoes += operadorAnd + coluna + " = " + valor + " ";
                operadorAnd = "AND ";
            }
        }

        return `SELECT ${relacaoColunas} FROM ${this.modelo.simboloOriginal.lexema} ${relacaoCondicoes}`;
    }

    /**
     * Gera o código SQL para selecionar um dado de uma tabela.
     * @param tabela A tabela para a qual o código SQL será gerado.
     * @returns O código SQL para selecionar um dado da tabela.
     */
    /* gerarCodigoSQLSelecionarUm(classe: ObjetoDeleguaClasse): string {
        const tabela = this.procurarTabela(
            classe.classe.simboloOriginal.lexema
        );
        const id = classe.propriedades["id"];
        return `SELECT * FROM ${tabela.nomeTabela} WHERE id = ${id};`;
    } */

    /**
     * Carrega os modelos de tabelas.
     */
    // iniciar(): void {
    //     this.arquivos = this.obterNomesModelos();

    //     const conteudosArquivos: RetornoImportador<
    //         SimboloInterface,
    //         Declaracao
    //     >[] = this.arquivos.map((arquivo) => {
    //         return this.importador.importar(
    //             `${this.diretorioAtual}/${this.caminhoModelos}/${arquivo}`
    //         );
    //     });

    //     const classes: Classe[] = conteudosArquivos
    //         .map(
    //             (conteudo) =>
    //                 conteudo.retornoAvaliadorSintatico.declaracoes.filter(
    //                     (declaracao) => declaracao instanceof Classe
    //                 ) as Classe[]
    //         )
    //         .flat();

    //     classes.forEach((classe) => {
    //         const tabela: TabelaInterface = {
    //             nomeTabela: pluralizar(classe.simbolo.lexema),
    //             atributos: [],
    //         };

    //         classe.propriedades.forEach((propriedade) => {
    //             tabela.atributos.push({
    //                 nome: propriedade.nome.lexema,
    //                 tipo: propriedade.tipo,
    //             });
    //         });

    //         this.tabelas.push(tabela);
    //     });
    // }
}
