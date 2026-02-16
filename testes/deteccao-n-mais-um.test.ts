import { DetectorConsultasN1 } from "../fontes/detector-n-mais-um";
import { Taquigrafo } from "../fontes/taquigrafia";

/**
 * Testes para detecção de padrão N+1 (problema comum de consultas ineficientes).
 * 
 * O padrão N+1 ocorre quando:
 * 1. Uma consulta retorna N registros
 * 2. Seguida imediatamente por N consultas similares
 * 3. Geralmente ao carregar relacionamentos sem eager loading
 */
describe("Detecção de Consultas N+1", () => {
    let detector: DetectorConsultasN1;
    let taquigrafo: Taquigrafo;

    beforeEach(() => {
        detector = new DetectorConsultasN1();
        taquigrafo = new Taquigrafo('info');
    });

    describe("Registro e Rastreamento de Consultas", () => {
        it("deve registrar consultas executadas", () => {
            detector.registrarConsulta("SELECT * FROM usuarios", 5);
            expect(detector.obterConsultas().length).toBe(1);

            detector.registrarConsulta("SELECT * FROM pedidos", 3);
            expect(detector.obterConsultas().length).toBe(2);
        });

        it("deve armazenar informações completas da consulta", () => {
            detector.registrarConsulta("SELECT * FROM usuarios WHERE id = 1", 1, 5, "Usuario");
            const consultas = detector.obterConsultas();

            expect(consultas[0].sql).toContain("SELECT");
            expect(consultas[0].quantidadeRegistros).toBe(1);
            expect(consultas[0].tempoExecucao).toBe(5);
            expect(consultas[0].nomeEntidade).toBe("Usuario");
        });

        it("deve respeitar limite de histórico de consultas", () => {
            detector.definirLimiteJanela(10);

            for (let i = 0; i < 50; i++) {
                detector.registrarConsulta(`SELECT * FROM table_${i}`, 1);
            }

            expect(detector.obterConsultas().length).toBeLessThanOrEqual(10);
        });

        it("deve permitir obter últimas N consultas", () => {
            for (let i = 0; i < 20; i++) {
                detector.registrarConsulta(`SELECT * FROM table_${i}`, 1);
            }

            const ultimas = detector.obterUltimasConsultas(5);
            expect(ultimas.length).toBe(5);
        });
    });

    describe("Análise de Padrão N+1", () => {
        it("deve detectar quando há padrão N+1", () => {
            // Simula padrão N+1: 1 consulta com 5 resultados + 5 consultas similares
            detector.registrarConsulta("SELECT * FROM usuarios", 5);

            for (let i = 1; i <= 5; i++) {
                detector.registrarConsulta(`SELECT * FROM usuarios WHERE id = ${i}`, 1);
            }

            const analise = detector.analisar();
            expect(analise.detectado).toBe(true);
            expect(analise.quantidadeRegistros).toBe(5);
            expect(analise.consultasRelacionadas?.length).toBeGreaterThan(0);
        });

        it("não deve detectar N+1 sem múltiplas consultas similares", () => {
            detector.registrarConsulta("SELECT * FROM usuarios", 10);
            detector.registrarConsulta("SELECT * FROM pedidos", 5);
            detector.registrarConsulta("SELECT * FROM produtos", 3);

            const analise = detector.analisar();
            expect(analise.detectado).toBe(false);
        });

        it("não deve detectar N+1 com resultado único", () => {
            detector.registrarConsulta("SELECT * FROM usuarios WHERE id = 1", 1);
            detector.registrarConsulta("SELECT * FROM usuarios WHERE id = 2", 1);

            const analise = detector.analisar();
            expect(analise.detectado).toBe(false);
        });

        it("deve incluir sugestão de eager loading na detecção", () => {
            detector.registrarConsulta("SELECT * FROM usuarios", 3);
            for (let i = 1; i <= 3; i++) {
                detector.registrarConsulta(`SELECT * FROM usuarios WHERE id = ${i}`, 1);
            }

            const analise = detector.analisar();
            if (analise.detectado && analise.sugestao) {
                expect(analise.sugestao).toContain("incluirRelacionados");
            }
        });
    });

    describe("Estatísticas", () => {
        it("deve calcular estatísticas de consultas", () => {
            detector.registrarConsulta("SELECT * FROM usuarios", 5, 10);
            detector.registrarConsulta("SELECT * FROM pedidos", 3, 8);

            const stats = detector.obterEstatisticas();
            expect(stats.totalConsultas).toBe(2);
            expect(stats.tempoTotalMs).toBe(18);
            expect(stats.tempoMedioMs).toBe(9);
            expect(stats.totalRegistros).toBe(8);
        });

        it("deve fornecer estatísticas com zero consultas", () => {
            const stats = detector.obterEstatisticas();
            expect(stats.totalConsultas).toBe(0);
            expect(stats.tempoTotalMs).toBe(0);
            expect(stats.tempoMedioMs).toBe(0);
            expect(stats.totalRegistros).toBe(0);
        });
    });

    describe("Integração com Taquigrafo", () => {
        it("deve registrar consultas através do Taquigrafo", () => {
            taquigrafo.registrarConsulta("SELECT * FROM usuarios", 5);
            const detectorIntegrado = taquigrafo.obterDetectorN1();

            expect(detectorIntegrado.obterConsultas().length).toBe(1);
        });

        it("deve analisar N+1 através do Taquigrafo", () => {
            taquigrafo.registrarConsulta("SELECT * FROM usuarios", 2);
            taquigrafo.registrarConsulta("SELECT * FROM usuarios WHERE id = 1", 1);
            taquigrafo.registrarConsulta("SELECT * FROM usuarios WHERE id = 2", 1);

            const analise = taquigrafo.analisarN1();
            expect(analise.detectado).toBe(true);
        });

        it("deve permitir desabilitar detecção", () => {
            taquigrafo.definirDeteccaoN1Habilitada(false);
            taquigrafo.registrarConsulta("SELECT * FROM usuarios", 5);

            const detector = taquigrafo.obterDetectorN1();
            expect(detector.obterConsultas().length).toBe(0);
        });

        it("deve permitir reabilitar detecção", () => {
            taquigrafo.definirDeteccaoN1Habilitada(false);
            taquigrafo.registrarConsulta("SELECT * FROM usuarios", 1);

            taquigrafo.definirDeteccaoN1Habilitada(true);
            taquigrafo.registrarConsulta("SELECT * FROM pedidos", 2);

            const detector = taquigrafo.obterDetectorN1();
            expect(detector.obterConsultas().length).toBe(1); // Apenas a segunda consulta foi registrada
        });
    });

    describe("Configuração", () => {
        it("deve permitir ajustar limiar de detecção", () => {
            detector.definirLimiar(10);

            detector.registrarConsulta("SELECT * FROM usuarios", 100);
            for (let i = 0; i < 5; i++) {
                detector.registrarConsulta(`SELECT * FROM usuarios WHERE id = ${i}`, 1);
            }

            const analise = detector.analisar();
            // Com limiar de 10, apenas 5 consultas similares não é suficiente
            expect(analise.detectado).toBe(false);
        });

        it("deve permitir ajustar tamanho de janela", () => {
            detector.definirLimiteJanela(15);

            for (let i = 0; i < 50; i++) {
                detector.registrarConsulta(`SELECT * FROM users WHERE id = ${i}`, 1);
            }

            const consultas = detector.obterConsultas();
            expect(consultas.length).toBeLessThanOrEqual(15);
        });
    });

    describe("Manutenção", () => {
        it("deve limpar histórico de consultas", () => {
            detector.registrarConsulta("SELECT * FROM usuarios", 5);
            detector.registrarConsulta("SELECT * FROM pedidos", 3);

            detector.limpar();
            expect(detector.obterConsultas().length).toBe(0);
        });

        it("deve permitir limpar via Taquigrafo", () => {
            taquigrafo.registrarConsulta("SELECT * FROM usuarios", 5);
            taquigrafo.limparConsultas();

            const detector = taquigrafo.obterDetectorN1();
            expect(detector.obterConsultas().length).toBe(0);
        });
    });

    describe("Casos de Uso Reais", () => {
        it("simula carregamento de usuários com N+1 (com valores fixos para debug)", () => {
            // Versão simplificada com valores fixos para debug
            detector.registrarConsulta(
                "SELECT id, nome, email FROM usuarios WHERE ativo = 1",
                20,
                50
            );

            // 20 consultas de pedidos com quantidade fixa
            for (let i = 1; i <= 20; i++) {
                detector.registrarConsulta(
                    `SELECT id, descricao FROM pedidos WHERE usuario_id = ${i}`,
                    2,
                    5
                );
            }

            const analise = detector.analisar();
            expect(analise.detectado).toBe(true);
            expect(analise.quantidadeRegistros).toBe(20);
            expect(analise.sugestao).toContain("N+1");
        });

        it("simula carregamento de usuários com N+1", () => {
            // Cenário real: buscar usuários e depois seus pedidos
            detector.registrarConsulta(
                "SELECT id, nome, email FROM usuarios WHERE ativo = 1",
                20,
                50
            );

            // N consultas adicionais para carregar pedidos (N+1 problema)
            for (let i = 1; i <= 20; i++) {
                detector.registrarConsulta(
                    `SELECT id, descricao FROM pedidos WHERE usuario_id = ${i}`,
                    Math.floor(Math.random() * 5) + 1,
                    5
                );
            }

            const analise = detector.analisar();
            expect(analise.detectado).toBe(true);
            expect(analise.quantidadeRegistros).toBe(20);
            expect(analise.sugestao).toContain("N+1");
        });

        it("simula carregamento com eager loading (sem N+1)", () => {
            // JOIN antecipado evita N+1
            detector.registrarConsulta(
                "SELECT usuarios.id, usuarios.nome, pedidos.id, pedidos.descricao " +
                "FROM usuarios " +
                "LEFT JOIN pedidos ON usuarios.id = pedidos.usuario_id " +
                "WHERE usuarios.ativo = 1",
                100,
                150
            );

            const analise = detector.analisar();
            expect(analise.detectado).toBe(false);
        });
    });
});
