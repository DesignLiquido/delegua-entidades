import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EstadoEntidade } from "./tipos";

export interface RegistroRastreado {
    registro: ObjetoDeleguaClasse;
    estado: EstadoEntidade;
    nomeEntidade: string;
    valoresOriginais: { [campo: string]: any };
    camposAlterados: string[];
}
