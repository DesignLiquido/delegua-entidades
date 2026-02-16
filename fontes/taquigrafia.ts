import { DetectorConsultasN1, type AnaliseN1 } from './detector-n-mais-um';

export type NivelDetalhamentoTaquigrafia = 'desligado' | 'erros' | 'avisos' | 'info' | 'depuracao';

export type FuncaoTaquigrafia = (mensagem: string, detalhes?: any) => void;

const NIVEIS_PRIORIDADE_DETALHAMENTO: { [key: string]: number } = {
    'desligado': 0,
    'erros': 1,
    'avisos': 2,
    'info': 3,
    'depuracao': 4
};

/**
 * Taquígrafo, conhecido em inglês como _"shorthand logger"_, é um serviço simples 
 * e eficiente para a anotação de diferentes operações, com suporte a níveis 
 * de detalhamento e mensagens estruturadas. Inclui detecção de padrão N+1.
 */
export class Taquigrafo {
    nivel: NivelDetalhamentoTaquigrafia;
    funcaoTaquigrafia: FuncaoTaquigrafia;
    private detectorN1: DetectorConsultasN1;
    private habilitarDeteccaoN1: boolean = true;

    constructor(nivel: NivelDetalhamentoTaquigrafia = 'info', funcaoTaquigrafia?: FuncaoTaquigrafia) {
        this.nivel = nivel;
        this.detectorN1 = new DetectorConsultasN1();
        this.funcaoTaquigrafia = funcaoTaquigrafia || ((mensagem: string, detalhes?: any) => {
            if (detalhes !== undefined) {
                console.log(mensagem, detalhes);
            } else {
                console.log(mensagem);
            }
        });
    }

    private deveRegistrarOperacao(nivel: NivelDetalhamentoTaquigrafia): boolean {
        return NIVEIS_PRIORIDADE_DETALHAMENTO[nivel] <= NIVEIS_PRIORIDADE_DETALHAMENTO[this.nivel];
    }

    erro(mensagem: string, detalhes?: any): void {
        if (this.deveRegistrarOperacao('erros')) {
            this.funcaoTaquigrafia(`[ERRO] ${mensagem}`, detalhes);
        }
    }

    aviso(mensagem: string, detalhes?: any): void {
        if (this.deveRegistrarOperacao('avisos')) {
            this.funcaoTaquigrafia(`[AVISO] ${mensagem}`, detalhes);
        }
    }

    info(mensagem: string, detalhes?: any): void {
        if (this.deveRegistrarOperacao('info')) {
            this.funcaoTaquigrafia(`[INFO] ${mensagem}`, detalhes);
        }
    }

    depuracao(mensagem: string, detalhes?: any): void {
        if (this.deveRegistrarOperacao('depuracao')) {
            this.funcaoTaquigrafia(`[DEPURAÇÃO] ${mensagem}`, detalhes);
        }
    }

    /**
     * Registra uma consulta executada para análise de N+1.
     */
    registrarConsulta(sql: string, quantidadeRegistros: number, tempoExecucao: number = 0, nomeEntidade?: string): void {
        if (this.habilitarDeteccaoN1) {
            this.detectorN1.registrarConsulta(sql, quantidadeRegistros, tempoExecucao, nomeEntidade);
        }
    }

    /**
     * Analisa consultas para detectar padrão N+1.
     */
    analisarN1(): AnaliseN1 {
        if (!this.habilitarDeteccaoN1) {
            return { detectado: false };
        }

        const analise = this.detectorN1.analisar();

        // Se detectado N+1, emitir aviso
        if (analise.detectado && analise.sugestao) {
            this.aviso('Padrão N+1 detectado!', analise);
        }

        return analise;
    }

    /**
     * Habilita ou desabilita a detecção de N+1.
     */
    definirDeteccaoN1Habilitada(habilitada: boolean): void {
        this.habilitarDeteccaoN1 = habilitada;
    }

    /**
     * Retorna o detector de N+1 para acesso direto.
     */
    obterDetectorN1(): DetectorConsultasN1 {
        return this.detectorN1;
    }

    /**
     * Limpa o histórico de consultas rastreadas.
     */
    limparConsultas(): void {
        this.detectorN1.limpar();
    }
}
