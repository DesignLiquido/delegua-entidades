import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

import { ConfiguracoesBancos } from "./interfaces-tipos/configuracao-banco-dados-interface";
import { EntidadeInterface } from "./interfaces-tipos/entidade-interface";

/**
 * Gerenciador de múltiplos bancos de dados.
 * Roteia operações para o banco correto baseado na configuração da entidade.
 */
export class RoteadorBancos {
    private bancos: Map<string, TecnologiaLinconesInterface> = new Map();
    private bancoPadrao: string = 'padrão';

    /**
     * Registra uma tecnologia para um banco de dados específico.
     */
    registrarBanco(nome: string, tecnologia: TecnologiaLinconesInterface, ehPadrao: boolean = false): void {
        if (nome === '') {
            throw new Error('Nome do banco não pode estar vazio');
        }

        this.bancos.set(nome, tecnologia);

        if (ehPadrao) {
            this.bancoPadrao = nome;
        }
    }

    /**
     * Registra múltiplos bancos de dados a partir de configurações.
     */
    registrarBancos(configuracoes: ConfiguracoesBancos, tecnologias: { [nome: string]: TecnologiaLinconesInterface }): void {
        for (const nome in configuracoes) {
            const config = configuracoes[nome];
            const tecnologia = tecnologias[nome];

            if (!tecnologia) {
                throw new Error(`Tecnologia para banco '${nome}' não foi fornecida`);
            }

            this.registrarBanco(nome, tecnologia, config.padrao || false);
        }
    }

    /**
     * Obtém a tecnologia para um banco específico.
     */
    obterTecnologia(nomeBanco: string): TecnologiaLinconesInterface {
        const tecnologia = this.bancos.get(nomeBanco);
        if (!tecnologia) {
            throw new Error(`Banco de dados '${nomeBanco}' não foi registrado`);
        }
        return tecnologia;
    }

    /**
     * Obtém a tecnologia para uma entidade baseado em seu banco especificado.
     */
    obterTecnologiaParaEntidade(entidade: EntidadeInterface): TecnologiaLinconesInterface {
        const nomeBanco = entidade.obterNomeBancoDados();
        return this.obterTecnologia(nomeBanco);
    }

    /**
     * Obtém a tecnologia padrão.
     */
    obterTecnologiaPadrao(): TecnologiaLinconesInterface {
        return this.obterTecnologia(this.bancoPadrao);
    }

    /**
     * Obtém o nome do banco padrão.
     */
    obterNomeBancoPadrao(): string {
        return this.bancoPadrao;
    }

    /**
     * Lista todos os bancos registrados.
     */
    listarBancos(): string[] {
        return Array.from(this.bancos.keys());
    }

    /**
     * Verifica se um banco está registrado.
     */
    possuiBanco(nome: string): boolean {
        return this.bancos.has(nome);
    }

    /**
     * Remove um banco de dados registrado.
     */
    removerBanco(nome: string): void {
        if (nome === this.bancoPadrao) {
            throw new Error('Não é possível remover o banco padrão');
        }
        this.bancos.delete(nome);
    }
}
