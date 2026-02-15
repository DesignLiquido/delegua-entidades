import { TecnologiaLinconesInterface } from "@designliquido/lincones-js";

import { TransacaoInterface } from "./interfaces-tipos/transacao-interface";

/**
 * Implementação de transação de banco de dados.
 * Mantém controle de operações realizadas durante a transação
 * para possibilitar rollback.
 */
export class Transacao implements TransacaoInterface {
    private tecnologia: TecnologiaLinconesInterface;
    private operacoes: any[] = [];
    private ativa: boolean = true;

    constructor(tecnologia: TecnologiaLinconesInterface) {
        this.tecnologia = tecnologia;
    }

    /**
     * Registra uma operação na transação.
     * Internamente usada para rastrear mudanças.
     */
    registrarOperacao(comando: any): void {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }
        this.operacoes.push(comando);
    }

    /**
     * Retorna as operações registradas.
     */
    obterOperacoes(): any[] {
        return [...this.operacoes];
    }

    /**
     * Confirma a transação.
     * Todas as operações registradas são consideradas finais.
     */
    async confirmar(): Promise<void> {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }
        
        // Em um provedor real, isso executaria COMMIT no banco de dados
        // Por enquanto, apenas marcamos a transação como finalizada
        this.ativa = false;
        this.operacoes = [];
    }

    /**
     * Reverte a transação.
     * Todas as operações registradas são descartadas.
     */
    async reverter(): Promise<void> {
        if (!this.ativa) {
            throw new Error('Transação não está ativa');
        }

        // Em um provedor real, isso executaria ROLLBACK no banco de dados
        // Aqui apenas descartamos as operações registradas
        this.ativa = false;
        this.operacoes = [];
    }

    /**
     * Indica se a transação está ativa.
     */
    estaAtiva(): boolean {
        return this.ativa;
    }
}
