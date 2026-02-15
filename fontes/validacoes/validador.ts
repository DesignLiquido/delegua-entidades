import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EntidadeInterface } from "../interfaces-tipos/entidade-interface";
import { ErroValidacao } from "../erros/erro-validacao";

export type ValidadorCustomizado = (valor: any, registro: ObjetoDeleguaClasse) => boolean | Promise<boolean>;

export interface ConfiguracaoValidadorCustomizado {
    validador: ValidadorCustomizado;
    mensagem: string;
}

export class Validador {
    /**
     * Valida um registro de acordo com os decoradores definidos na entidade.
     * @param entidade - A entidade a ser validada
     * @param registro - O registro com os dados a validar
     * @param verificadorUnicidade - Função opcional para verificar unicidade no banco de dados
     * @returns Array de erros de validação
     */
    static async validar(
        entidade: EntidadeInterface, 
        registro: ObjetoDeleguaClasse,
        verificadorUnicidade?: (campo: string, valor: any, idExcluir?: any) => Promise<boolean>
    ): Promise<ErroValidacao[]> {
        const erros: ErroValidacao[] = [];
        const chavePrimaria = entidade.obterNomeChavePrimaria();
        const idAtual = registro.propriedades[chavePrimaria];

        for (const propriedade of entidade.modelo.propriedades) {
            const nome = propriedade.nome.lexema;
            const valor = registro.propriedades[nome];

            for (const decorador of propriedade.decoradores) {
                const nomeDecorador = decorador.nome.replace(/^@/, '');
                
                switch (nomeDecorador) {
                    case 'obrigatorio':
                        if (valor === null || valor === undefined || valor === '') {
                            erros.push({
                                campo: nome,
                                mensagem: decorador.atributos?.mensagem || `O campo '${nome}' é obrigatório.`
                            });
                        }
                        break;

                    case 'comprimentoMaximo':
                        if (typeof valor === 'string' && decorador.atributos?.valor !== undefined) {
                            const maximo = decorador.atributos.valor;
                            if (valor.length > maximo) {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O campo '${nome}' deve ter no máximo ${maximo} caracteres.`
                                });
                            }
                        }
                        break;

                    case 'comprimentoMinimo':
                        if (typeof valor === 'string' && decorador.atributos?.valor !== undefined) {
                            const minimo = decorador.atributos.valor;
                            if (valor.length < minimo) {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O campo '${nome}' deve ter no mínimo ${minimo} caracteres.`
                                });
                            }
                        }
                        break;

                    case 'unico':
                        // Validador @unico: verifica se o valor já existe no banco
                        if (valor !== null && valor !== undefined && verificadorUnicidade) {
                            const existeOutro = await verificadorUnicidade(nome, valor, idAtual);
                            if (existeOutro) {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O valor '${valor}' para o campo '${nome}' já está em uso.`
                                });
                            }
                        }
                        break;

                    case 'formato':
                        // Validador @formato: valida valor contra um padrão regex
                        if (valor !== null && valor !== undefined && decorador.atributos?.padrao) {
                            const padrao = new RegExp(decorador.atributos.padrao);
                            const valorString = String(valor);
                            if (!padrao.test(valorString)) {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O valor do campo '${nome}' não está no formato esperado.`
                                });
                            }
                        }
                        break;

                    case 'minimo':
                        // Validador @minimo: valor numérico mínimo
                        if (typeof valor === 'number' && decorador.atributos?.valor !== undefined) {
                            const minimo = decorador.atributos.valor;
                            if (valor < minimo) {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O campo '${nome}' deve ser no mínimo ${minimo}.`
                                });
                            }
                        }
                        break;

                    case 'maximo':
                        // Validador @maximo: valor numérico máximo
                        if (typeof valor === 'number' && decorador.atributos?.valor !== undefined) {
                            const maximo = decorador.atributos.valor;
                            if (valor > maximo) {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O campo '${nome}' deve ser no máximo ${maximo}.`
                                });
                            }
                        }
                        break;

                    case 'email':
                        // Validador @email: valida formato de email
                        if (valor !== null && valor !== undefined) {
                            const padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            const valorString = String(valor);
                            if (!padraoEmail.test(valorString)) {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O campo '${nome}' deve ser um email válido.`
                                });
                            }
                        }
                        break;

                    case 'url':
                        // Validador @url: valida formato de URL
                        if (valor !== null && valor !== undefined) {
                            try {
                                new URL(String(valor));
                            } catch {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O campo '${nome}' deve ser uma URL válida.`
                                });
                            }
                        }
                        break;

                    case 'validadorCustomizado':
                        // Suporte a validadores customizados
                        if (decorador.atributos?.validador) {
                            const validador = decorador.atributos.validador as ValidadorCustomizado;
                            const resultado = await validador(valor, registro);
                            if (!resultado) {
                                erros.push({
                                    campo: nome,
                                    mensagem: decorador.atributos?.mensagem || 
                                        `O campo '${nome}' falhou na validação customizada.`
                                });
                            }
                        }
                        break;
                }
            }
        }

        return erros;
    }
}
