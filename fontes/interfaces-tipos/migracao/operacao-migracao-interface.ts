import { Coluna } from "@designliquido/lincones-js";

export interface OperacaoMigracao {
    tipo: 'criarTabela' | 'excluirTabela' | 'adicionarColuna' | 'removerColuna' | 'alterarColuna' | 'adicionarIndice' | 'removerIndice' | 'adicionarRestricao' | 'removerRestricao' | 'adicionarColunaComputada';
    tabela: string;
    coluna?: Coluna;
    colunaAnterior?: Coluna;
    colunas?: Coluna[];
    nomeColuna?: string;
    tipoColuna?: string;
    expressaoColuna?: string;
    persistida?: boolean;
    nomeIndice?: string;
    nomeRestricao?: string;
    tipoIndice?: 'BTREE' | 'HASH' | 'GIST' | 'GIN';
    columnasIndice?: string[];
    unico?: boolean;
    sqlRestricao?: string;
}
