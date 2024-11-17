import { DescritorTipoClasse } from "@designliquido/delegua/estruturas";

export interface EntidadeInterface {
    modelo: DescritorTipoClasse;
    obterNome(): string;
}
