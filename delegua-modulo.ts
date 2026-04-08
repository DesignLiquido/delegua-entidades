import { ContextoEntidades } from './fontes/contexto-entidades';
import { Colecao } from './fontes/colecao';
import { Configuracoes } from './fontes/configuracoes';

export const DeleguaModuloEntidades = {
    Configuracoes: {
        implementacao: Configuracoes,
        propriedades: {
            caminho:    { tipo: 'texto' },
            porta:      { tipo: 'numero' },
            host:       { tipo: 'texto' },
            usuario:    { tipo: 'texto' },
            senha:      { tipo: 'texto' },
            banco:      { tipo: 'texto' },
            tecnologia: { tipo: 'texto' },
        },
        metodos: {
            aplicar: {
                tipoRetorno: 'vazio',
                argumentos: []
            }
        }
    },
    Contexto: {
        implementacao: ContextoEntidades,
        propriedades: {},
        metodos: {
            colecao: {
                tipoRetorno: 'Colecao',
                argumentos: [
                    {
                        nome: 'tipoModelo',
                        tipo: 'qualquer'
                    }
                ]
            },
            iniciar: {
                tipoRetorno: 'vazio',
                argumentos: [
                    {
                        nome: 'caminho',
                        tipo: 'texto'
                    }
                ]
            },
            fechar: {
                tipoRetorno: 'vazio',
                argumentos: []
            },
            registrarColecao: {
                tipoRetorno: 'qualquer',
                argumentos: [
                    {
                        nome: 'entidade',
                        tipo: 'qualquer'
                    }
                ]
            },
            salvarMudancas: {
                tipoRetorno: 'vazio',
                argumentos: []
            },
            iniciarTransacao: {
                tipoRetorno: 'qualquer',
                argumentos: []
            },
            confirmarTransacao: {
                tipoRetorno: 'vazio',
                argumentos: []
            },
            reverterTransacao: {
                tipoRetorno: 'vazio',
                argumentos: []
            }
        }
    },
    Colecao: {
        implementacao: Colecao,
        propriedades: {},
        metodos: {
            todos: {
                tipoRetorno: 'qualquer',
                argumentos: []
            },
            buscarTodos: {
                tipoRetorno: 'qualquer',
                argumentos: []
            },
            buscarPorId: {
                tipoRetorno: 'qualquer',
                argumentos: [
                    {
                        nome: 'valorId',
                        tipo: 'qualquer'
                    }
                ]
            },
            obterPorId: {
                tipoRetorno: 'qualquer',
                argumentos: [
                    {
                        nome: 'valorId',
                        tipo: 'qualquer'
                    }
                ]
            },
            salvar: {
                tipoRetorno: 'qualquer',
                argumentos: [
                    {
                        nome: 'registro',
                        tipo: 'qualquer'
                    }
                ]
            },
            modificar: {
                tipoRetorno: 'qualquer',
                argumentos: [
                    {
                        nome: 'registro',
                        tipo: 'qualquer'
                    }
                ]
            },
            remover: {
                tipoRetorno: 'qualquer',
                argumentos: [
                    {
                        nome: 'registro',
                        tipo: 'qualquer'
                    }
                ]
            },
            inserir: {
                tipoRetorno: 'qualquer',
                argumentos: [
                    {
                        nome: 'registro',
                        tipo: 'qualquer'
                    }
                ]
            },
            inserirVarios: {
                tipoRetorno: 'qualquer',
                argumentos: [
                    {
                        nome: 'registros',
                        tipo: 'qualquer'
                    }
                ]
            },
            consulta: {
                tipoRetorno: 'qualquer',
                argumentos: []
            }
        }
    }
};
