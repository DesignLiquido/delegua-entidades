
import * as sistemaArquivos from 'fs';

import { Shurelya } from '../fontes/shurelya';

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
});