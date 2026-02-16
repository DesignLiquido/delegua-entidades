import {
    ObjetoDeleguaClasse,
    DescritorTipoClasse,
} from "@designliquido/delegua/interpretador/estruturas";
import { PropriedadeClasse } from "@designliquido/delegua/declaracoes";
import { Simbolo } from "@designliquido/delegua/lexador";
import { Decorador } from "@designliquido/delegua/construtos";

import { Entidade } from "../../fontes/entidade";
import { ConstrutorConsulta } from "../../fontes/construtor-consulta";
import { BonecoTecnologia } from "../auxiliar/boneco-tecnologia";

describe('Carregamento Antecipado (Eager Loading)', () => {
    let tecnologia: BonecoTecnologia;
    let entidadeUsuario: Entidade;
    let entidadePedido: Entidade;

    beforeEach(() => {
        tecnologia = new BonecoTecnologia();

        // Entidade Usuario com relacionamento temMuitos
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
        entidadeUsuario = new Entidade(descritorUsuario);

        // Entidade Pedido com relacionamento pertenceA
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
                ),
                new PropriedadeClasse(
                    new Simbolo("IDENTIFICADOR", "usuario", "usuario", 6, -1),
                    'qualquer',
                    [new Decorador(-1, 1, 'pertenceA', { entidade: 'Usuario' })]
                )
            ]
        );
        entidadePedido = new Entidade(descritorPedido);
    });

    describe('incluirRelacionados()', () => {
        it('carrega relacionamento temMuitos', async () => {
            // Populate mock data: usuários
            tecnologia.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'João' },
                { id: 2, nome: 'Maria' }
            ];

            // Populate mock data: pedidos relacionados
            tecnologia.dadosEmMemoria['Pedido'] = [
                { id: 101, descricao: 'Pedido A', usuario_id: 1 },
                { id: 102, descricao: 'Pedido B', usuario_id: 1 },
                { id: 103, descricao: 'Pedido C', usuario_id: 2 }
            ];

            const consulta = new ConstrutorConsulta(entidadeUsuario, tecnologia);
            const usuarios = await consulta.incluirRelacionados('pedidos').todos();

            expect(usuarios).toHaveLength(2);
            
            // Verificar que os pedidos foram anexados
            const joao = usuarios.find(u => u.propriedades.nome === 'João');
            expect(joao).toBeDefined();
            expect(joao!.propriedades.pedidos).toBeDefined();
            expect(joao!.propriedades.pedidos).toHaveLength(2);
            expect(joao!.propriedades.pedidos[0].descricao).toBe('Pedido A');
            expect(joao!.propriedades.pedidos[1].descricao).toBe('Pedido B');

            const maria = usuarios.find(u => u.propriedades.nome === 'Maria');
            expect(maria).toBeDefined();
            expect(maria!.propriedades.pedidos).toBeDefined();
            expect(maria!.propriedades.pedidos).toHaveLength(1);
            expect(maria!.propriedades.pedidos[0].descricao).toBe('Pedido C');
        });

        it('carrega relacionamento pertenceA', async () => {
            // Populate mock data: pedidos
            tecnologia.dadosEmMemoria['Pedido'] = [
                { id: 101, descricao: 'Pedido A', usuario_id: 1 },
                { id: 102, descricao: 'Pedido B', usuario_id: 2 }
            ];

            // Populate mock data: usuários relacionados
            tecnologia.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'João' },
                { id: 2, nome: 'Maria' }
            ];

            const consulta = new ConstrutorConsulta(entidadePedido, tecnologia);
            const pedidos = await consulta.incluirRelacionados('usuario').todos();

            expect(pedidos).toHaveLength(2);
            
            // Verificar que os usuários foram anexados
            const pedidoA = pedidos.find(p => p.propriedades.descricao === 'Pedido A');
            expect(pedidoA).toBeDefined();
            expect(pedidoA!.propriedades.usuario).toBeDefined();
            expect(pedidoA!.propriedades.usuario.nome).toBe('João');

            const pedidoB = pedidos.find(p => p.propriedades.descricao === 'Pedido B');
            expect(pedidoB).toBeDefined();
            expect(pedidoB!.propriedades.usuario).toBeDefined();
            expect(pedidoB!.propriedades.usuario.nome).toBe('Maria');
        });

        it('carrega relacionamento temUm', async () => {
            // Entidade com temUm
            const descritorComTemUm = new DescritorTipoClasse(
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
                        [new Decorador(-1, 1, 'temUm', { entidade: 'Perfil' })]
                    )
                ]
            );
            const entidadeComTemUm = new Entidade(descritorComTemUm);

            // Populate mock data: usuários
            tecnologia.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'João' },
                { id: 2, nome: 'Maria' }
            ];

            // Populate mock data: perfis relacionados
            tecnologia.dadosEmMemoria['Perfil'] = [
                { id: 10, bio: 'Programador', usuario_id: 1 },
                { id: 11, bio: 'Designer', usuario_id: 2 }
            ];

            const consulta = new ConstrutorConsulta(entidadeComTemUm, tecnologia);
            const usuarios = await consulta.incluirRelacionados('perfil').todos();

            expect(usuarios).toHaveLength(2);
            
            // Verificar que os perfis foram anexados
            const joao = usuarios.find(u => u.propriedades.nome === 'João');
            expect(joao).toBeDefined();
            expect(joao!.propriedades.perfil).toBeDefined();
            expect(joao!.propriedades.perfil.bio).toBe('Programador');

            const maria = usuarios.find(u => u.propriedades.nome === 'Maria');
            expect(maria).toBeDefined();
            expect(maria!.propriedades.perfil).toBeDefined();
            expect(maria!.propriedades.perfil.bio).toBe('Designer');
        });

        it('carrega múltiplos relacionamentos', async () => {
            // Entidade com múltiplos relacionamentos
            const descritorComplexo = new DescritorTipoClasse(
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
                    ),
                    new PropriedadeClasse(
                        new Simbolo("IDENTIFICADOR", "perfil", "perfil", 6, -1),
                        'qualquer',
                        [new Decorador(-1, 1, 'temUm', { entidade: 'Perfil' })]
                    )
                ]
            );
            const entidadeCompleta = new Entidade(descritorComplexo);

            // Populate mock data: usuários
            tecnologia.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'João' }
            ];

            // Populate mock data: pedidos
            tecnologia.dadosEmMemoria['Pedido'] = [
                { id: 101, descricao: 'Pedido A', usuario_id: 1 },
                { id: 102, descricao: 'Pedido B', usuario_id: 1 }
            ];

            // Populate mock data: perfil
            tecnologia.dadosEmMemoria['Perfil'] = [
                { id: 10, bio: 'Programador', usuario_id: 1 }
            ];

            const consulta = new ConstrutorConsulta(entidadeCompleta, tecnologia);
            const usuarios = await consulta.incluirRelacionados('pedidos', 'perfil').todos();

            expect(usuarios).toHaveLength(1);
            expect(usuarios[0].propriedades.pedidos).toHaveLength(2);
            expect(usuarios[0].propriedades.perfil).toBeDefined();
            expect(usuarios[0].propriedades.perfil.bio).toBe('Programador');
        });

        it('retorna array vazio quando não há relacionados para temMuitos', async () => {
            // Populate mock data: usuários
            tecnologia.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'João' }
            ];

            // Populate mock data: sem pedidos
            tecnologia.dadosEmMemoria['Pedido'] = [];

            const consulta = new ConstrutorConsulta(entidadeUsuario, tecnologia);
            const usuarios = await consulta.incluirRelacionados('pedidos').todos();

            expect(usuarios).toHaveLength(1);
            expect(usuarios[0].propriedades.pedidos).toEqual([]);
        });

        it('retorna null quando não há relacionado para temUm', async () => {
            // Entidade com temUm
            const descritorComTemUm = new DescritorTipoClasse(
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
                        [new Decorador(-1, 1, 'temUm', { entidade: 'Perfil' })]
                    )
                ]
            );
            const entidadeComTemUm = new Entidade(descritorComTemUm);

            // Populate mock data: usuário
            tecnologia.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'João' }
            ];

            // Populate mock data: sem perfil
            tecnologia.dadosEmMemoria['Perfil'] = [];

            const consulta = new ConstrutorConsulta(entidadeComTemUm, tecnologia);
            const usuarios = await consulta.incluirRelacionados('perfil').todos();

            expect(usuarios).toHaveLength(1);
            expect(usuarios[0].propriedades.perfil).toBeNull();
        });

        it('lança erro quando relacionamento não existe', async () => {
            tecnologia.dadosEmMemoria['Usuario'] = [
                { id: 1, nome: 'João' }
            ];

            const consulta = new ConstrutorConsulta(entidadeUsuario, tecnologia);
            
            await expect(consulta.incluirRelacionados('naoExiste').todos()).rejects.toThrow(
                "Relacionamento 'naoExiste' não encontrado na entidade 'Usuario'."
            );
        });
    });
});
