import {
    DescritorTipoClasse,
    DeleguaFuncao,
    ObjetoDeleguaClasse
} from "@designliquido/delegua/interpretador/estruturas";
import { Classe } from "@designliquido/delegua/declaracoes";
import { Coluna, ColunaEValor, Condicao, Criar, Literal, ReferenciaColuna } from "@designliquido/lincones-js";
import { pluralizar } from "@designliquido/flexoes";

import { TabelaInterface } from "./interfaces-tipos/tabela-interface";
import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { RelacionamentoInterface } from "./interfaces-tipos/relacionamento-interface";
import { Relacionamento } from "./relacionamento";

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
        for (const propriedade of modelo.propriedades) {
            if (propriedade.nome.lexema === "id") {
                this.nomePropriedadeChavePrimaria = "id";
                return;
            }

            for (const decorador of propriedade.decoradores) {
                if (decorador.nome === "chave") {
                    this.nomePropriedadeChavePrimaria = propriedade.nome.lexema;
                    return;
                }
            }
        }

        throw new Error(
            "Modelo não possui uma chave primária definida. " +
                "Para definir uma chave primária, você pode ou declarar uma propriedade `id` com o tipo `número`, " +
                "ou declarar uma propriedade com o tipo número e decorá-la com `@chave`."
        );
    }

    obterNome(): string {
        return this.modelo.simboloOriginal.lexema;
    }

    possuiCriadoEm(): boolean {
        return this.modelo.propriedades.some(p => p.nome.lexema === 'criado_em');
    }

    possuiAtualizadoEm(): boolean {
        return this.modelo.propriedades.some(p => p.nome.lexema === 'atualizado_em');
    }

    obterNomeChavePrimaria(): string {
        return this.nomePropriedadeChavePrimaria;
    }

    /**
     * Obtém o nome do banco de dados ao qual a entidade pertence.
     * Busca por decorador @banco, senão retorna "padrão".
     */
    obterNomeBancoDados(): string {
        for (const propriedade of this.modelo.propriedades) {
            for (const decorador of propriedade.decoradores) {
                const nomeDecorador = decorador.nome.replace(/^@/, '');
                if (nomeDecorador === 'banco') {
                    return decorador.atributos?.nome || 'padrão';
                }
            }
        }
        
        // Se nenhum decorador @banco foi encontrado, verificar em uma localização padrão
        // (idealmente seria no nível da classe, mas estamos limitados às propriedades)
        return 'padrão';
    }

    /**
     * Verifica se a entidade possui exclusão lógica (soft delete) habilitada.
     * Busca por propriedade com decorador @exclusaoLogica ou coluna "excluido_em".
     */
    possuiExclusaoLogica(): boolean {
        // Procurar por decorador @exclusaoLogica
        for (const propriedade of this.modelo.propriedades) {
            for (const decorador of propriedade.decoradores) {
                const nomeDecorador = decorador.nome.replace(/^@/, '');
                if (nomeDecorador === 'exclusaoLogica') {
                    return true;
                }
            }
        }
        
        // Procurar por coluna "excluido_em"
        return this.modelo.propriedades.some(p => p.nome.lexema === 'excluido_em');
    }

    /**
     * Obtém o nome da coluna de exclusão lógica.
     * Retorna "excluido_em" como padrão.
     */
    obterNomeColunaExclusaoLogica(): string {
        for (const propriedade of this.modelo.propriedades) {
            for (const decorador of propriedade.decoradores) {
                const nomeDecorador = decorador.nome.replace(/^@/, '');
                if (nomeDecorador === 'exclusaoLogica') {
                    return decorador.atributos?.coluna || 'excluido_em';
                }
            }
        }
        
        // Se houver uma propriedade "excluido_em", usá-la
        if (this.modelo.propriedades.some(p => p.nome.lexema === 'excluido_em')) {
            return 'excluido_em';
        }
        
        return 'excluido_em';
    }

    obterRelacionamentos(): RelacionamentoInterface[] {
        const relacionamentos: RelacionamentoInterface[] = [];
        const nomeEntidade = this.obterNome();

        for (const propriedade of this.modelo.propriedades) {
            for (const decorador of propriedade.decoradores) {
                const nomeDecorador = decorador.nome.replace(/^@/, '');

                if (nomeDecorador === 'temUm' || nomeDecorador === 'temMuitos' || nomeDecorador === 'pertenceA') {
                    const entidadeDestino = decorador.atributos?.entidade;
                    if (!entidadeDestino) continue;

                    let colunaOrigem: string;
                    let colunaDestino: string;

                    if (nomeDecorador === 'pertenceA') {
                        colunaOrigem = decorador.atributos?.chaveEstrangeira || `${entidadeDestino.toLowerCase()}_id`;
                        colunaDestino = 'id';
                    } else {
                        colunaOrigem = 'id';
                        colunaDestino = decorador.atributos?.chaveEstrangeira || `${nomeEntidade.toLowerCase()}_id`;
                    }

                    const cascata = decorador.atributos?.cascata;

                    relacionamentos.push(new Relacionamento(
                        nomeDecorador as any,
                        propriedade.nome.lexema,
                        entidadeDestino,
                        colunaOrigem,
                        colunaDestino,
                        cascata
                    ));
                }
            }
        }

        return relacionamentos;
    }

    obterNomesColunas(): string[] {
        let nomesColunas: string[] = [];
        for (let propriedade of this.modelo.propriedades) {
            nomesColunas.push(propriedade.nome.lexema);
        }

        return nomesColunas;
    }

    /**
     * Traduz um tipo Delégua para o equivalente em lincones-js.
     * @param tipo O tipo Delégua a ser traduzido.
     * @returns O tipo no formato lincones-js.
     */
    traduzirTipo(tipo: string): string {
        switch (tipo) {
            case "numero":
            case "número":
            case "inteiro":
            case "longo":
                return "INTEIRO";
            case "decimal":
                return "NUMERO";
            case "texto":
                return "TEXTO";
            case "caracteres":
                return "CARACTERES";
            case "logico":
            case "lógico":
                return "LOGICO";
            default:
                throw new Error(
                    `EntidadesError: O tipo: ${tipo} não é válido.`
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

    gerarComandoCriarTabela(): Criar {
        const colunas: Coluna[] = [];
        for (const propriedade of this.modelo.propriedades) {
            const nome = propriedade.nome.lexema;
            const tipo = propriedade.tipo ? this.traduzirTipo(propriedade.tipo) : "TEXTO";
            const chavePrimaria = nome === this.nomePropriedadeChavePrimaria;
            colunas.push(new Coluna(nome, tipo, undefined, !chavePrimaria, chavePrimaria, false, chavePrimaria));
        }

        return new Criar(-1, this.obterNome(), colunas, true);
    }

    hidratarRegistro(linha: { [coluna: string]: any }): ObjetoDeleguaClasse {
        const objeto = new ObjetoDeleguaClasse(this.modelo);
        for (const propriedade of this.modelo.propriedades) {
            const nome = propriedade.nome.lexema;
            if (nome in linha) {
                objeto.propriedades[nome] = linha[nome];
            }
        }
        return objeto;
    }

    hidratarRegistros(linhas: any[]): ObjetoDeleguaClasse[] {
        return linhas.map(linha => this.hidratarRegistro(linha));
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
