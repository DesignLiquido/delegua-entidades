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
 * de detalhamento e mensagens estruturadas.
 */
export class Taquigrafo {
    nivel: NivelDetalhamentoTaquigrafia;
    funcaoLog: FuncaoTaquigrafia;

    constructor(nivel: NivelDetalhamentoTaquigrafia = 'info', funcaoLog?: FuncaoTaquigrafia) {
        this.nivel = nivel;
        this.funcaoLog = funcaoLog || ((mensagem: string, detalhes?: any) => {
            if (detalhes !== undefined) {
                console.log(mensagem, detalhes);
            } else {
                console.log(mensagem);
            }
        });
    }

    private deveLogar(nivel: NivelDetalhamentoTaquigrafia): boolean {
        return NIVEIS_PRIORIDADE_DETALHAMENTO[nivel] <= NIVEIS_PRIORIDADE_DETALHAMENTO[this.nivel];
    }

    erro(mensagem: string, detalhes?: any): void {
        if (this.deveLogar('erros')) {
            this.funcaoLog(`[ERRO] ${mensagem}`, detalhes);
        }
    }

    aviso(mensagem: string, detalhes?: any): void {
        if (this.deveLogar('avisos')) {
            this.funcaoLog(`[AVISO] ${mensagem}`, detalhes);
        }
    }

    info(mensagem: string, detalhes?: any): void {
        if (this.deveLogar('info')) {
            this.funcaoLog(`[INFO] ${mensagem}`, detalhes);
        }
    }

    depuracao(mensagem: string, detalhes?: any): void {
        if (this.deveLogar('depuracao')) {
            this.funcaoLog(`[DEPURAÇÃO] ${mensagem}`, detalhes);
        }
    }
}
