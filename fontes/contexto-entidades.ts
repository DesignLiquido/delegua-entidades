import { EntidadeInterface } from "./interfaces/entidade-interface";

/**
 * O contexto de entidades é usado para manter todas as entidades e seus relacionamentos
 * em um só lugar.
 */
export class ContextoEntidades {
    entidades: EntidadeInterface[];
}