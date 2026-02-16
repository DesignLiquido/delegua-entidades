import {
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { Entidade } from "../../fontes/entidade";
import { ConstrutorConsulta } from "../../fontes/construtor-consulta";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Operador ENTRE (BETWEEN)', () => {
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

    it('combina ENTRE com outras condições', () => {
        const construtor = new ConstrutorConsulta(entidade, tecnologia);
        construtor
            .onde('idade', 'ENTRE', [18, 65])
            .e('nome', 'DIFERENTE', 'Admin');
        
        const sql = construtor.gerarSql();
        expect(sql).toContain("BETWEEN");
        expect(sql).toContain("<>");
    });
});
