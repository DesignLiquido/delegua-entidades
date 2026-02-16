import { Coluna } from "@designliquido/lincones-js";

export interface OperacaoMigracao {
    tipo: 'criarTabela' | 'excluirTabela' | 'adicionarColuna' | 'removerColuna' | 'alterarColuna' | 'adicionarIndice' | 'removerIndice' | 'adicionarRestricao' | 'removerRestricao';
    tabela: string;
    coluna?: Coluna;
    colunas?: Coluna[];
    nomeColuna?: string;
    nomeIndice?: string;
    nomeRestricao?: string;
    tipoIndice?: 'BTREE' | 'HASH' | 'GIST' | 'GIN';
    columnasIndice?: string[];
    unico?: boolean;
    sqlRestricao?: string;
}

export class Migracao {
    versao: string;
    descricao: string;
    operacoes: OperacaoMigracao[];

    constructor(versao: string, descricao: string) {
        this.versao = versao;
        this.descricao = descricao;
        this.operacoes = [];
    }

    criarTabela(nome: string, colunas: Coluna[]): Migracao {
        this.operacoes.push({ tipo: 'criarTabela', tabela: nome, colunas });
        return this;
    }

    excluirTabela(nome: string): Migracao {
        this.operacoes.push({ tipo: 'excluirTabela', tabela: nome });
        return this;
    }

    adicionarColuna(tabela: string, coluna: Coluna): Migracao {
        this.operacoes.push({ tipo: 'adicionarColuna', tabela, coluna });
        return this;
    }

    removerColuna(tabela: string, nomeColuna: string): Migracao {
        this.operacoes.push({ tipo: 'removerColuna', tabela, nomeColuna });
        return this;
    }

    alterarColuna(tabela: string, coluna: Coluna): Migracao {
        this.operacoes.push({ tipo: 'alterarColuna', tabela, coluna });
        return this;
    }

    adicionarIndice(tabela: string, nomeIndice: string, colunas: string[], eUnico: boolean = false, tipo?: 'BTREE' | 'HASH' | 'GIST' | 'GIN'): Migracao {
        this.operacoes.push({ 
            tipo: 'adicionarIndice', 
            tabela, 
            nomeIndice, 
            columnasIndice: colunas, 
            unico: eUnico,
            tipoIndice: tipo
        });
        return this;
    }

    removerIndice(tabela: string, nomeIndice: string): Migracao {
        this.operacoes.push({ tipo: 'removerIndice', tabela, nomeIndice });
        return this;
    }

    adicionarRestricao(tabela: string, nomeRestricao: string, sql: string): Migracao {
        this.operacoes.push({ tipo: 'adicionarRestricao', tabela, nomeRestricao, sqlRestricao: sql });
        return this;
    }

    removerRestricao(tabela: string, nomeRestricao: string): Migracao {
        this.operacoes.push({ tipo: 'removerRestricao', tabela, nomeRestricao });
        return this;
    }
}
