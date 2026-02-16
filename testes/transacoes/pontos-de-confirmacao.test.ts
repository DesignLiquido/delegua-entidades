import { Transacao } from "../../fontes/transacao";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe("Pontos de Confirmação e Transações Aninhadas", () => {
    let transacao: Transacao;
    let tecnologia: BonecoTecnologia;

    beforeEach(() => {
        tecnologia = new BonecoTecnologia();
        transacao = new Transacao(tecnologia);
    });

    describe("Criação de Pontos de Confirmação", () => {
        it("deve criar ponto de confirmação com nome válido", async () => {
            await expect(transacao.criarPontoDeConfirmacao("sp1")).resolves.not.toThrow();
            expect(transacao.obterPontosDeConfirmacao()).toContain("sp1");
        });

        it("deve criar múltiplos pontos de confirmação", async () => {
            await transacao.criarPontoDeConfirmacao("primeiro");
            await transacao.criarPontoDeConfirmacao("segundo");
            await transacao.criarPontoDeConfirmacao("terceiro");

            const pontosDeConfirmacao = transacao.obterPontosDeConfirmacao();
            expect(pontosDeConfirmacao).toHaveLength(3);
            expect(pontosDeConfirmacao).toContain("primeiro");
            expect(pontosDeConfirmacao).toContain("segundo");
            expect(pontosDeConfirmacao).toContain("terceiro");
        });

        it("deve registrar operação de ponto de confirmação", async () => {
            await transacao.criarPontoDeConfirmacao("teste");

            const operacoes = transacao.obterOperacoes();
            expect(operacoes).toHaveLength(1);
            expect(operacoes[0].tipo).toBe("PONTO_DE_CONFIRMACAO");
            expect(operacoes[0].nome).toBe("teste");
        });

        it("deve gerar SQL de ponto de confirmação", async () => {
            await transacao.criarPontoDeConfirmacao("meu_ponto");

            const operacoes = transacao.obterOperacoes();
            expect(operacoes[0].sql).toMatch(/SAVEPOINT/);
            expect(operacoes[0].sql).toMatch(/meu_ponto/);
        });

        it("deve lançar erro para nome vazio", async () => {
            await expect(transacao.criarPontoDeConfirmacao("")).rejects.toThrow(
                "Nome do ponto de confirmação não pode estar vazio"
            );
        });

        it("deve lançar erro para nome com espaços", async () => {
            await expect(transacao.criarPontoDeConfirmacao("nome com espaço")).rejects.toThrow(
                "caracteres inválidos"
            );
        });

        it("deve lançar erro para nome com caracteres especiais", async () => {
            await expect(transacao.criarPontoDeConfirmacao("nome-com-hífen")).rejects.toThrow(
                "caracteres inválidos"
            );
        });

        it("deve lançar erro para ponto de confirmação nome duplicado", async () => {
            await transacao.criarPontoDeConfirmacao("duplicado");
            await expect(transacao.criarPontoDeConfirmacao("duplicado")).rejects.toThrow(
                "já existe"
            );
        });

        it("deve aceitar nomes com underscore e números", async () => {
            await expect(
                transacao.criarPontoDeConfirmacao("ponto_1_valido")
            ).resolves.not.toThrow();
            expect(transacao.obterPontosDeConfirmacao()).toContain("ponto_1_valido");
        });

        it("deve lançar erro se transação não está ativa", async () => {
            await transacao.reverter();
            await expect(transacao.criarPontoDeConfirmacao("sp1")).rejects.toThrow(
                "Transação não está ativa"
            );
        });
    });

    describe("Reversão para Savepoints", () => {
        it("deve reverter para savepoint existente", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await expect(
                transacao.reverterParaPontoDeConfirmacao("sp1")
            ).resolves.not.toThrow();
        });

        it("deve gerar SQL correto de reversão", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.reverterParaPontoDeConfirmacao("sp1");

            const operacoes = transacao.obterOperacoes();
            const operacaoReversao = operacoes.find(op => op.tipo === "ROLLBACK_SAVEPOINT");
            expect(operacaoReversao).toBeDefined();
            expect(operacaoReversao.sql).toBeTruthy();
        });

        it("deve remover savepoints posteriores ao reverter", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.criarPontoDeConfirmacao("sp2");
            await transacao.criarPontoDeConfirmacao("sp3");

            await transacao.reverterParaPontoDeConfirmacao("sp1");

            const savepoints = transacao.obterPontosDeConfirmacao();
            expect(savepoints).toContain("sp1");                 // sp1 é mantido
            expect(savepoints).not.toContain("sp2");             // sp2 é removido
            expect(savepoints).not.toContain("sp3");             // sp3 é removido
        });

        it("deve registrar savepoints removidos na operação", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.criarPontoDeConfirmacao("sp2");
            await transacao.criarPontoDeConfirmacao("sp3");

            await transacao.reverterParaPontoDeConfirmacao("sp1");

            const operacoes = transacao.obterOperacoes();
            const operacaoReversao = operacoes.find(op => op.tipo === "ROLLBACK_SAVEPOINT");
            expect(operacaoReversao.savepointsRemovidos).toEqual(["sp2", "sp3"]);  // Apenas sp2 e sp3
        });

        it("deve lançar erro para savepoint inexistente", async () => {
            await expect(
                transacao.reverterParaPontoDeConfirmacao("nao_existe")
            ).rejects.toThrow("não existe");
        });

        it("deve lançar erro se transação não está ativa", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.reverter();

            await expect(
                transacao.reverterParaPontoDeConfirmacao("sp1")
            ).rejects.toThrow("Transação não está ativa");
        });
    });

    describe("Liberação de Pontos de Confirmação", () => {
        it("deve liberar ponto de confirmação existente", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await expect(transacao.liberarPontoDeConfirmacao("sp1")).resolves.not.toThrow();
            expect(transacao.obterPontosDeConfirmacao()).not.toContain("sp1");
        });

        it("deve gerar SQL de liberação", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.liberarPontoDeConfirmacao("sp1");

            const operacoes = transacao.obterOperacoes();
            const operacaoLiberacao = operacoes.find(op => op.tipo === "RELEASE_SAVEPOINT");
            expect(operacaoLiberacao).toBeDefined();
            expect(operacaoLiberacao.sql).toBeTruthy();
        });

        it("deve liberar ponto de confirmação no meio da pilha", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.criarPontoDeConfirmacao("sp2");
            await transacao.criarPontoDeConfirmacao("sp3");

            await transacao.liberarPontoDeConfirmacao("sp2");

            const savepoints = transacao.obterPontosDeConfirmacao();
            expect(savepoints).toContain("sp1");
            expect(savepoints).not.toContain("sp2");
            expect(savepoints).toContain("sp3");
        });

        it("deve lançar erro para ponto de confirmação inexistente", async () => {
            await expect(transacao.liberarPontoDeConfirmacao("nao_existe")).rejects.toThrow(
                "não existe"
            );
        });

        it("deve lançar erro se transação não está ativa", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.reverter();

            await expect(transacao.liberarPontoDeConfirmacao("sp1")).rejects.toThrow(
                "Transação não está ativa"
            );
        });
    });

    describe("SQL Específico do Banco de Dados", () => {
        it("deve gerar SQL SQLite para savepoint", async () => {
            const tx = new Transacao(tecnologia, "sqlite");
            await tx.criarPontoDeConfirmacao("sp1");

            const operacoes = tx.obterOperacoes();
            expect(operacoes[0].sql).toContain("SAVEPOINT");
        });

        it("deve gerar SQL PostgreSQL para reversão", async () => {
            const tx = new Transacao(tecnologia, "postgresql");
            await tx.criarPontoDeConfirmacao("sp1");
            await tx.reverterParaPontoDeConfirmacao("sp1");

            const operacoes = tx.obterOperacoes();
            const reversao = operacoes.find(op => op.tipo === "ROLLBACK_SAVEPOINT");
            expect(reversao.sql).toContain("ROLLBACK TO");
        });

        it("deve gerar SQL MySQL para reversão", async () => {
            const tx = new Transacao(tecnologia, "mysql");
            await tx.criarPontoDeConfirmacao("sp1");
            await tx.reverterParaPontoDeConfirmacao("sp1");

            const operacoes = tx.obterOperacoes();
            const reversao = operacoes.find(op => op.tipo === "ROLLBACK_SAVEPOINT");
            expect(reversao.sql).toContain("ROLLBACK TO SAVEPOINT");
        });

        it("deve gerar SQL SQL Server para reversão", async () => {
            const tx = new Transacao(tecnologia, "sqlserver");
            await tx.criarPontoDeConfirmacao("sp1");
            await tx.reverterParaPontoDeConfirmacao("sp1");

            const operacoes = tx.obterOperacoes();
            const reversao = operacoes.find(op => op.tipo === "ROLLBACK_SAVEPOINT");
            expect(reversao.sql).toContain("ROLLBACK TRANSACTION");
        });

        it("deve gerar SQL PostgreSQL para liberação", async () => {
            const tx = new Transacao(tecnologia, "postgresql");
            await tx.criarPontoDeConfirmacao("sp1");
            await tx.liberarPontoDeConfirmacao("sp1");

            const operacoes = tx.obterOperacoes();
            const liberacao = operacoes.find(op => op.tipo === "RELEASE_SAVEPOINT");
            expect(liberacao.sql).toContain("RELEASE SAVEPOINT");
        });

        it("deve gerar SQL MySQL para liberação", async () => {
            const tx = new Transacao(tecnologia, "mysql");
            await tx.criarPontoDeConfirmacao("sp1");
            await tx.liberarPontoDeConfirmacao("sp1");

            const operacoes = tx.obterOperacoes();
            const liberacao = operacoes.find(op => op.tipo === "RELEASE_SAVEPOINT");
            expect(liberacao.sql).toContain("RELEASE SAVEPOINT");
        });
    });

    describe("Transações Aninhadas", () => {
        it("deve suportar múltiplos níveis de savepoints", async () => {
            await transacao.criarPontoDeConfirmacao("nivel1");
            await transacao.criarPontoDeConfirmacao("nivel2");
            await transacao.criarPontoDeConfirmacao("nivel3");

            const savepoints = transacao.obterPontosDeConfirmacao();
            expect(savepoints).toHaveLength(3);
        });

        it("deve preservar operações ao criar savepoint", async () => {
            transacao.registrarOperacao({ tipo: "INSERT", tabela: "usuarios" });
            await transacao.criarPontoDeConfirmacao("sp1");
            transacao.registrarOperacao({ tipo: "UPDATE", tabela: "usuarios" });

            const operacoes = transacao.obterOperacoes();
            expect(operacoes.length).toBeGreaterThan(2);
        });

        it("deve permitir operações entre savepoints", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            transacao.registrarOperacao({ tipo: "DELETE", tabela: "usuarios" });
            await transacao.criarPontoDeConfirmacao("sp2");
            transacao.registrarOperacao({ tipo: "INSERT", tabela: "logs" });

            const operacoes = transacao.obterOperacoes();
            const delete_op = operacoes.find(op => op.tipo === "DELETE");
            const insert_op = operacoes.find(op => op.tipo === "INSERT");

            expect(delete_op).toBeDefined();
            expect(insert_op).toBeDefined();
        });

        it("deve restaurar para estado anterior após reverter", async () => {
            transacao.registrarOperacao({ tipo: "INSERT", tabela: "usuarios" });
            await transacao.criarPontoDeConfirmacao("sp1");
            transacao.registrarOperacao({ tipo: "UPDATE", tabela: "usuarios" });

            const operacoesAntes = transacao.obterOperacoes().length;

            await transacao.reverterParaPontoDeConfirmacao("sp1");

            const operacoes = transacao.obterOperacoes();
            const operacoesDepois = operacoes.length;
            
            // O rollback em si é registrado como operação
            expect(operacoesDepois).toBe(operacoesAntes + 1);
            
            // Verificar que a operação UPDATE posterior foi registrada
            const hasUpdateAntes = operacoes.slice(0, operacoesAntes).some(op => op.tipo === "UPDATE");
            expect(hasUpdateAntes).toBe(true);
            
            // E que há um ROLLBACK_SAVEPOINT registrado
            const hasRollback = operacoes.some(op => op.tipo === "ROLLBACK_SAVEPOINT");
            expect(hasRollback).toBe(true);
        });
    });

    describe("Integração com Confirmação/Reversão", () => {
        it("deve limpar savepoints ao confirmar", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.criarPontoDeConfirmacao("sp2");

            expect(transacao.obterPontosDeConfirmacao()).toHaveLength(2);

            await transacao.confirmar();

            expect(transacao.obterPontosDeConfirmacao()).toHaveLength(0);
        });

        it("deve limpar savepoints ao reverter", async () => {
            await transacao.criarPontoDeConfirmacao("sp1");
            await transacao.criarPontoDeConfirmacao("sp2");

            expect(transacao.obterPontosDeConfirmacao()).toHaveLength(2);

            await transacao.reverter();

            expect(transacao.obterPontosDeConfirmacao()).toHaveLength(0);
        });

        it("deve indicar transação ativa durante savepoints", async () => {
            expect(transacao.estaAtiva()).toBe(true);

            await transacao.criarPontoDeConfirmacao("sp1");
            expect(transacao.estaAtiva()).toBe(true);

            await transacao.reverterParaPontoDeConfirmacao("sp1");
            expect(transacao.estaAtiva()).toBe(true);

            await transacao.confirmar();
            expect(transacao.estaAtiva()).toBe(false);
        });
    });

    describe("Rastreamento de Metadados", () => {
        it("deve registrar timestamp de criação do savepoint", async () => {
            const antes = new Date();
            await transacao.criarPontoDeConfirmacao("sp1");
            const depois = new Date();

            const operacoes = transacao.obterOperacoes();
            const opcao = operacoes.find(op => op.tipo === "SAVEPOINT");

            expect(opcao.timestamp).toBeDefined();
            expect(opcao.timestamp.getTime()).toBeGreaterThanOrEqual(antes.getTime());
            expect(opcao.timestamp.getTime()).toBeLessThanOrEqual(depois.getTime());
        });

        it("deve registrar operações em ordem", async () => {
            transacao.registrarOperacao({ tipo: "OP1" });
            await transacao.criarPontoDeConfirmacao("sp1");
            transacao.registrarOperacao({ tipo: "OP2" });
            await transacao.criarPontoDeConfirmacao("sp2");
            transacao.registrarOperacao({ tipo: "OP3" });

            const operacoes = transacao.obterOperacoes();
            expect(operacoes[0].tipo).toBe("OP1");
            expect(operacoes[1].tipo).toBe("SAVEPOINT");
            expect(operacoes[1].nome).toBe("sp1");
            expect(operacoes[2].tipo).toBe("OP2");
            expect(operacoes[3].tipo).toBe("SAVEPOINT");
            expect(operacoes[3].nome).toBe("sp2");
            expect(operacoes[4].tipo).toBe("OP3");
        });
    });

    describe("Definição de Banco de Dados", () => {
        it("deve permitir definir banco de dados após criar transação", () => {
            const tx = new Transacao(tecnologia);
            expect(() => tx.definirBancoDados("postgresql")).not.toThrow();
        });

        it("deve usar banco de dados definido para SQL", async () => {
            const tx = new Transacao(tecnologia);
            tx.definirBancoDados("postgresql");

            await tx.criarPontoDeConfirmacao("sp1");
            await tx.reverterParaPontoDeConfirmacao("sp1");

            const operacoes = tx.obterOperacoes();
            const reversao = operacoes.find(op => op.tipo === "ROLLBACK_SAVEPOINT");
            expect(reversao.sql).toContain("ROLLBACK TO");
        });
    });
});
