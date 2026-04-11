import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { RegistroRastreadoInterface } from "./interfaces-tipos";
import { EstadoEntidade } from "./interfaces-tipos/tipos";

export class RastreadorMudancas {
    private registros: Map<string, RegistroRastreadoInterface>;

    constructor() {
        this.registros = new Map();
    }

    private obterChave(nomeEntidade: string, registro: ObjetoDeleguaClasse): string {
        const id = registro.propriedades['id'] ?? Object.values(registro.propriedades)[0];
        return `${nomeEntidade}:${id}`;
    }

    rastrear(registro: ObjetoDeleguaClasse, nomeEntidade: string, estado: EstadoEntidade): void {
        const chave = this.obterChave(nomeEntidade, registro);
        const valoresOriginais: { [campo: string]: any } = {};
        for (const [campo, valor] of Object.entries(registro.propriedades)) {
            valoresOriginais[campo] = valor;
        }

        this.registros.set(chave, {
            registro,
            estado,
            nomeEntidade,
            valoresOriginais,
            camposAlterados: []
        });
    }

    marcarModificado(registro: ObjetoDeleguaClasse): void {
        for (const [, rastreado] of this.registros) {
            if (rastreado.registro === registro && rastreado.estado === 'inalterado') {
                rastreado.estado = 'modificado';
                return;
            }
        }
    }

    marcarExcluido(registro: ObjetoDeleguaClasse): void {
        for (const [, rastreado] of this.registros) {
            if (rastreado.registro === registro) {
                rastreado.estado = 'excluido';
                return;
            }
        }
    }

    obterEstado(registro: ObjetoDeleguaClasse): EstadoEntidade | null {
        for (const [, rastreado] of this.registros) {
            if (rastreado.registro === registro) {
                return rastreado.estado;
            }
        }
        return null;
    }

    obterAlterados(): RegistroRastreadoInterface[] {
        const alterados: RegistroRastreadoInterface[] = [];
        for (const [, rastreado] of this.registros) {
            if (rastreado.estado !== 'inalterado') {
                alterados.push(rastreado);
            }
        }
        return alterados;
    }

    detectarMudancas(): void {
        for (const [, rastreado] of this.registros) {
            if (rastreado.estado !== 'inalterado') continue;

            const camposAlterados: string[] = [];
            for (const [campo, valorOriginal] of Object.entries(rastreado.valoresOriginais)) {
                if (this.registroPropriedadeDiferente(rastreado.registro.propriedades[campo], valorOriginal)) {
                    camposAlterados.push(campo);
                }
            }

            if (camposAlterados.length > 0) {
                rastreado.estado = 'modificado';
                rastreado.camposAlterados = camposAlterados;
            }
        }
    }

    obterCamposAlterados(registro: ObjetoDeleguaClasse): string[] {
        for (const [, rastreado] of this.registros) {
            if (rastreado.registro === registro) {
                return rastreado.camposAlterados;
            }
        }
        return [];
    }

    limpar(): void {
        this.registros.clear();
    }

    obterTodosRastreados(): RegistroRastreadoInterface[] {
        return Array.from(this.registros.values());
    }

    registroPropriedadeDiferente(atual: any, original: any): boolean {
        return atual !== original;
    }
}
