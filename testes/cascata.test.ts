import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../fontes/entidade";
import { ContextoEntidades } from "../fontes/contexto-entidades";
import { BonecoTecnologia } from "./auxiliar/boneco-tecnologia";

describe('Operações em Cascata', () => {
    let tecnologia: BonecoTecnologia;
    let contexto: ContextoEntidades;

    beforeEach(() => {
        tecnologia = new BonecoTecnologia();
        contexto = new ContextoEntidades(tecnologia);
    });

    describe('Cascata de inserção', () => {
        it('salva filhos quando cascata inclui inserir', async () => {
            // Entidade Usuario com cascata de inserção
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
                        [new Decorador(-1, 1, 'temMuitos', { 
                            entidade: 'Pedido', 
                            cascata: ['inserir'] 
                        })]
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
                        new Simbolo("IDENTIFICADOR", "descricao", "descricao", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario_id", "usuario_id", 5, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePedido = new Entidade(descritorPedido);

            contexto.registrarColecao(entidadeUsuario);
            contexto.registrarColecao(entidadePedido);

            // Criar novo usuário com pedidos
            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades['id'] = 1;
            usuario.propriedades['nome'] = 'João';
            
            const pedido1 = new ObjetoDeleguaClasse(descritorPedido);
            pedido1.propriedades['id'] = 101;
            pedido1.propriedades['descricao'] = 'Pedido A';
            
            const pedido2 = new ObjetoDeleguaClasse(descritorPedido);
            pedido2.propriedades['id'] = 102;
            pedido2.propriedades['descricao'] = 'Pedido B';
            
            usuario.propriedades['pedidos'] = [pedido1, pedido2];

            // Registrar como novo e salvar
            contexto.novo('Usuario', usuario);
            await contexto.salvarMudancas();

            // Verificar que chamadas foram feitas
            const comandos = tecnologia.comandosExecutados;
            expect(comandos.length).toBeGreaterThanOrEqual(3);
            
            // Verificar que os pedidos receberam o usuario_id
            expect(pedido1.propriedades['usuario_id']).toBe(1);
            expect(pedido2.propriedades['usuario_id']).toBe(1);
        });

        it('funciona com relacionamento temUm', async () => {
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
                        new Simbolo("IDENTIFICADOR", "perfil", "perfil", 5, -1),
                        'qualquer',
                        [new Decorador(-1, 1, 'temUm', { 
                            entidade: 'Perfil', 
                            cascata: ['inserir'] 
                        })]
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
                        new Simbolo("IDENTIFICADOR", "bio", "bio", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario_id", "usuario_id", 5, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePerfil = new Entidade(descritorPerfil);

            contexto.registrarColecao(entidadeUsuario);
            contexto.registrarColecao(entidadePerfil);

            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades['id'] = 1;
            usuario.propriedades['nome'] = 'João';
            
            const perfil = new ObjetoDeleguaClasse(descritorPerfil);
            perfil.propriedades['id'] = 10;
            perfil.propriedades['bio'] = 'Programador';
            usuario.propriedades['perfil'] = perfil;

            contexto.novo('Usuario', usuario);
            await contexto.salvarMudancas();

            expect(perfil.propriedades['usuario_id']).toBe(1);
        });

        it('não salva filhos quando cascata não inclui inserir', async () => {
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
                        [new Decorador(-1, 1, 'temMuitos', { 
                            entidade: 'Pedido'
                            // Sem cascata
                        })]
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
                        new Simbolo("IDENTIFICADOR", "descricao", "descricao", 4, -1),
                        'texto',
                        []
                    )
                ]
            );

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePedido = new Entidade(descritorPedido);

            contexto.registrarColecao(entidadeUsuario);
            contexto.registrarColecao(entidadePedido);

            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades['id'] = 1;
            usuario.propriedades['nome'] = 'João';
            usuario.propriedades['pedidos'] = [{ id: 101, descricao: 'Pedido A' }];

            contexto.novo('Usuario', usuario);
            await contexto.salvarMudancas();

            // Apenas 1 comando de inserção (do usuário)
            const comandos = tecnologia.comandosExecutados;
            expect(comandos.length).toBe(1);
        });
    });

    describe('Cascata de atualização', () => {
        it('atualiza filhos quando cascata inclui atualizar', async () => {
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
                        [new Decorador(-1, 1, 'temMuitos', { 
                            entidade: 'Pedido', 
                            cascata: ['atualizar'] 
                        })]
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
                        new Simbolo("IDENTIFICADOR", "descricao", "descricao", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario_id", "usuario_id", 5, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePedido = new Entidade(descritorPedido);

            contexto.registrarColecao(entidadeUsuario);
            contexto.registrarColecao(entidadePedido);

            // Simular usuário existente com pedidos
            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades['id'] = 1;
            usuario.propriedades['nome'] = 'João Silva';
            
            const pedido1 = new ObjetoDeleguaClasse(descritorPedido);
            pedido1.propriedades['id'] = 101;
            pedido1.propriedades['descricao'] = 'Pedido Atualizado';
            pedido1.propriedades['usuario_id'] = 1;
            usuario.propriedades['pedidos'] = [pedido1];

            // Rastrear como inalterado primeiro
            contexto.rastreador.rastrear(usuario, 'Usuario', 'inalterado');
            
            // Modificar
            usuario.propriedades['nome'] = 'João Santos';

            await contexto.salvarMudancas();

            const comandos = tecnologia.comandosExecutados;
            expect(comandos.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Cascata de exclusão', () => {
        it('exclui filhos carregados quando cascata inclui excluir', async () => {
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
                        [new Decorador(-1, 1, 'temMuitos', { 
                            entidade: 'Pedido', 
                            cascata: ['excluir'] 
                        })]
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
                        new Simbolo("IDENTIFICADOR", "descricao", "descricao", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario_id", "usuario_id", 5, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePedido = new Entidade(descritorPedido);

            contexto.registrarColecao(entidadeUsuario);
            contexto.registrarColecao(entidadePedido);

            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades['id'] = 1;
            usuario.propriedades['nome'] = 'João';
            
            const pedido1 = new ObjetoDeleguaClasse(descritorPedido);
            pedido1.propriedades['id'] = 101;
            pedido1.propriedades['descricao'] = 'Pedido A';
            pedido1.propriedades['usuario_id'] = 1;
            
            const pedido2 = new ObjetoDeleguaClasse(descritorPedido);
            pedido2.propriedades['id'] = 102;
            pedido2.propriedades['descricao'] = 'Pedido B';
            pedido2.propriedades['usuario_id'] = 1;
            
            usuario.propriedades['pedidos'] = [pedido1, pedido2];

            contexto.excluirRegistro('Usuario', usuario);
            await contexto.salvarMudancas();

            const comandos = tecnologia.comandosExecutados;
            expect(comandos.length).toBeGreaterThanOrEqual(3);
        });

        it('exclui filhos não carregados via DELETE WHERE', async () => {
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
                        [new Decorador(-1, 1, 'temMuitos', { 
                            entidade: 'Pedido', 
                            cascata: ['excluir'] 
                        })]
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
                        new Simbolo("IDENTIFICADOR", "descricao", "descricao", 4, -1),
                        'texto',
                        []
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "usuario_id", "usuario_id", 5, -1),
                        'número',
                        []
                    )
                ]
            );

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePedido = new Entidade(descritorPedido);

            contexto.registrarColecao(entidadeUsuario);
            contexto.registrarColecao(entidadePedido);

            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades['id'] = 1;
            usuario.propriedades['nome'] = 'João';
            // Sem carregar pedidos (propriedade não definida)

            contexto.excluirRegistro('Usuario', usuario);
            await contexto.salvarMudancas();

            const comandos = tecnologia.comandosExecutados;
            expect(comandos.length).toBeGreaterThanOrEqual(2);
            
            // Verificar que houve um DELETE com WHERE
            const deleteComando = comandos.find((cmd: any) => 
                typeof cmd === 'string' && cmd.includes('DELETE FROM Pedido') && cmd.includes('WHERE')
            );
            expect(deleteComando).toBeDefined();
        });

        it('não exclui filhos quando cascata não inclui excluir', async () => {
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
                        [new Decorador(-1, 1, 'temMuitos', { 
                            entidade: 'Pedido'
                            // Sem cascata de exclusão
                        })]
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
                    )
                ]
            );

            const entidadeUsuario = new Entidade(descritorUsuario);
            const entidadePedido = new Entidade(descritorPedido);

            contexto.registrarColecao(entidadeUsuario);
            contexto.registrarColecao(entidadePedido);

            const usuario = new ObjetoDeleguaClasse(descritorUsuario);
            usuario.propriedades['id'] = 1;
            usuario.propriedades['nome'] = 'João';

            contexto.excluirRegistro('Usuario', usuario);
            await contexto.salvarMudancas();

            // Apenas 1 comando DELETE (do usuário)
            const comandos = tecnologia.comandosExecutados;
            expect(comandos.length).toBe(1);
        });
    });

    describe('Múltiplas ações em cascata', () => {
        it('suporta múltiplas ações em cascata', async () => {
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
                        new Simbolo("IDENTIFICADOR", "pedidos", "pedidos", 5, -1),
                        'qualquer',
                        [new Decorador(-1, 1, 'temMuitos', { 
                            entidade: 'Pedido', 
                            cascata: ['inserir', 'atualizar', 'excluir'] 
                        })]
                    )
                ]
            );

            const entidade = new Entidade(descritorUsuario);
            const rels = entidade.obterRelacionamentos();

            expect(rels).toHaveLength(1);
            expect(rels[0].cascata).toEqual(['inserir', 'atualizar', 'excluir']);
        });
    });
});
