import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { Colecao } from "../fontes/colecao";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Relacionamentos', () => {
    describe('Detecção de relacionamentos via decoradores', () => {
        it('detecta @temMuitos', () => {
            const descritor = new DescritorTipoClasse(
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
                        new Simbolo("IDENTIFICADOR", "pedidos", "pedidos", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'temMuitos', { entidade: 'Pedido' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const rels = entidade.obterRelacionamentos();

            expect(rels).toHaveLength(1);
            expect(rels[0].tipo).toBe('temMuitos');
            expect(rels[0].nomePropriedade).toBe('pedidos');
            expect(rels[0].entidadeDestino).toBe('Pedido');
            expect(rels[0].colunaOrigem).toBe('id');
            expect(rels[0].colunaDestino).toBe('usuario_id');
        });

        it('detecta @temUm', () => {
            const descritor = new DescritorTipoClasse(
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
                        new Simbolo("IDENTIFICADOR", "perfil", "perfil", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'temUm', { entidade: 'Perfil' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const rels = entidade.obterRelacionamentos();

            expect(rels).toHaveLength(1);
            expect(rels[0].tipo).toBe('temUm');
            expect(rels[0].nomePropriedade).toBe('perfil');
            expect(rels[0].entidadeDestino).toBe('Perfil');
            expect(rels[0].colunaOrigem).toBe('id');
            expect(rels[0].colunaDestino).toBe('usuario_id');
        });

        it('detecta @pertenceA', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pedido", "Pedido", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario", "usuario", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'pertenceA', { entidade: 'Usuario' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const rels = entidade.obterRelacionamentos();

            expect(rels).toHaveLength(1);
            expect(rels[0].tipo).toBe('pertenceA');
            expect(rels[0].nomePropriedade).toBe('usuario');
            expect(rels[0].entidadeDestino).toBe('Usuario');
            expect(rels[0].colunaOrigem).toBe('usuario_id');
            expect(rels[0].colunaDestino).toBe('id');
        });

        it('usa chave estrangeira customizada quando especificada', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pedido", "Pedido", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "cliente", "cliente", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'pertenceA', { entidade: 'Usuario', chaveEstrangeira: 'id_cliente' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const rels = entidade.obterRelacionamentos();

            expect(rels[0].colunaOrigem).toBe('id_cliente');
        });

        it('retorna lista vazia quando não há relacionamentos', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Artigo", "Artigo", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "titulo", "titulo", 4, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const rels = entidade.obterRelacionamentos();
            expect(rels).toHaveLength(0);
        });

        it('detecta múltiplos relacionamentos', () => {
            const descritor = new DescritorTipoClasse(
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
                        new Simbolo("IDENTIFICADOR", "pedidos", "pedidos", 4, -1),
                        'texto',
                        [new Decorador(-1, 1, 'temMuitos', { entidade: 'Pedido' })]
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "perfil", "perfil", 5, -1),
                        'texto',
                        [new Decorador(-1, 1, 'temUm', { entidade: 'Perfil' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const rels = entidade.obterRelacionamentos();
            expect(rels).toHaveLength(2);
        });
    });

    describe('Geração de JOIN via construtor de consulta', () => {
        it('gera JOIN ESQUERDA para temMuitos', () => {
            const descritor = new DescritorTipoClasse(
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
                        new Simbolo("IDENTIFICADOR", "pedidos", "pedidos", 5, -1),
                        'texto',
                        [new Decorador(-1, 1, 'temMuitos', { entidade: 'Pedido' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologiaMock = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologiaMock);

            const consulta = colecao.consulta().incluir('pedidos');
            const sql = consulta.gerarSql();

            expect(sql).toContain('JOIN');
            expect(sql).toContain('Pedido');
        });

        it('gera JOIN INTERNA para pertenceA', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Pedido", "Pedido", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "valor", "valor", 4, -1),
                        'decimal',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario", "usuario", 5, -1),
                        'texto',
                        [new Decorador(-1, 1, 'pertenceA', { entidade: 'Usuario' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologiaMock = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologiaMock);

            const consulta = colecao.consulta().incluir('usuario');
            const sql = consulta.gerarSql();

            expect(sql).toContain('INNER JOIN');
            expect(sql).toContain('Usuario');
        });

        it('lança erro quando relacionamento não existe', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Artigo", "Artigo", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "titulo", "titulo", 4, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologiaMock = new BonecoTecnologia();
            const colecao = new Colecao(entidade, tecnologiaMock);

            expect(() => colecao.consulta().incluir('inexistente'))
                .toThrow("Relacionamento 'inexistente' não encontrado");
        });
    });
});
