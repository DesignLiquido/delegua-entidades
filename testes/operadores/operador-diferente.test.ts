import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../../fontes/entidade";
import { ConstrutorConsulta } from "../../fontes/construtor-consulta";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Operador DIFERENTE (<>)', () => {
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

    it('gera SQL com operador <> para strings', () => {
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
