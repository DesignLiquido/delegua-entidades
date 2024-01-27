
import { Shurelya } from '../fontes/shurelya';
import fs from 'node:fs';

describe('Shurelya', () => {
  let shurelya: Shurelya;

  beforeEach(() => {
    shurelya = new Shurelya(process.cwd(), 'dados', 'tecnologia')
  });

  describe('pegaNomesModelos', () => {
    it('Esperado que retorno um array de nomes dos arquivo', () => {
      const expected = fs.readdirSync(`${process.cwd()}/dados`);
      const actual = shurelya.pegaNomesModelos();
      expect(actual).toEqual(expected);
    });

    it('Esperado que retorne um array vazio', () => {
      const expected = [];
      const actual = new Shurelya(process.cwd(), 'dados/nenhum_modelo', 'tecnologia').pegaNomesModelos();
      expect(actual).toEqual(expected);
    });
  });
});