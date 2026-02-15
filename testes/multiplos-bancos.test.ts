import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";

import { ContextoEntidades } from "../fontes/contexto-entidades";
import { Entidade } from "../fontes/entidade";
import { RoteadorBancos } from "../fontes/roteador-bancos";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Múltiplos Bancos de Dados', () => {
    describe('Roteador de Bancos', () => {
        it('registra um banco de dados', () => {
            const roteador = new RoteadorBancos();
            const tecnologia = new BonecoTecnologia();

            roteador.registrarBanco('principal', tecnologia, true);

            expect(roteador.possuiBanco('principal')).toBe(true);
        });

        it('lança erro ao registrar banco com nome vazio', () => {
            const roteador = new RoteadorBancos();
            const tecnologia = new BonecoTecnologia();

            expect(() => roteador.registrarBanco('', tecnologia))
                .toThrow('Nome do banco não pode estar vazio');
        });

        it('obtém tecnologia para um banco registrado', () => {
            const roteador = new RoteadorBancos();
            const tecnologia = new BonecoTecnologia();

            roteador.registrarBanco('principal', tecnologia);
            const obtida = roteador.obterTecnologia('principal');

            expect(obtida).toBe(tecnologia);
        });

        it('lança erro ao obter banco não registrado', () => {
            const roteador = new RoteadorBancos();

            expect(() => roteador.obterTecnologia('inexistente'))
                .toThrow("Banco de dados 'inexistente' não foi registrado");
        });

        it('obtém tecnologia padrão', () => {
            const roteador = new RoteadorBancos();
            const tecnologiaPadrao = new BonecoTecnologia();
            const tecnologiaSecundaria = new BonecoTecnologia();

            roteador.registrarBanco('padrão', tecnologiaPadrao, true);
            roteador.registrarBanco('secundaria', tecnologiaSecundaria);

            expect(roteador.obterTecnologiaPadrao()).toBe(tecnologiaPadrao);
        });

        it('registra múltiplos bancos', () => {
            const roteador = new RoteadorBancos();
            const tecnologia1 = new BonecoTecnologia();
            const tecnologia2 = new BonecoTecnologia();

            const configuracoes = {
                'principal': { nome: 'principal', tipo: 'sqlite' as const, banco: 'principal.db', padrao: true },
                'analise': { nome: 'analise', tipo: 'sqlite' as const, banco: 'analise.db' }
            };

            const tecnologias = {
                'principal': tecnologia1,
                'analise': tecnologia2
            };

            roteador.registrarBancos(configuracoes, tecnologias);

            expect(roteador.possuiBanco('principal')).toBe(true);
            expect(roteador.possuiBanco('analise')).toBe(true);
            expect(roteador.obterNomeBancoPadrao()).toBe('principal');
        });

        it('lista bancos registrados', () => {
            const roteador = new RoteadorBancos();
            const tecnologia1 = new BonecoTecnologia();
            const tecnologia2 = new BonecoTecnologia();

            roteador.registrarBanco('principal', tecnologia1, true);
            roteador.registrarBanco('secundaria', tecnologia2);

            const bancos = roteador.listarBancos();
            expect(bancos).toContain('principal');
            expect(bancos).toContain('secundaria');
        });

        it('remove banco registrado', () => {
            const roteador = new RoteadorBancos();
            const tecnologia1 = new BonecoTecnologia();
            const tecnologia2 = new BonecoTecnologia();

            roteador.registrarBanco('principal', tecnologia1, true);
            roteador.registrarBanco('secundaria', tecnologia2);

            roteador.removerBanco('secundaria');

            expect(roteador.possuiBanco('secundaria')).toBe(false);
        });

        it('lança erro ao remover banco padrão', () => {
            const roteador = new RoteadorBancos();
            const tecnologia = new BonecoTecnologia();

            roteador.registrarBanco('padrão', tecnologia, true);

            expect(() => roteador.removerBanco('padrão'))
                .toThrow('Não é possível remover o banco padrão');
        });

        it('lança erro ao registrar banco sem tecnologia fornecida', () => {
            const roteador = new RoteadorBancos();
            const configuracoes = {
                'principal': { nome: 'principal', tipo: 'sqlite' as const, banco: 'principal.db' }
            };

            expect(() => roteador.registrarBancos(configuracoes, {}))
                .toThrow("Tecnologia para banco 'principal' não foi fornecida");
        });
    });

    describe('Contexto com Múltiplos Bancos', () => {
        it('contexto é inicializado com banco padrão', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const bancos = contexto.obterRoteador().listarBancos();
            expect(bancos).toContain('padrão');
        });

        it('registra novo banco no contexto', () => {
            const tecnologiaPadrao = new BonecoTecnologia();
            const tecnologiaSecundaria = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologiaPadrao);

            contexto.registrarBanco('analise', tecnologiaSecundaria);

            expect(contexto.obterRoteador().possuiBanco('analise')).toBe(true);
        });

        it('obtém tecnologia para um banco específico', () => {
            const tecnologiaPadrao = new BonecoTecnologia();
            const tecnologiaAnalise = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologiaPadrao);

            contexto.registrarBanco('analise', tecnologiaAnalise);

            const obtida = contexto.obterTecnologia('analise');
            expect(obtida).toBe(tecnologiaAnalise);
        });

        it('registra entidade no banco padrão quando nenhum banco é especificado', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

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
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            contexto.registrarColecao(entidade);

            expect(contexto.obterRoteador().obterTecnologiaParaEntidade(entidade)).toBe(tecnologia);
        });
    });

    describe('Roteamento de Entidades', () => {
        it('retorna nome de banco padrão quando nenhum é especificado', () => {
            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            expect(entidade.obterNomeBancoDados()).toBe('padrão');
        });

        it('obtém tecnologia para entidade sem banco especificado', () => {
            const tecnologiaPadrao = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologiaPadrao);

            const descritor = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Usuario", "Usuario", 1, -1),
                null,
                {},
                [
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "id", "id", 3, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = contexto.obterRoteador().obterTecnologiaParaEntidade(entidade);

            expect(tecnologia).toBe(tecnologiaPadrao);
        });
    });

    describe('Configuração de Múltiplos Bancos', () => {
        it('registra múltiplos bancos com configuração', () => {
            const tecnologiaPrincipal = new BonecoTecnologia();
            const tecnologiaSecundaria = new BonecoTecnologia();
            const tecnologiaAnalise = new BonecoTecnologia();

            const contexto = new ContextoEntidades(tecnologiaPrincipal);

            const configuracoes = {
                'padrão': { nome: 'padrão', tipo: 'sqlite' as const, banco: 'db.db', padrao: true },
                'secundaria': { nome: 'secundaria', tipo: 'sqlite' as const, banco: 'secundaria.db' },
                'analise': { nome: 'analise', tipo: 'sqlite' as const, banco: 'analise.db' }
            };

            const tecnologias = {
                'padrão': tecnologiaPrincipal,
                'secundaria': tecnologiaSecundaria,
                'analise': tecnologiaAnalise
            };

            contexto.registrarBancos(configuracoes, tecnologias);

            expect(contexto.obterRoteador().listarBancos().length).toBeGreaterThanOrEqual(3);
            expect(contexto.obterRoteador().possuiBanco('secundaria')).toBe(true);
            expect(contexto.obterRoteador().possuiBanco('analise')).toBe(true);
        });

        it('obtém roteador para acesso avançado', () => {
            const tecnologia = new BonecoTecnologia();
            const contexto = new ContextoEntidades(tecnologia);

            const roteador = contexto.obterRoteador();
            expect(roteador).toBeInstanceOf(RoteadorBancos);
        });
    });
});
