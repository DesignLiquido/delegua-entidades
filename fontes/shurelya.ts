import { Importador } from '@designliquido/delegua-node/fontes/importador/importador'
import { Lexador } from '@designliquido/delegua/fontes/lexador'
import { AvaliadorSintatico } from '@designliquido/delegua/fontes/avaliador-sintatico'
import fs from 'fs';
import { Classe, Declaracao, PropriedadeClasse } from '@designliquido/delegua/fontes/declaracoes';
import { SimboloInterface } from '@designliquido/delegua/fontes/interfaces';
import { RetornoImportador } from '@designliquido/delegua-node/fontes/importador';
import { pluralizar } from '@designliquido/flexoes';

type Consultas = {
  criar: string,
  inserir: string,
  selecionar: string,
  atualizar: string,
  deletar: string,
}

type SqlType = {
  nome_modelo: string,
  codigo_tabela: Consultas,
}

interface TabelaInterface {
  nome_tabela: string,
  atributos: AtributoInterface[]
}

interface AtributoInterface {
  nome: string,
  tipo: string
}

export class Shurelya {
  importador: Importador
  arquivos: string[] = []
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

  pegaNomesModelos(): string[] {
    const diretorio = `${this.diretorio_atual}/${this.caminho_modelos}`;
    const nomesArquivos = fs.readdirSync(diretorio);
    return nomesArquivos;
  }

  traduzirTipo(tipo: string): string {
    switch (tipo) {
      case 'numero':
        return 'int'
      case 'texto':
        return 'varchar'
    }
   }

  gerarCodigoSQLCriar(tabela: TabelaInterface): string {
    const atributosSQL = tabela.atributos.map(atributo => `${atributo.nome} ${this.traduzirTipo(atributo.tipo).toUpperCase()}`).join(', ');
    return `CREATE TABLE ${tabela.nome_tabela} (${atributosSQL});`;
  }

  gerarCodigoSQLInserir(tabela: TabelaInterface): string { 
    return ''
  }

  gerarCodigoSQLAtualizar(tabela: TabelaInterface): string {
    return ''
  }

  gerarCodigoSQLDeletar(tabela: TabelaInterface): string {
    return ''
  }

  gerarCodigoSQLSelecionar(tabela: TabelaInterface): string {
    return `SELECT * FROM ${tabela.nome_tabela};`;
  }

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

  iniciar(): string {
    this.arquivos = this.pegaNomesModelos()

    const conteudos_arquivos: RetornoImportador<SimboloInterface, Declaracao>[] = this.arquivos.map(arquivo => {
      return this.importador.importar(`${this.diretorio_atual}/${this.caminho_modelos}/${arquivo}`)
    })

    const classes: Classe[] = conteudos_arquivos.map(conteudo => conteudo.retornoAvaliadorSintatico.declaracoes.filter(declaracao => declaracao instanceof Classe) as Classe[]).flat()

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

