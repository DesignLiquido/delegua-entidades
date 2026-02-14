import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

export type FuncaoGancho = (registro: ObjetoDeleguaClasse) => void | Promise<void>;

export type EventoGancho =
    'antesDeInserir' | 'aposInserir' |
    'antesDeAtualizar' | 'aposAtualizar' |
    'antesDeExcluir' | 'aposExcluir';

export interface GanchosInterface {
    antesDeInserir: FuncaoGancho[];
    aposInserir: FuncaoGancho[];
    antesDeAtualizar: FuncaoGancho[];
    aposAtualizar: FuncaoGancho[];
    antesDeExcluir: FuncaoGancho[];
    aposExcluir: FuncaoGancho[];
}
