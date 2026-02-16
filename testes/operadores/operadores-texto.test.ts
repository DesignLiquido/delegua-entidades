import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../../fontes/entidade";
import { ConstrutorConsulta } from "../../fontes/construtor-consulta";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Operadores de Texto (LIKE)', () => {
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
                )
            ]
        );

        entidade = new Entidade(descritor);
        tecnologia = new BonecoTecnologia();
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

    describe('Casos especiais', () => {
        it('funciona com strings contendo caracteres especiais', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'CONTEM', "O'Connor");
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("LIKE");
        });
    });
});
