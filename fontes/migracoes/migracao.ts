import { Coluna } from "@designliquido/lincones-js";

export interface OperacaoMigracao {
    tipo: 'criarTabela' | 'excluirTabela' | 'adicionarColuna' | 'removerColuna' | 'alterarColuna';
    tabela: string;
    coluna?: Coluna;
    colunas?: Coluna[];
    nomeColuna?: string;
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
}
