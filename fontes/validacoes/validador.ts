import { ObjetoDeleguaClasse } from "@designliquido/delegua/interpretador/estruturas";

import { EntidadeInterface } from "../interfaces-tipos/entidade-interface";
import { ErroValidacao } from "../erros/erro-validacao";

export class Validador {
    static validar(entidade: EntidadeInterface, registro: ObjetoDeleguaClasse): ErroValidacao[] {
        const erros: ErroValidacao[] = [];

        for (const propriedade of entidade.modelo.propriedades) {
            const nome = propriedade.nome.lexema;
            const valor = registro.propriedades[nome];

            for (const decorador of propriedade.decoradores) {
                switch (decorador.nome) {
                    case 'obrigatorio':
                    case '@obrigatorio':
                        if (valor === null || valor === undefined || valor === '') {
                            erros.push({
                                campo: nome,
                                mensagem: `O campo '${nome}' é obrigatório.`
                            });
                        }
                        break;

                    case 'comprimentoMaximo':
                    case '@comprimentoMaximo':
                        if (typeof valor === 'string' && decorador.atributos?.valor !== undefined) {
                            const maximo = decorador.atributos.valor;
                            if (valor.length > maximo) {
                                erros.push({
                                    campo: nome,
                                    mensagem: `O campo '${nome}' deve ter no máximo ${maximo} caracteres.`
                                });
                            }
                        }
                        break;

                    case 'comprimentoMinimo':
                    case '@comprimentoMinimo':
                        if (typeof valor === 'string' && decorador.atributos?.valor !== undefined) {
                            const minimo = decorador.atributos.valor;
                            if (valor.length < minimo) {
                                erros.push({
                                    campo: nome,
                                    mensagem: `O campo '${nome}' deve ter no mínimo ${minimo} caracteres.`
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
