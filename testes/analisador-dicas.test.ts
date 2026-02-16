import { AnalisadorDicas, TipoDica, NivelSeveridade, Dica } from "../fontes/analisador-dicas";

describe("Analisador de Dicas de Otimização", () => {
    describe("Detecção de SELECT *", () => {
        it("deve detectar SELECT * em query", () => {
            const sql = "SELECT * FROM usuarios WHERE id = 1";
            const dicas = AnalisadorDicas.analisar(sql);

            const dicaSelectAsterico = dicas.find(d => d.tipo === TipoDica.SELECAO_DESNECESSARIA);
            expect(dicaSelectAsterico).toBeDefined();
            expect(dicaSelectAsterico?.severidade).toBe(NivelSeveridade.MEDIO);
        });

        it("deve não detectar SELECT * se houver colunas específicas", () => {
            const sql = "SELECT id, nome, email FROM usuarios WHERE id = 1";
            const dicas = AnalisadorDicas.analisar(sql);

            const dicaSelectAsterico = dicas.find(d => d.tipo === TipoDica.SELECAO_DESNECESSARIA);
            expect(dicaSelectAsterico).toBeUndefined();
        });

        it("deve detectar SELECT * (case-insensitive)", () => {
            const sql = "select * from usuarios";
            const dicas = AnalisadorDicas.analisar(sql);

            const dicaSelectAsterico = dicas.find(d => d.tipo === TipoDica.SELECAO_DESNECESSARIA);
            expect(dicaSelectAsterico).toBeDefined();
        });
    });

    describe("Detecção de JOINs Excessivos", () => {
        it("deve detectar muitos JOINs", () => {
            const sql = `
                SELECT * FROM usuarios u
                JOIN posts p ON u.id = p.usuario_id
                JOIN comentarios c ON p.id = c.post_id
                JOIN respostas r ON c.id = r.comentario_id
                JOIN usuarios_votos v ON r.id = v.resposta_id
            `;

            const dicas = AnalisadorDicas.analisar(sql);
            const dicaJoin = dicas.find(d => d.tipo === TipoDica.JUNCAO_REDUNDANTE);

            expect(dicaJoin).toBeDefined();
            expect(dicaJoin?.severidade).toBe(NivelSeveridade.ALTO);
            expect(dicaJoin?.metrica?.valor).toBe(4);
        });

        it("não deve alertar para 3 ou menos JOINs", () => {
            const sql = `
                SELECT * FROM usuarios u
                JOIN posts p ON u.id = p.usuario_id
                JOIN comentarios c ON p.id = c.post_id
            `;

            const dicas = AnalisadorDicas.analisar(sql);
            const dicaJoin = dicas.find(d => d.tipo === TipoDica.JUNCAO_REDUNDANTE);

            expect(dicaJoin).toBeUndefined();
        });
    });

    describe("Detecção de LIMIT", () => {
        it("deve alertar quando falta LIMIT", () => {
            const sql = "SELECT * FROM usuarios WHERE ativo = true";
            const dicas = AnalisadorDicas.analisar(sql);

            const dicaPaginacao = dicas.find(d => d.tipo === TipoDica.PAGINACAO_FALTANTE);
            expect(dicaPaginacao).toBeDefined();
            expect(dicaPaginacao?.severidade).toBe(NivelSeveridade.ALTO);
        });

        it("não deve alertar se houver LIMIT", () => {
            const sql = "SELECT * FROM usuarios WHERE ativo = true LIMIT 10";
            const dicas = AnalisadorDicas.analisar(sql);

            const dicaPaginacao = dicas.find(d => d.tipo === TipoDica.PAGINACAO_FALTANTE);
            expect(dicaPaginacao).toBeUndefined();
        });

        it("não deve alertar se houver TOP (SQL Server)", () => {
            const sql = "SELECT TOP 10 * FROM usuarios WHERE ativo = true";
            const dicas = AnalisadorDicas.analisar(sql);

            const dicaPaginacao = dicas.find(d => d.tipo === TipoDica.PAGINACAO_FALTANTE);
            expect(dicaPaginacao).toBeUndefined();
        });
    });

    describe("Análise de Performance com Métricas", () => {
        it("deve recomendar cache para consultas lentas com muitos resultados", () => {
            const sql = "SELECT * FROM usuarios";
            const metricas = {
                tempoMs: 1500,
                linhas: 50000,
                contagemJuncoes: 0
            };

            const dicas = AnalisadorDicas.analisar(sql, metricas);
            const dicaCache = dicas.find(d => d.tipo === TipoDica.CACHE_RECOMENDADA);

            expect(dicaCache).toBeDefined();
            expect(dicaCache?.severidade).toBe(NivelSeveridade.ALTO);
        });

        it("não deve recomendar cache para consultas rápidas", () => {
            const sql = "SELECT * FROM usuarios";
            const metricas = {
                tempoMs: 50,
                linhas: 100,
                contagemJuncoes: 0
            };

            const dicas = AnalisadorDicas.analisar(sql, metricas);
            const dicaCache = dicas.find(d => d.tipo === TipoDica.CACHE_RECOMENDADA);

            expect(dicaCache).toBeUndefined();
        });

        it("deve recomendar batch loading para JOINs lentos", () => {
            const sql = "SELECT * FROM usuarios u JOIN posts p ON u.id = p.usuario_id";
            const metricas = {
                tempoMs: 600,
                linhas: 1000,
                contagemJuncoes: 1
            };

            const dicas = AnalisadorDicas.analisar(sql, metricas);
            const dicaLote = dicas.find(d => d.tipo === TipoDica.USAR_CARGA_EM_LOTE);

            expect(dicaLote).toBeDefined();
            expect(dicaLote?.severidade).toBe(NivelSeveridade.MEDIO);
        });
    });

    describe("Formatação de Dicas", () => {
        it("deve formatar dicas vazias com mensagem apropriada", () => {
            const texto = AnalisadorDicas.formatarDicas([]);
            expect(texto).toContain("✅ Nenhuma dica");
        });

        it("deve agrupar dicas por severidade", () => {
            const dicas: Dica[] = [
                {
                    tipo: TipoDica.SELECAO_DESNECESSARIA,
                    severidade: NivelSeveridade.MEDIO,
                    mensagem: "SELECT * detectado",
                    sugestao: "Use colunas específicas"
                },
                {
                    tipo: TipoDica.PAGINACAO_FALTANTE,
                    severidade: NivelSeveridade.ALTO,
                    mensagem: "Sem LIMIT",
                    sugestao: "Adicione LIMIT"
                }
            ];

            const texto = AnalisadorDicas.formatarDicas(dicas);

            expect(texto).toContain("ALTO");
            expect(texto).toContain("MEDIO");
            expect(texto).toContain("🟠"); // Ícone ALTO
            expect(texto).toContain("🟡"); // Ícone MEDIO
        });

        it("deve incluir métricas se presentes", () => {
            const dicas: Dica[] = [
                {
                    tipo: TipoDica.JUNCAO_REDUNDANTE,
                    severidade: NivelSeveridade.ALTO,
                    mensagem: "Muitos JOINs",
                    sugestao: "Reduza JOINs",
                    metrica: {
                        nome: "JOINs",
                        valor: 5,
                        unidade: "quantidade"
                    }
                }
            ];

            const texto = AnalisadorDicas.formatarDicas(dicas);

            expect(texto).toContain("JOINs: 5 quantidade");
        });

        it("deve contar dicas corretamente", () => {
            const dicas: Dica[] = [
                {
                    tipo: TipoDica.SELECAO_DESNECESSARIA,
                    severidade: NivelSeveridade.MEDIO,
                    mensagem: "Dica 1",
                    sugestao: "..."
                },
                {
                    tipo: TipoDica.PAGINACAO_FALTANTE,
                    severidade: NivelSeveridade.ALTO,
                    mensagem: "Dica 2",
                    sugestao: "..."
                }
            ];

            const texto = AnalisadorDicas.formatarDicas(dicas);

            expect(texto).toContain("(2 encontradas)");
        });

        it("deve usar singular para 1 dica", () => {
            const dicas: Dica[] = [
                {
                    tipo: TipoDica.SELECAO_DESNECESSARIA,
                    severidade: NivelSeveridade.MEDIO,
                    mensagem: "Dica 1",
                    sugestao: "..."
                }
            ];

            const texto = AnalisadorDicas.formatarDicas(dicas);

            expect(texto).toContain("(1 encontrada)");
        });
    });

    describe("Casos Reais", () => {
        it("deve analisar consulta tipicamente otimizável", () => {
            const sql = `
                SELECT * FROM usuarios u
                JOIN posts p ON u.id = p.usuario_id
                JOIN comentarios c ON p.id = c.post_id
                JOIN likes l ON c.id = l.comentario_id
            `;

            const dicas = AnalisadorDicas.analisar(sql);

            // Deve ter múltiplas dicas
            expect(dicas.length).toBeGreaterThan(1);

            // Deve incluir SELECT *
            expect(dicas.some(d => d.tipo === TipoDica.SELECAO_DESNECESSARIA)).toBe(true);

            // Deve incluir JOIN redundante
            expect(dicas.some(d => d.tipo === TipoDica.JUNCAO_REDUNDANTE)).toBe(true);

            // Deve incluir paginação
            expect(dicas.some(d => d.tipo === TipoDica.PAGINACAO_FALTANTE)).toBe(true);
        });

        it("deve analisar consulta bem otimizada", () => {
            const sql = `
                SELECT u.id, u.nome, p.titulo FROM usuarios u
                JOIN posts p ON u.id = p.usuario_id
                WHERE u.ativo = true
                LIMIT 20 OFFSET 0
            `;

            const dicas = AnalisadorDicas.analisar(sql);

            // Não deve alertar para SELECT, JOIN ou LIMIT
            expect(dicas.find(d => d.tipo === TipoDica.SELECAO_DESNECESSARIA)).toBeUndefined();
            expect(dicas.find(d => d.tipo === TipoDica.JUNCAO_REDUNDANTE)).toBeUndefined();
            expect(dicas.find(d => d.tipo === TipoDica.PAGINACAO_FALTANTE)).toBeUndefined();
        });
    });
});
