import * as sistemaArquivos from 'fs';

import { Entidades, TabelaInterface } from '../fontes/entidades';
import { ObjetoDeleguaClasse, DeleguaClasse } from '@designliquido/delegua/estruturas'
import { Classe, PropriedadeClasse } from '@designliquido/delegua/declaracoes';
import { SimboloInterface } from '@designliquido/delegua/interfaces';

describe('Entidades', () => {
  let entidades: Entidades;
  let classe: ObjetoDeleguaClasse;

  beforeEach(() => {
    entidades = new Entidades(process.cwd(), 'dados')
    entidades.iniciar()

    let propriedadeClasse = new PropriedadeClasse({
      hashArquivo: -1,
      lexema: 'nome',
      linha: -1,
      literal: 'nome',
      tipo: 'nome',
    } as SimboloInterface, 'texto')
    let deleguaclass = new DeleguaClasse({
      hashArquivo: -1,
      lexema: 'Usuarios',
      linha: -1,
      literal: 'Usuarios',
      tipo: 'classe',
    } as SimboloInterface, null, {}, [propriedadeClasse])
    classe = new ObjetoDeleguaClasse(deleguaclass)
    classe.definir({
      hashArquivo: -1,
      lexema: 'nome',
      linha: -1,
      literal: 'nome',
      tipo: 'nome',
    } as SimboloInterface, 'italo')
  });

  describe('pegaNomesModelos', () => {
    it('Esperado que retorno um array de nomes dos arquivo', () => {
      const expected = sistemaArquivos.readdirSync(`${process.cwd()}/dados`);
      const actual = entidades.pegaNomesModelos();
      expect(actual).toEqual(expected);
    });

    it('Esperado que retorne um array vazio', () => {
      const expected = [];
      const actual = new Entidades(process.cwd(), 'dados/nenhum_modelo').pegaNomesModelos();
      expect(actual).toEqual(expected);
    });
  });

  describe('traduzirTipo', () => {
    it('Esperado que retorne o valor int para numero', () => {
      const resultado = entidades.traduzirTipo('numero')
      expect(resultado).toBe('int')
    })

    it('Esperado que retorne o valor varchar para texto', () => {
      const resultado = entidades.traduzirTipo('texto')
      expect(resultado).toBe('varchar')
    })

    it('Esperado que retorne um erro para valores não válidos.', () => {
      expect(() => entidades.traduzirTipo('invalido')).toThrow()
    })
  })

  it('Esperado que retorne um erro para tabela não encontrada.', () => { 
    expect(() => entidades.procuraTabela('tabela_invalida')).toThrow()
  })

  it('Esperado que retorne a tabela encontrada.', () => {
    const tabela: TabelaInterface = entidades.procuraTabela('Usuarios')
    expect(tabela).toBeTruthy()
  })

  it('Esperado que retorne a query de criação da tabela.', () => { 
    const resultado = entidades.gerarCodigoSQLCriar(classe)
    const esperado = 'CREATE TABLE Usuarios (id int, nome varchar);'
    expect(resultado).toBe(esperado)
  })

  it.skip('Esperado que retorne a query de inserção de dados na tabela.', () => {
    const resultado = entidades.gerarCodigoSQLInserir(classe)
    const esperado = 'INSERT INTO Usuarios (id, nome) VALUES (?, ?);'
    expect(resultado).toBe(esperado)
  })

  it.skip('Esperado que retorne a query de alteração dos dados na tabela.', () => {
    const resultado = entidades.gerarCodigoSQLAtualizar(classe)
    const esperado = 'UPDATE Usuarios SET nome = ? WHERE id = ?;'
    expect(resultado).toBe(esperado)
  })
  
  it.skip('Esperado que retorne a query de exclusão dos dados na tabela.', () => { 
    const resultado = entidades.gerarCodigoSQLDeletar(classe)
    const esperado = 'DELETE FROM Usuarios WHERE id = ?;'
    expect(resultado).toBe(esperado)
  })

  it('Esperado que retorne a query de seleção dos dados na tabela.', () => { 
    const resultado = entidades.gerarCodigoSQLSelecionarTodos(classe)
    const esperado = 'SELECT * FROM Usuarios;'
    expect(resultado).toBe(esperado)
  })

  it.skip('Esperado que retorne a query de seleção de um dado na tabela.', () => { 
    const resultado = entidades.gerarCodigoSQLSelecionarUm(classe)
    const esperado = 'SELECT * FROM Usuarios WHERE id = ?;'
    expect(resultado).toBe(esperado)
  })

  it('Esperado que retorne um erro para classe não encontrada.', () => {
    expect(() => entidades.gerarCodigoSQLCriar(new ObjetoDeleguaClasse(new DeleguaClasse()))).toThrow()
  })

  it('Esperado que retorne um erro para classe não encontrada.', () => {
    expect(() => entidades.gerarCodigoSQLInserir(new ObjetoDeleguaClasse(new DeleguaClasse()))).toThrow()
  })

  it('Esperado que retorne um erro para classe não encontrada.', () => {
    expect(() => entidades.gerarCodigoSQLAtualizar(new ObjetoDeleguaClasse(new DeleguaClasse()))).toThrow()
  })

  it('Esperado que retorne um erro para classe não encontrada.', () => {
    expect(() => entidades.gerarCodigoSQLDeletar(new ObjetoDeleguaClasse(new DeleguaClasse()))).toThrow()
  })

  it('Esperado que retorne um erro para classe não encontrada.', () => {
    expect(() => entidades.gerarCodigoSQLSelecionarTodos(new ObjetoDeleguaClasse(new DeleguaClasse()))).toThrow()
  })

  it('Esperado que retorne um erro para classe não encontrada.', () => {
    expect(() => entidades.gerarCodigoSQLSelecionarUm(new ObjetoDeleguaClasse(new DeleguaClasse()))).toThrow()
  })
});