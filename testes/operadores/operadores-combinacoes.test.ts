import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../../fontes/entidade";
import { ConstrutorConsulta } from "../../fontes/construtor-consulta";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Combinação de Operadores', () => {
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

    it('combina ENTRE com múltiplas condições de texto', () => {
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
