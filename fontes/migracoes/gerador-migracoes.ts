import { Coluna } from "@designliquido/lincones-js";

import { EntidadeInterface } from "../interfaces-tipos/entidade-interface";
import { Migracao } from "./migracao";

export interface SchemaInfo {
    nomeTabela: string;
    colunas: { nome: string; tipo: string }[];
}

const MAPEAMENTO_TIPOS: { [tipo: string]: string } = {
    'número': 'INTEIRO',
    'texto': 'TEXTO',
    'lógico': 'LOGICO',
    'decimal': 'NUMERO',
};

export class GeradorMigracoes {
    static gerar(
        entidades: EntidadeInterface[],
        schemaAtual: SchemaInfo[],
        versao: string = '001',
        descricao: string = 'Migração automática'
    ): Migracao {
        const migracao = new Migracao(versao, descricao);
        const schemasMap = new Map<string, SchemaInfo>();

        for (const schema of schemaAtual) {
            schemasMap.set(schema.nomeTabela, schema);
        }

        for (const entidade of entidades) {
            const nomeTabela = entidade.obterNome();
            const schemaExistente = schemasMap.get(nomeTabela);

            if (!schemaExistente) {
                const colunas = GeradorMigracoes.gerarColunasParaEntidade(entidade);
                migracao.criarTabela(nomeTabela, colunas);
            } else {
                GeradorMigracoes.compararEGerarAlteracoes(
                    entidade, schemaExistente, migracao
                );
                schemasMap.delete(nomeTabela);
            }
        }

        for (const [nomeTabela] of schemasMap) {
            migracao.excluirTabela(nomeTabela);
        }

        return migracao;
    }

    private static gerarColunasParaEntidade(entidade: EntidadeInterface): Coluna[] {
        const colunas: Coluna[] = [];
        const chavePrimaria = entidade.obterNomeChavePrimaria();

        for (const propriedade of entidade.modelo.propriedades) {
            const nome = propriedade.nome.lexema;
            const tipo = MAPEAMENTO_TIPOS[propriedade.tipo] || 'TEXTO';
            const ehChavePrimaria = nome === chavePrimaria;
            colunas.push(new Coluna(nome, tipo, undefined, !ehChavePrimaria, ehChavePrimaria, false, ehChavePrimaria));
        }

        return colunas;
    }

    private static compararEGerarAlteracoes(
        entidade: EntidadeInterface,
        schemaExistente: SchemaInfo,
        migracao: Migracao
    ): void {
        const colunasExistentes = new Map<string, { nome: string; tipo: string }>();
        for (const col of schemaExistente.colunas) {
            colunasExistentes.set(col.nome, col);
        }

        const nomesColunasEntidade = new Set<string>();

        for (const propriedade of entidade.modelo.propriedades) {
            const nome = propriedade.nome.lexema;
            nomesColunasEntidade.add(nome);
            const tipoEsperado = MAPEAMENTO_TIPOS[propriedade.tipo] || 'TEXTO';
            const colunaExistente = colunasExistentes.get(nome);

            if (!colunaExistente) {
                migracao.adicionarColuna(
                    schemaExistente.nomeTabela,
                    new Coluna(nome, tipoEsperado, undefined, true, false, false, false)
                );
            } else if (colunaExistente.tipo !== tipoEsperado) {
                migracao.alterarColuna(
                    schemaExistente.nomeTabela,
                    new Coluna(nome, tipoEsperado)
                );
            }
        }

        for (const [nomeColuna] of colunasExistentes) {
            if (!nomesColunasEntidade.has(nomeColuna)) {
                migracao.removerColuna(schemaExistente.nomeTabela, nomeColuna);
            }
        }
    }
}
