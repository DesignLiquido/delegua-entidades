import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";
import { RetornoComandoInterface } from "@designliquido/lincones-js/interfaces/retorno-comando-interface";

/**
 * Implementação mock de TecnologiaLinconesInterface para testes.
 * Armazena dados em memória e rastreia comandos executados.
 */
export class TecnologiaMock implements TecnologiaLinconesInterface {
    iniciada: boolean = false;
    comandosExecutados: any[] = [];
    dadosEmMemoria: { [tabela: string]: any[] } = {};

    async iniciar(_caminho: string): Promise<void> {
        this.iniciada = true;
    }

    async executar(_: any, _sentencaLincones: string, _parametros: any[]): Promise<RetornoComandoInterface[]> {
        return [{
            linhasAfetadas: 0,
            ultimoId: null,
            linhasRetornadas: [],
            comandoExecutado: _sentencaLincones,
            mensagemExecucao: "OK"
        }];
    }

    async executarComando(comando: any): Promise<RetornoComandoInterface[]> {
        this.comandosExecutados.push(comando);
        const nomeClasse = comando.constructor.name;

        if (nomeClasse === 'Criar') {
            this.dadosEmMemoria[comando.nomeEntidade] = [];
            return [{
                linhasAfetadas: 0,
                ultimoId: null,
                linhasRetornadas: [],
                comandoExecutado: `CREATE TABLE ${comando.nomeEntidade}`,
                mensagemExecucao: "OK"
            }];
        }

        if (nomeClasse === 'Inserir') {
            const registro: any = {};
            for (let i = 0; i < comando.colunas.length; i++) {
                const coluna = comando.colunas[i];
                const valor = comando.valores[i];
                registro[coluna] = valor?.valor !== undefined ? valor.valor : valor;
            }
            if (!this.dadosEmMemoria[comando.tabela]) {
                this.dadosEmMemoria[comando.tabela] = [];
            }
            this.dadosEmMemoria[comando.tabela].push(registro);
            return [{
                linhasAfetadas: 1,
                ultimoId: registro.id || null,
                linhasRetornadas: [],
                comandoExecutado: `INSERT INTO ${comando.tabela}`,
                mensagemExecucao: "OK"
            }];
        }

        if (nomeClasse === 'Selecionar') {
            const dados = this.dadosEmMemoria[comando.tabela] || [];
            let resultados = [...dados];

            if (comando.condicoes && comando.condicoes.length > 0) {
                for (const condicao of comando.condicoes) {
                    const coluna = condicao.esquerda?.nomeColuna;
                    const valor = condicao.direita?.valor;
                    if (coluna && valor !== undefined) {
                        resultados = resultados.filter((r: any) => r[coluna] === valor);
                    }
                }
            }

            return [{
                linhasAfetadas: 0,
                ultimoId: null,
                linhasRetornadas: resultados,
                comandoExecutado: `SELECT FROM ${comando.tabela}`,
                mensagemExecucao: "OK"
            }];
        }

        if (nomeClasse === 'Atualizar') {
            const dados = this.dadosEmMemoria[comando.tabela] || [];
            let atualizados = 0;

            for (const condicao of (comando.condicoes || [])) {
                const coluna = condicao.esquerda?.nomeColuna;
                const valor = condicao.direita?.valor;
                for (const registro of dados) {
                    if (registro[coluna] === valor) {
                        for (const cv of comando.colunasEValores) {
                            registro[cv.coluna.nomeColuna] = cv.valor.valor;
                        }
                        atualizados++;
                    }
                }
            }

            return [{
                linhasAfetadas: atualizados,
                ultimoId: null,
                linhasRetornadas: [],
                comandoExecutado: `UPDATE ${comando.tabela}`,
                mensagemExecucao: "OK"
            }];
        }

        if (nomeClasse === 'Excluir') {
            const dados = this.dadosEmMemoria[comando.tabela] || [];
            let excluidos = 0;

            for (const condicao of (comando.condicoes || [])) {
                const coluna = condicao.esquerda?.nomeColuna;
                const valor = condicao.direita?.valor;
                const antes = dados.length;
                this.dadosEmMemoria[comando.tabela] = dados.filter((r: any) => r[coluna] !== valor);
                excluidos += antes - this.dadosEmMemoria[comando.tabela].length;
            }

            return [{
                linhasAfetadas: excluidos,
                ultimoId: null,
                linhasRetornadas: [],
                comandoExecutado: `DELETE FROM ${comando.tabela}`,
                mensagemExecucao: "OK"
            }];
        }

        return [{
            linhasAfetadas: 0,
            ultimoId: null,
            linhasRetornadas: [],
            comandoExecutado: "UNKNOWN",
            mensagemExecucao: "OK"
        }];
    }
}
