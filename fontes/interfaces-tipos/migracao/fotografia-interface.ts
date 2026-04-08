import { ModeloSnapshot } from "./modelo-fotografia-interface";

export interface Snapshot {
    timestamp: string;
    modelos: { [nomeClasse: string]: ModeloSnapshot };
}
