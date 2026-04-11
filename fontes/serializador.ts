import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";
import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";
import { OpcoesSerializacaoInterface } from "./interfaces-tipos";

/**
 * Classe responsável pela serialização de registros para JSON e dicionários.
 * Fornece controle granular sobre quais campos incluir e como serializar relacionamentos.
 */
export class Serializador {
    /**
     * Converte um registro de entidade para dicionário (objeto JavaScript).
     * @param registro Registro a serializar
     * @param tipoEntidade Tipo da entidade
     * @param opcoes Opções de serialização
     * @returns Objeto JavaScript com os dados do registro
     */
    static paraDicionario(
        registro: ObjetoDeleguaClasse,
        tipoEntidade: EntidadeInterface,
        opcoes: OpcoesSerializacaoInterface = {}
    ): Record<string, any> {
        const dicionario: Record<string, any> = {};
        const profundidade = opcoes.profundidade ?? 1;

        for (const propriedade of tipoEntidade.modelo?.propriedades ?? []) {
            const nomeCampo = propriedade.nome.lexema;

            if (!this._deveIncluirCampo(nomeCampo, opcoes)) {
                continue;
            }

            const valor = registro.propriedades[nomeCampo];

            if (valor === null || valor === undefined) {
                dicionario[nomeCampo] = valor;
                continue;
            }

            dicionario[nomeCampo] = valor;
        }

        return dicionario;
    }

    /**
     * Converte um registro de entidade para string JSON.
     * @param registro Registro a serializar
     * @param tipoEntidade Tipo da entidade
     * @param opcoes Opções de serialização
     * @returns String JSON com os dados do registro
     */
    static paraJson(
        registro: ObjetoDeleguaClasse,
        tipoEntidade: EntidadeInterface,
        opcoes: OpcoesSerializacaoInterface = {}
    ): string {
        const dicionario = this.paraDicionario(registro, tipoEntidade, opcoes);
        return JSON.stringify(dicionario);
    }

    /**
     * Converte múltiplos registros para array de dicionários.
     * @param registros Registros a serializar
     * @param tipoEntidade Tipo da entidade
     * @param opcoes Opções de serialização
     * @returns Array de dicionários
     */
    static muitosParaDicionario(
        registros: ObjetoDeleguaClasse[],
        tipoEntidade: EntidadeInterface,
        opcoes: OpcoesSerializacaoInterface = {}
    ): Record<string, any>[] {
        return registros.map(registro => this.paraDicionario(registro, tipoEntidade, opcoes));
    }

    /**
     * Converte múltiplos registros para string JSON com array.
     * @param registros Registros a serializar
     * @param tipoEntidade Tipo da entidade
     * @param opcoes Opções de serialização
     * @returns String JSON com array de registros
     */
    static muitosParaJson(
        registros: ObjetoDeleguaClasse[],
        tipoEntidade: EntidadeInterface,
        opcoes: OpcoesSerializacaoInterface = {}
    ): string {
        const dicionarios = this.muitosParaDicionario(registros, tipoEntidade, opcoes);
        return JSON.stringify(dicionarios);
    }

    /**
     * Verifica se um campo deve ser incluído na serialização.
     */
    private static _deveIncluirCampo(
        nomeCampo: string,
        opcoes: OpcoesSerializacaoInterface
    ): boolean {
        if (opcoes.excluir && opcoes.excluir.includes(nomeCampo)) {
            return false;
        }

        if (opcoes.incluir && !opcoes.incluir.includes(nomeCampo)) {
            return false;
        }

        return true;
    }
}
