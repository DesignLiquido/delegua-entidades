import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";
import { RetornoComandoInterface } from "@designliquido/lincones-js/interfaces/retorno-comando-interface";

/**
 * Implementação de boneco (_mock_) de `TecnologiaLinconesInterface` para testes.
 * Armazena dados em memória e rastreia comandos executados.
 */
export class BonecoTecnologia implements TecnologiaLinconesInterface {
    iniciada: boolean = false;
    comandosExecutados: any[] = [];
    dadosEmMemoria: { [tabela: string]: any[] } = {};

    async iniciar(_caminho: string): Promise<void> {
        this.iniciada = true;
    }

    async executar(_: any, _sentencaLincones: string, _parametros: any[]): Promise<RetornoComandoInterface[]> {
        this.comandosExecutados.push(_sentencaLincones);
        
        // Parse basic SELECT queries for eager loading
        if (_sentencaLincones.includes('SELECT')) {
            const matchTable = _sentencaLincones.match(/FROM\s+(\w+)/i);
            if (matchTable) {
                const tabela = matchTable[1];
                const dados = this.dadosEmMemoria[tabela] || [];
                let resultados = [...dados];

                // Parse WHERE conditions with OR
                if (_sentencaLincones.includes('WHERE')) {
                    const whereMatch = _sentencaLincones.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
                    if (whereMatch) {
                        const whereClause = whereMatch[1].trim();
                        // Simple OR parsing for IN-like queries
                        const orConditions = whereClause.split(/\s+OR\s+/i);
                        const matchedRecords = [];
                        
                        for (const condition of orConditions) {
                            const condMatch = condition.match(/(\w+)\s*=\s*('?[\w]+'?)/);
                            if (condMatch) {
                                const coluna = condMatch[1];
                                let valor: any = condMatch[2];
                                if (valor.startsWith("'") && valor.endsWith("'")) {
                                    valor = valor.slice(1, -1);
                                } else {
                                    valor = parseInt(valor, 10);
                                }
                                matchedRecords.push(...dados.filter((r: any) => r[coluna] === valor));
                            }
                        }
                        resultados = matchedRecords;
                    }
                }

                return [{
                    linhasAfetadas: 0,
                    ultimoId: null,
                    linhasRetornadas: resultados,
                    comandoExecutado: _sentencaLincones,
                    mensagemExecucao: "OK"
                }];
            }
        }

        // Parse basic DELETE queries for cascade
        if (_sentencaLincones.includes('DELETE')) {
            const matchTable = _sentencaLincones.match(/FROM\s+(\w+)/i);
            if (matchTable) {
                const tabela = matchTable[1];
                const dados = this.dadosEmMemoria[tabela] || [];
                let excluidos = 0;

                if (_sentencaLincones.includes('WHERE')) {
                    const whereMatch = _sentencaLincones.match(/WHERE\s+(\w+)\s*=\s*('?[\w]+'?)/i);
                    if (whereMatch) {
                        const coluna = whereMatch[1];
                        let valor: any = whereMatch[2];
                        if (valor.startsWith("'") && valor.endsWith("'")) {
                            valor = valor.slice(1, -1);
                        } else {
                            valor = parseInt(valor, 10);
                        }
                        const antes = dados.length;
                        this.dadosEmMemoria[tabela] = dados.filter((r: any) => r[coluna] !== valor);
                        excluidos = antes - this.dadosEmMemoria[tabela].length;
                    }
                }

                return [{
                    linhasAfetadas: excluidos,
                    ultimoId: null,
                    linhasRetornadas: [],
                    comandoExecutado: _sentencaLincones,
                    mensagemExecucao: "OK"
                }];
            }
        }

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
