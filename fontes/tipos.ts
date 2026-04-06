export type NivelDetalhamentoTaquigrafia = 'desligado' | 'erros' | 'avisos' | 'info' | 'depuracao';

export type FuncaoTaquigrafia = (mensagem: string, detalhes?: any) => void;