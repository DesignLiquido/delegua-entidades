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
    'booleano': 'LOGICO',
    'decimal': 'NUMERO',
    'real': 'NUMERO',
    'flutuante': 'NUMERO',
    'data': 'DATA',
    'dataHora': 'DATA_HORA',
    'horario': 'HORARIO',
    'tempo': 'HORARIO',
    'json': 'JSON',
    'objeto': 'JSON',
    'uuid': 'TEXTO', // UUID será armazenado como texto
    'binario': 'BLOB',
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
                
                // Adicionar índices
                for (const indice of entidade.obterIndices()) {
                    migracao.adicionarIndice(nomeTabela, indice.nome, indice.colunas, indice.unico, indice.tipo);
                }
                
                // Adicionar restrições
                for (const restricao of entidade.obterRestricoes()) {
                    migracao.adicionarRestricao(nomeTabela, restricao.nome, restricao.sql);
                }

                // Adicionar colunas computadas
                for (const computada of entidade.obterColunasComputadas()) {
                    migracao.adicionarColunaComputada(
                        nomeTabela,
                        computada.nome,
                        computada.tipo,
                        computada.expressao,
                        computada.persistida
                    );
                }
            } else {
                GeradorMigracoes.compararEGerarAlteracoes(
                    entidade, schemaExistente, migracao
                );
                schemasMap.delete(nomeTabela);
            }
        }

        for (const [nomeTabela, schema] of schemasMap) {
            const colunas = schema.colunas.map((coluna) => new Coluna(coluna.nome, coluna.tipo));
            migracao.excluirTabela(nomeTabela, colunas);
        }

        return migracao;
    }

    private static gerarColunasParaEntidade(entidade: EntidadeInterface): Coluna[] {
        const colunas: Coluna[] = [];
        const chavePrimaria = entidade.obterNomeChavePrimaria();
        const nomesComputadas = new Set(entidade.obterColunasComputadas().map((c) => c.nome));

        for (const propriedade of entidade.modelo.propriedades) {
            const nome = propriedade.nome.lexema;
            if (nomesComputadas.has(nome)) {
                continue;
            }
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
                const colunaAnterior = new Coluna(nome, colunaExistente.tipo);
                migracao.alterarColuna(
                    schemaExistente.nomeTabela,
                    new Coluna(nome, tipoEsperado),
                    colunaAnterior
                );
            }
        }

        for (const computada of entidade.obterColunasComputadas()) {
            if (!colunasExistentes.has(computada.nome)) {
                migracao.adicionarColunaComputada(
                    schemaExistente.nomeTabela,
                    computada.nome,
                    computada.tipo,
                    computada.expressao,
                    computada.persistida
                );
            }
        }

        for (const [nomeColuna, colunaExistente] of colunasExistentes) {
            if (!nomesColunasEntidade.has(nomeColuna)) {
                const colunaAnterior = new Coluna(nomeColuna, colunaExistente.tipo);
                migracao.removerColuna(schemaExistente.nomeTabela, nomeColuna, colunaAnterior);
            }
        }
    }
}
