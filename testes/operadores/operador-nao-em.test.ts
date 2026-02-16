import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../../fontes/entidade";
import { ConstrutorConsulta } from "../../fontes/construtor-consulta";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Operador NAO_EM (NOT IN)', () => {
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
                    new Simbolo("IDENTIFICADOR", "idade", "idade", 6, -1),
                    'número',
                    []
                )
            ]
        );

        entidade = new Entidade(descritor);
        tecnologia = new BonecoTecnologia();
    });

    it('gera SQL com NOT IN para array de números', () => {
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
