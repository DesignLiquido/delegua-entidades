import * as sistemaArquivos from 'fs';

import { Importador } from '@designliquido/delegua-node/fontes/importador/importador'
import { Lexador } from '@designliquido/delegua/fontes/lexador'
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico'
import { Classe, Declaracao } from '@designliquido/delegua/fontes/declaracoes';
import { SimboloInterface } from '@designliquido/delegua/fontes/interfaces';
import { RetornoImportador } from '@designliquido/delegua-node/fontes/importador';
import { pluralizar } from '@designliquido/flexoes';

/**
 * Representa um conjunto de consultas SQL.
 */
type Consultas = {
  criar: string,
  inserir: string,
  selecionar: string,
  atualizar: string,
  deletar: string,
}

/**
 * Representa uma tabela e suas consultas SQL.
 */
type SqlType = {
  nome_modelo: string,
  codigo_tabela: Consultas,
}

/**
 * Interface que representa uma tabela.
 * @interface TabelaInterface
 * @property {string} nome_tabela - O nome da tabela.
 * @property {AtributoInterface[]} atributos - Os atributos da tabela.
 */
interface TabelaInterface {
  nome_tabela: string,
  atributos: AtributoInterface[]
}

/**
 * Interface que representa um atributo.
 *
 * @interface AtributoInterface
 * @property {string} nome - O nome do atributo.
 * @property {string} tipo - O tipo do atributo.
 */
interface AtributoInterface {
  nome: string,
  tipo: string
}

/**
 * Classe responsável por gerar código SQL com base em modelos de tabelas.
 */
export class Shurelya {
  importador: Importador
  arquivos: string[] = []

  /**
   * Construtor da classe Shurelya.
   * @param diretorio_atual O diretório atual.
   * @param caminho_modelos O caminho dos modelos de tabelas.
   * @param tecnologia A tecnologia utilizada.
   */
  constructor(
    private readonly diretorio_atual: string,
    private readonly caminho_modelos: string,
    private readonly tecnologia: string
  ) {
    this.importador = new Importador(
      new Lexador(),
      new AvaliadorSintatico(),
      {},
      {},
      false
    )
  }

  /**
   * Obtém os nomes dos modelos de tabelas.
   * @returns Uma lista com os nomes dos arquivos.
   */
  pegaNomesModelos(): string[] {
    const diretorio = `${this.diretorio_atual}/${this.caminho_modelos}`;
    if (!sistemaArquivos.existsSync(diretorio)) {
      return [];
    }

    return sistemaArquivos.readdirSync(diretorio);
  }

  /**
   * Traduz um tipo para o equivalente em SQL.
   * @param tipo O tipo a ser traduzido.
   * @returns O tipo traduzido em SQL.
   */
  traduzirTipo(tipo: string): string {
    switch (tipo) {
      case 'numero':
        return 'int'
      case 'texto':
        return 'varchar'
    }
  }

  /**
   * Gera o código SQL para criar uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para criar a tabela.
   */
  gerarCodigoSQLCriar(tabela: TabelaInterface): string {
    const atributosSQL = tabela.atributos.map(atributo => `${atributo.nome} ${this.traduzirTipo(atributo.tipo).toUpperCase()}`).join(', ');
    return `CREATE TABLE ${tabela.nome_tabela} (${atributosSQL});`;
  }

  /**
   * Gera o código SQL para inserir dados em uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para inserir dados na tabela.
   */
  gerarCodigoSQLInserir(tabela: TabelaInterface): string {
    return ''
  }

  /**
   * Gera o código SQL para atualizar dados em uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para atualizar dados na tabela.
   */
  gerarCodigoSQLAtualizar(tabela: TabelaInterface): string {
    return ''
  }

  /**
   * Gera o código SQL para deletar dados de uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para deletar dados da tabela.
   */
  gerarCodigoSQLDeletar(tabela: TabelaInterface): string {
    return ''
  }

  /**
   * Gera o código SQL para selecionar dados de uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para selecionar dados da tabela.
   */
  gerarCodigoSQLSelecionar(tabela: TabelaInterface): string {
    return `SELECT * FROM ${tabela.nome_tabela};`;
  }

  /**
   * Gera o código SQL para todas as operações em uma lista de tabelas.
   * @param tabelas As tabelas para as quais o código SQL será gerado.
   * @returns Uma lista de objetos contendo o nome do modelo de tabela e os códigos SQL correspondentes.
   */
  gerarSql(tabelas: TabelaInterface[]): SqlType[] {
    const sqls: SqlType[] = []

    tabelas.forEach(tabela => {
      sqls.push({
        nome_modelo: tabela.nome_tabela,
        codigo_tabela: {
          criar: this.gerarCodigoSQLCriar(tabela),
          inserir: this.gerarCodigoSQLInserir(tabela),
          atualizar: this.gerarCodigoSQLAtualizar(tabela),
          deletar: this.gerarCodigoSQLDeletar(tabela),
          selecionar: this.gerarCodigoSQLSelecionar(tabela)
        }
      })
    })

    return sqls
  }

  /**
   * Inicia o processo de geração de código SQL.
   * @returns Uma string vazia.
   */
  iniciar(): string {
    this.arquivos = this.pegaNomesModelos()

    const conteudos_arquivos: RetornoImportador<SimboloInterface, Declaracao>[] = this.arquivos.map(arquivo => {
      return this.importador.importar(`${this.diretorio_atual}/${this.caminho_modelos}/${arquivo}`)
    })

    const classes: Classe[] = conteudos_arquivos
      .map(conteudo => conteudo.retornoAvaliadorSintatico.declaracoes
        .filter(declaracao => declaracao instanceof Classe) as Classe[])
      .flat()

    const tabelas: TabelaInterface[] = []

    classes.forEach(classe => {
      const tabela: TabelaInterface = {
        nome_tabela: pluralizar(classe.simbolo.lexema),
        atributos: []
      }

      classe.propriedades.forEach(propriedade => {
        tabela.atributos.push({
          nome: propriedade.nome.lexema,
          tipo: propriedade.tipo
        })
      })

      tabelas.push(tabela)
    })

    const sqls = this.gerarSql(tabelas)

    console.log(sqls)

    return ''
  }
}

