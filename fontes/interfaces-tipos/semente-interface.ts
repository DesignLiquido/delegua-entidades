import { ContextoEntidades } from "../contexto-entidades";

export interface SementeInterface {
    nome?: string;
    dependencias?: string[];
    executar(contexto: ContextoEntidades): Promise<void>;
}
