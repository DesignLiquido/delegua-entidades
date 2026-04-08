import { CampoSnapshot } from "./campo-fotografia-interface";

export interface OperacaoDelta {
    tipo: "criar_tabela" | "excluir_tabela" | "adicionar_coluna" | "remover_coluna" | "alterar_coluna";
    tabela: string;
    campo?: CampoSnapshot;
    campoAnterior?: CampoSnapshot;
    campos?: CampoSnapshot[];
    nomeCampo?: string;
}
