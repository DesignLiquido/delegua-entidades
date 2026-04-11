import { InformacaoConsultaInterface } from "./informacao-consulta-interface";

/**
 * Análise de um padrão N+1 detectado.
 */
export interface AnaliseN1Interface {
    detectado: boolean;
    consultaPrincipal?: InformacaoConsultaInterface;
    consultasRelacionadas?: InformacaoConsultaInterface[];
    quantidadeRegistros?: number;
    quantidadeConsultas?: number;
    sugestao?: string;
}
