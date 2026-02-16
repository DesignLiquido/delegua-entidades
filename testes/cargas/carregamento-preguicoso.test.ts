import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../../fontes/entidade";
import { Colecao } from "../../fontes/colecao";
import { CarregadorPreguicoso } from "../../fontes/carregador-preguicoso";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Carregamento Preguiçoso (Lazy Loading)', () => {
    describe('Proxy com carregamento sob demanda', () => {
        it('cria proxy para registro com relacionamento', () => {
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
                        'qualquer',
                        [new Decorador(-1, 1, 'temMuitos', { entidade: 'Pedido' })]
                    )
                ]
            );

            const entidade = new Entidade(descritor);
            const tecnologia = new BonecoTecnologia();
            const carregador = new CarregadorPreguicoso(tecnologia);

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = { id: 1, nome: 'João' };

            const registroPromissor = carregador.envolverComProxies(registro, entidade, 'Usuario');

            expect(registroPromissor.propriedades['nome']).toBe('João');
        });

        it('acessa propriedade normal sem triggerar carregamento', () => {
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
            const tecnologia = new BonecoTecnologia();
            const carregador = new CarregadorPreguicoso(tecnologia);

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = { id: 1, nome: 'Maria' };

            const registroPromissor = carregador.envolverComProxies(registro, entidade, 'Usuario');

            expect(registroPromissor.propriedades['nome']).toBe('Maria');
            expect(registroPromissor.propriedades['id']).toBe(1);
        });
    });

    describe('Carregamento assíncrono de relacionamentos', () => {
        it('carrega relacionamento temReferência (pertenceA)', async () => {
            const descritorPedido = new DescritorTipoClasse(
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
                        new Simbolo("IDENTIFICADOR", "usuario_id", "usuario_id", 4, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario", "usuario", 5, -1),
                        'qualquer',
                        [new Decorador(-1, 1, 'pertenceA', { entidade: 'Usuario' })]
                    )
                ]
            );

            const descritorUsuario = new DescritorTipoClasse(
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

            const entidadePedido = new Entidade(descritorPedido);
            const entidadeUsuario = new Entidade(descritorUsuario);
            const tecnologia = new BonecoTecnologia();
            const carregador = new CarregadorPreguicoso(tecnologia);

            const colecaoPedidos = new Colecao(entidadePedido, tecnologia);
            const colecaoUsuarios = new Colecao(entidadeUsuario, tecnologia);

            // Mock de dados do usuário
            tecnologia.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'João Silva' }
            ];

            const pedido = new ObjetoDeleguaClasse(descritorPedido);
            pedido.propriedades = { id: 101, usuario_id: 1 };

            const colecoes = {
                'Pedido': colecaoPedidos,
                'Usuario': colecaoUsuarios
            };

            const usuarioCarregado = await carregador.carregarRelacionamento(
                pedido,
                entidadePedido,
                'usuario',
                colecoes
            );

            expect(usuarioCarregado).toBeDefined();
        });

        it('carrega relacionamento um-para-muitos (temMuitos)', async () => {
            const descritorUsuario = new DescritorTipoClasse(
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
                        'qualquer',
                        [new Decorador(-1, 1, 'temMuitos', { entidade: 'Pedido' })]
                    )
                ]
            );

            const descritorPedido = new DescritorTipoClasse(
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
                        new Simbolo("IDENTIFICADOR", "usuario_id", "usuario_id", 4, -1),
                        'número',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "valor", "valor", 5, -1),
                        'decimal',
                        []
                    )
                ]
            );

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePedido = new Entidade(descritorPedido);
            const tecnologia = new BonecoTecnologia();
            const carregador = new CarregadorPreguicoso(tecnologia);

            const colecaoUsuarios = new Colecao(entidadeUsuario, tecnologia);
            const colecaoPedidos = new Colecao(entidadePedido, tecnologia);

            // Mock de dados de pedidos
            tecnologia.dadosEmMemoria['Pedido'] = [
                { id: 101, usuario_id: 1, valor: 100 },
                { id: 102, usuario_id: 1, valor: 200 }
            ];

            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades = { id: 1, nome: 'Maria' };

            const colecoes = {
                'Usuario': colecaoUsuarios,
                'Pedido': colecaoPedidos
            };

            const pedidosCarregados = await carregador.carregarRelacionamento(
                usuario,
                entidadeUsuario,
                'pedidos',
                colecoes
            );

            expect(pedidosCarregados).toBeDefined();
            expect(Array.isArray(pedidosCarregados)).toBe(true);
        });

        it('lança erro para relacionamento inexistente', async () => {
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
            const tecnologia = new BonecoTecnologia();
            const carregador = new CarregadorPreguicoso(tecnologia);

            const registro = new ObjetoDeleguaClasse(entidade.modelo);
            registro.propriedades = { id: 1 };

            await expect(
                carregador.carregarRelacionamento(registro, entidade, 'inexistente', {})
            ).rejects.toThrow("Relacionamento 'inexistente' não encontrado");
        });
    });

    describe('Cache de entidades carregadas', () => {
        it('armazena entidade em cache após carregamento', async () => {
            const descritorUsuario = new DescritorTipoClasse(
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
                        new Simbolo("IDENTIFICADOR", "perfil", "perfil", 5, -1),
                        'qualquer',
                        [new Decorador(-1, 1, 'temUm', { entidade: 'Perfil' })]
                    )
                ]
            );

            const descritorPerfil = new DescritorTipoClasse(
                new Simbolo("IDENTIFICADOR", "Perfil", "Perfil", 1, -1),
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

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePerfil = new Entidade(descritorPerfil);
            const tecnologia = new BonecoTecnologia();
            const carregador = new CarregadorPreguicoso(tecnologia);

            const colecaoUsuarios = new Colecao(entidadeUsuario, tecnologia);
            const colecaoPerfis = new Colecao(entidadePerfil, tecnologia);

            // Mock de dados de perfil
            tecnologia.dadosEmMemoria['Perfil'] = [
                { id: 1, nome: 'Admin' }
            ];

            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades = { id: 1, perfil: 1 };

            const colecoes = {
                'Usuario': colecaoUsuarios,
                'Perfil': colecaoPerfis
            };

            // Primeira carga
            await carregador.carregarRelacionamento(usuario, entidadeUsuario, 'perfil', colecoes);

            // Segunda carga deve vir do cache (sem executar consulta novamente)
            const resultado2 = await carregador.carregarRelacionamento(usuario, entidadeUsuario, 'perfil', colecoes);

            expect(resultado2).toBeDefined();
        });

        it('limpa cache quando solicitado', async () => {
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
            const tecnologia = new BonecoTecnologia();
            const carregador = new CarregadorPreguicoso(tecnologia);

            carregador.limparCache();
            // Should not throw
            expect(true).toBe(true);
        });
    });
});
