
import * as sistemaArquivos from 'fs';

import { Shurelya, TabelaInterface } from '../fontes/shurelya';

describe('Shurelya', () => {
  let shurelya: Shurelya;

  beforeEach(() => {
    shurelya = new Shurelya(process.cwd(), 'dados', 'tecnologia')
  });

  describe('pegaNomesModelos', () => {
    it('Esperado que retorno um array de nomes dos arquivo', () => {
      const expected = sistemaArquivos.readdirSync(`${process.cwd()}/dados`);
      const actual = shurelya.pegaNomesModelos();
      expect(actual).toEqual(expected);
    });

    it('Esperado que retorne um array vazio', () => {
      const expected = [];
      const actual = new Shurelya(process.cwd(), 'dados/nenhum_modelo', 'tecnologia').pegaNomesModelos();
      expect(actual).toEqual(expected);
    });
  });

  describe('traduzirTipo', () => {
    it('Esperado que retorne o valor int para numero', () => {
      const resultado = shurelya.traduzirTipo('numero')
      expect(resultado).toBe('int')
    })

    it('Esperado que retorne o valor varchar para texto', () => {
      const resultado = shurelya.traduzirTipo('texto')
      expect(resultado).toBe('varchar')
    })

    it('Esperado que retorne um erro para valores não válidos.', () => {
      expect(() => shurelya.traduzirTipo('invalido')).toThrow()
    })
  })

  describe('gerarCodigoSQLCriar', () => {
    it('Esperado que retorne o código SQL para criar uma tabela.', () => {
      const tabela: TabelaInterface = {
        nome_tabela: 'users',
        atributos: [
          { nome: 'id', tipo: 'numero' },
          { nome: 'nome', tipo: 'texto' },
        ]
      }
      const resultado = shurelya.gerarCodigoSQLCriar(tabela)
      expect(resultado).toBe('CREATE TABLE users (id INT, nome VARCHAR);')
    })
  })

  describe('gerarCodigoSQLSelecionar', () => {
    it('Esperado que retorne o código SQL para selecionar dados de uma tabela.', () => {
      const tabela: TabelaInterface = {
        nome_tabela: 'users',
        atributos: [
          { nome: 'id', tipo: 'numero' },
          { nome: 'nome', tipo: 'texto' },
        ]
      }
      const resultado = shurelya.gerarCodigoSQLSelecionar(tabela)
      expect(resultado).toBe('SELECT * FROM users;')
    })
  })
});