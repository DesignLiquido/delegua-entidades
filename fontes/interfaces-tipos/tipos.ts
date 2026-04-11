import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

export type ColecaoDelegua = {
    todos: () => Promise<ObjetoDeleguaClasse[]>,
    buscarTodos: () => Promise<ObjetoDeleguaClasse[]>,
    obterPorId: (valorId: any) => Promise<ObjetoDeleguaClasse | null>,
    buscarPorId: (valorId: any) => Promise<ObjetoDeleguaClasse | null>,
    salvar: (registro: ObjetoDeleguaClasse) => Promise<any>,
    modificar: (registro: ObjetoDeleguaClasse, colunas?: string[]) => Promise<any>,
    remover: (registro: ObjetoDeleguaClasse) => Promise<any>,
    inserirVarios: (registros: ObjetoDeleguaClasse[]) => Promise<any>,
    consulta: () => any,
};

export type EstadoEntidade = 'novo' | 'modificado' | 'excluido' | 'inalterado';
export type FuncaoTaquigrafia = (mensagem: string, detalhes?: any) => void;
export type NivelDetalhamentoTaquigrafia = 'desligado' | 'erros' | 'avisos' | 'info' | 'depuracao';

