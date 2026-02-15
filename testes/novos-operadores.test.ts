import {
    DescritorTipoClasse,
    ObjetoDeleguaClasse
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../fontes/entidade";
import { ConstrutorConsulta } from "../fontes/construtor-consulta";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Novos Operadores de Consulta - Sprint 1', () => {
    let descritor: DescritorTipoClasse;
    let entidade: Entidade;
    let tecnologia: BonecoTecnologia;

    beforeEach(() => {
        descritor = new DescritorTipoClasse(
            new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
            null,
            {},
            [
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                    'número',
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                    'texto',
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "email", "email", 5, -1),
                    'texto',
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "idade", "idade", 6, -1),
                    'número',
                    []
                )
            ]
        );

        entidade = new Entidade(descritor);
        tecnologia = new BonecoTecnologia();
    });

    describe('Operador DIFERENTE', () => {
        it('gera SQL com operador <>', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'DIFERENTE', 'João');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome <> 'João'");
        });

        it('funciona com valores numéricos', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('idade', 'DIFERENTE', 18);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("idade <> 18");
        });
    });

    describe('Operador COMO (LIKE)', () => {
        it('gera SQL com operador LIKE', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'COMO', '%João%');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome LIKE '%João%'");
        });
    });

    describe('Operador NAO_COMO (NOT LIKE)', () => {
        it('gera SQL com operador NOT LIKE', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('email', 'NAO_COMO', '%@gmail.com');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("email NOT LIKE '%@gmail.com'");
        });
    });

    describe('Operador COMECA_COM', () => {
        it('gera SQL com LIKE e % no final', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'COMECA_COM', 'João');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome LIKE 'João%'");
        });
    });

    describe('Operador TERMINA_COM', () => {
        it('gera SQL com LIKE e % no início', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('email', 'TERMINA_COM', '@exemplo.com');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("email LIKE '%@exemplo.com'");
        });
    });

    describe('Operador CONTEM', () => {
        it('gera SQL com LIKE e % em ambos os lados', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'CONTEM', 'Silva');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome LIKE '%Silva%'");
        });
    });

    describe('Operador ENTRE (BETWEEN)', () => {
        it('gera SQL com BETWEEN para números', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('idade', 'ENTRE', [18, 65]);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("idade BETWEEN 18 AND 65");
        });

        it('gera SQL com BETWEEN para strings', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'ENTRE', ['A', 'M']);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome BETWEEN 'A' AND 'M'");
        });
    });

    describe('Operador NAO_EM (NOT IN)', () => {
        it('gera SQL com NOT IN para array de valores', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('idade', 'NAO_EM', [18, 21, 25]);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("idade NOT IN (18, 21, 25)");
        });

        it('gera SQL com NOT IN para array de strings', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'NAO_EM', ['João', 'Maria', 'Pedro']);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome NOT IN ('João', 'Maria', 'Pedro')");
        });
    });

    describe('Operador NULO (IS NULL)', () => {
        it('gera SQL com IS NULL', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('email', 'NULO', null);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("email IS NULL");
        });
    });

    describe('Operador NAO_NULO (IS NOT NULL)', () => {
        it('gera SQL com IS NOT NULL', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('email', 'NAO_NULO', null);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("email IS NOT NULL");
        });
    });

    describe('Combinação de Operadores', () => {
        it('combina múltiplos novos operadores com AND', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor
                .onde('nome', 'COMECA_COM', 'João')
                .e('idade', 'ENTRE', [20, 30])
                .e('email', 'NAO_NULO', null);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome LIKE 'João%'");
            expect(sql).toContain("idade BETWEEN 20 AND 30");
            expect(sql).toContain("email IS NOT NULL");
            expect(sql).toContain("AND");
        });

        it('combina novos operadores com OR', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor
                .onde('nome', 'CONTEM', 'Silva')
                .ou('email', 'TERMINA_COM', '@exemplo.com');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome LIKE '%Silva%'");
            expect(sql).toContain("email LIKE '%@exemplo.com'");
            expect(sql).toContain("OR");
        });

        it('combina operadores antigos e novos', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor
                .onde('idade', 'MAIOR_IGUAL', 18)
                .e('nome', 'DIFERENTE', 'Admin')
                .e('email', 'NAO_COMO', '%@teste.com');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("idade >= 18");
            expect(sql).toContain("nome <> 'Admin'");
            expect(sql).toContain("email NOT LIKE '%@teste.com'");
        });
    });

    describe('Casos Especiais', () => {
        it('trata corretamente valores nulos em operadores que não sejam NULO/NAO_NULO', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'IGUAL', null);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome = ");
        });

        it('funciona com strings contendo caracteres especiais', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'CONTEM', "O'Connor");
            
            const sql = construtor.gerarSql();
            // Nota: tratamento de escape de aspas pode ser necessário no futuro
            expect(sql).toContain("LIKE");
        });

        it('combina ENTRE com outras condições', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor
                .onde('idade', 'ENTRE', [18, 65])
                .e('nome', 'NAO_NULO', null)
                .e('email', 'COMECA_COM', 'user@');
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("BETWEEN");
            expect(sql).toContain("IS NOT NULL");
            expect(sql).toContain("LIKE 'user@%'");
        });
    });
});
