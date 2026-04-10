import { Coluna } from "@designliquido/lincones-js";

import { OperacaoMigracao } from "../interfaces-tipos/migracao";

/**
 * Implementação de classe estrangeira `Migracao`, conforme definição em definicoes\migracao.delegua.
 * Essa classe é projetada para ser utilizada em processos de migração de banco de dados, permitindo 
 * a definição de operações como criação e exclusão de tabelas, adição e remoção de colunas, 
 * índices e restrições. 
 * 
 * Cada instância da classe `Migracao` representa uma versão específica da migração, com uma 
 * descrição e um conjunto de operações a serem executadas. As operações são armazenadas em um 
 * array, permitindo a construção fluida de migrações complexas.
 */
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

    excluirTabela(nome: string, colunas?: Coluna[]): Migracao {
        this.operacoes.push({ tipo: 'excluirTabela', tabela: nome, colunas });
        return this;
    }

    adicionarColuna(tabela: string, coluna: Coluna): Migracao {
        this.operacoes.push({ tipo: 'adicionarColuna', tabela, coluna });
        return this;
    }

    removerColuna(tabela: string, nomeColuna: string, colunaAnterior?: Coluna): Migracao {
        this.operacoes.push({ tipo: 'removerColuna', tabela, nomeColuna, colunaAnterior });
        return this;
    }

    alterarColuna(tabela: string, coluna: Coluna, colunaAnterior?: Coluna): Migracao {
        this.operacoes.push({ tipo: 'alterarColuna', tabela, coluna, colunaAnterior });
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

    adicionarColunaComputada(
        tabela: string,
        nomeColuna: string,
        tipoColuna: string,
        expressaoColuna: string,
        persistida?: boolean
    ): Migracao {
        this.operacoes.push({
            tipo: 'adicionarColunaComputada',
            tabela,
            nomeColuna,
            tipoColuna,
            expressaoColuna,
            persistida
        });
        return this;
    }

    removerRestricao(tabela: string, nomeRestricao: string): Migracao {
        this.operacoes.push({ tipo: 'removerRestricao', tabela, nomeRestricao });
        return this;
    }
}
