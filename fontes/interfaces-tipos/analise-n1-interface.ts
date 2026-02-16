import { InformacaoConsulta } from "./informacao-consulta-interface";

/**
 * Análise de um padrão N+1 detectado.
 */
export interface AnaliseN1 {
    detectado: boolean;
    consultaPrincipal?: InformacaoConsulta;
    consultasRelacionadas?: InformacaoConsulta[];
    quantidadeRegistros?: number;
    quantidadeConsultas?: number;
    sugestao?: string;
}
