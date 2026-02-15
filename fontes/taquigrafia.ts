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
    funcaoTaquigrafia: FuncaoTaquigrafia;

    constructor(nivel: NivelDetalhamentoTaquigrafia = 'info', funcaoTaquigrafia?: FuncaoTaquigrafia) {
        this.nivel = nivel;
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
}
