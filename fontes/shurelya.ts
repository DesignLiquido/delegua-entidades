import * as sistemaArquivos from 'fs';

import { Importador } from '@designliquido/delegua-node/fontes/importador/importador'
import { Lexador } from '@designliquido/delegua/fontes/lexador'
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico'
import { Classe, Declaracao } from '@designliquido/delegua/fontes/declaracoes';
import { SimboloInterface } from '@designliquido/delegua/fontes/interfaces';
import { RetornoImportador } from '@designliquido/delegua-node/fontes/importador';
import { ObjetoDeleguaClasse } from '@designliquido/delegua/fontes/estruturas/objeto-delegua-classe'
import { pluralizar } from '@designliquido/flexoes';

/**
 * Interface que representa uma tabela.
 * @interface TabelaInterface
 * @property {string} nome_tabela - O nome da tabela.
 * @property {AtributoInterface[]} atributos - Os atributos da tabela.
 */
export interface TabelaInterface {
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
  tabelas: TabelaInterface[] = []

  /**
   * Construtor da classe Shurelya.
   * @param diretorio_atual O diretório atual.
   * @param caminho_modelos O caminho dos modelos de tabelas.
   * @param tecnologia A tecnologia utilizada.
   */
  constructor(
    private readonly diretorio_atual: string,
    private readonly caminho_modelos: string,
    // TODO - Adicionar suporte a tecnologias.
    // private readonly tecnologia: string 
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
      default:
        throw new Error(`ShurelyaError: O tipo: ${tipo} não é valido.`)
    }
  }

  /**
   * Procura uma tabela pelo nome.
   * @param nome_tabela O nome da tabela a ser procurada.
   * @returns A tabela encontrada.
   * @throws {TabelaNaoEncontradaError} Se a tabela não for encontrada.
   */
  procuraTabela(nome_tabela: string): TabelaInterface { 
    const tabela = this.tabelas.find(tabela => tabela.nome_tabela === nome_tabela)
    if (!tabela) throw new TabelaNaoEncontradaError(nome_tabela)
    return tabela
  }

  pegaValoresDasPropriedades(tabela: TabelaInterface, classe: ObjetoDeleguaClasse): string { 
    return tabela.atributos.map(atributo => {
      const propriedade = Object.entries(classe.propriedades).find(([key, value]) => key === atributo.nome);
      return propriedade ? propriedade[1] : null;
    }).join(', ');
  }

  /**
   * Gera o código SQL para criar uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para criar a tabela.
   */
  gerarCodigoSQLCriar(classe: ObjetoDeleguaClasse): string {
    const tabela = this.procuraTabela(classe.classe.simboloOriginal.lexema)
    const atributosSQL = tabela.atributos.map(atributo => {
      return `${atributo.nome} ${this.traduzirTipo(atributo.tipo)}`
    }).join(', ');
    return `CREATE TABLE ${tabela.nome_tabela} (${atributosSQL});`;
  }

  /**
   * Gera o código SQL para inserir dados em uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para inserir dados na tabela.
   */
  gerarCodigoSQLInserir(classe: ObjetoDeleguaClasse): string {
    const tabela = this.procuraTabela(classe.classe.simboloOriginal.lexema)
    const atributosSQL = tabela.atributos.map(atributo => atributo.nome).join(', ');
    const valoresSQL = this.pegaValoresDasPropriedades(tabela, classe)
    return `INSERT INTO ${tabela.nome_tabela} (${atributosSQL}) VALUES (${valoresSQL});`;
  }

  /**
   * Gera o código SQL para atualizar dados em uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para atualizar dados na tabela.
   */
  gerarCodigoSQLAtualizar(classe: ObjetoDeleguaClasse): string {
    const tabela = this.procuraTabela(classe.classe.simboloOriginal.lexema);
    const atributosSQL = tabela.atributos.map(atributo => {
      const valorPropriedade = classe.propriedades[atributo.nome];
      const valorFormatado = typeof valorPropriedade === 'string' ? `'${valorPropriedade}'` : valorPropriedade;
      return `${atributo.nome} = ${valorFormatado}`;
    }).join(', ');
    const id = classe.propriedades['id']; 
    return `UPDATE ${tabela.nome_tabela} SET ${atributosSQL} WHERE id = ${id};`;
  }

  /**
   * Gera o código SQL para deletar dados de uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para deletar dados da tabela.
   */
  gerarCodigoSQLDeletar(classe: ObjetoDeleguaClasse): string {
    const tabela = this.procuraTabela(classe.classe.simboloOriginal.lexema);
    const id = classe.propriedades['id'];
    return `DELETE FROM ${tabela.nome_tabela} WHERE id = ${id};`;
  }

  /**
   * Gera o código SQL para selecionar dados de uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para selecionar dados da tabela.
   */
  gerarCodigoSQLSelecionarTodos(classe: ObjetoDeleguaClasse): string {
    const tabela = this.procuraTabela(classe.classe.simboloOriginal.lexema)
    return `SELECT * FROM ${tabela.nome_tabela};`;
  }

  /**
   * Gera o código SQL para selecionar um dado de uma tabela.
   * @param tabela A tabela para a qual o código SQL será gerado.
   * @returns O código SQL para selecionar um dado da tabela.
   */
  gerarCodigoSQLSelecionarUm(classe: ObjetoDeleguaClasse): string {
    const tabela = this.procuraTabela(classe.classe.simboloOriginal.lexema);
    const id = classe.propriedades['id'];
    return `SELECT * FROM ${tabela.nome_tabela} WHERE id = ${id};`;
  }

  /**
   * Carrega os modelos de tabelas.
   */
  iniciar(): void {
    this.arquivos = this.pegaNomesModelos()

    const conteudos_arquivos: RetornoImportador<SimboloInterface, Declaracao>[] = this.arquivos.map(arquivo => {
      return this.importador.importar(`${this.diretorio_atual}/${this.caminho_modelos}/${arquivo}`)
    })

    const classes: Classe[] = conteudos_arquivos
      .map(conteudo => conteudo.retornoAvaliadorSintatico.declaracoes
        .filter(declaracao => declaracao instanceof Classe) as Classe[])
      .flat()

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

      this.tabelas.push(tabela)
    })

  }
}

