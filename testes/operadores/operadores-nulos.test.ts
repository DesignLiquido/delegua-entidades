import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../../fontes/entidade";
import { ConstrutorConsulta } from "../../fontes/construtor-consulta";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Operadores de Valor Nulo (NULL)', () => {
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
                    new Simbolo("IDENTIFICADOR", "email", "email", 5, -1),
                    'texto',
                    []
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "nome", "nome", 4, -1),
                    'texto',
                    []
                )
            ]
        );

        entidade = new Entidade(descritor);
        tecnologia = new BonecoTecnologia();
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

        it('combina NAO_NULO com outras condições', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor
                .onde('nome', 'COMECA_COM', 'João')
                .e('email', 'NAO_NULO', null);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("email IS NOT NULL");
            expect(sql).toContain("AND");
        });
    });

    describe('Casos especiais com valores nulos', () => {
        it('trata corretamente valores nulos em operadores que não sejam NULO/NAO_NULO', () => {
            const construtor = new ConstrutorConsulta(entidade, tecnologia);
            construtor.onde('nome', 'IGUAL', null);
            
            const sql = construtor.gerarSql();
            expect(sql).toContain("nome = ");
        });
    });
});
