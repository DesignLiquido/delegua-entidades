#!/usr/bin/env node

/**
 * CLI para Gerador de Modelos (Delégua)
 * 
 * Uso:
 *   delegua-entidades gerar-modelo Usuario nome:texto email:texto idade:numero
 *   delegua-entidades gerar-modelo Usuario nome:texto --pertenceA Empresa --temMuitos Pedidos
 */

import path from "path";
import fs from "fs";
import { pluralizar } from "@designliquido/flexoes";

interface CampoModelo {
    nome: string;
    tipo: string;
}

interface ConfiguracaoRelacionamento {
    tipo: "pertenceA" | "temUm" | "temMuitos";
    modeloAlvo: string;
}

interface ConfiguracaoModelo {
    nome: string;
    campos: CampoModelo[];
    relacionamentos: ConfiguracaoRelacionamento[];
}

const DIRETORIO_MODELOS = path.join(process.cwd(), "modelos");
const DIRETORIO_MIGRACOES = path.join(process.cwd(), "migracoes", "geradas");

const MAPEAMENTO_TIPOS: { [tipo: string]: string } = {
    "texto": "texto",
    "numero": "numero",
    "inteiro": "numero",
    "decimal": "numero",
    "booleano": "logico",
    "logico": "logico",
    "data": "data",
    "data_hora": "data_hora",
    "timestamp": "data_hora"
};

function mostrarAjuda(): void {
    console.log(`
delegua-entidades: Gerador de Modelos (Delégua)

USO:
  delegua-entidades gerar-modelo <NomeModelo> [campos] [opções]

ARGUMENTOS:
  NomeModelo        Nome do modelo em PascalCase (ex: Usuario, Produto)
  campos             Campos no formato nome:tipo (ex: nome:texto email:texto)

TIPOS SUPORTADOS:
  texto, numero, inteiro, decimal, booleano, logico, data, data_hora, timestamp

OPÇÕES:
  --pertenceA <Modelo>       Adiciona relacionamento pertence a
  --temUm <Modelo>           Adiciona relacionamento tem um
  --temMuitos <Modelo>       Adiciona relacionamento tem muitos

EXEMPLOS:
  delegua-entidades gerar-modelo Usuario nome:texto email:texto idade:numero
  delegua-entidades gerar-modelo Produto nome:texto preco:decimal --pertenceA Categoria
  delegua-entidades gerar-modelo Usuario nome:texto --temMuitos Pedidos --temMuitos Comentarios

NOTAS:
  - Em Delégua, use: classe MeuModelo herda Modelo { ... }
  - Use nomes em PascalCase para nomes de modelos
  - Use nomes em minusculas para campos (ex: nome_completo, email_principal)
  - Arquivos saem em modelos/ com extensão .delegua
    `);
}

function validarNomeModelo(nome: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(nome);
}

function validarNomeCampo(nome: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(nome);
}

function validarTipo(tipo: string): boolean {
    return tipo in MAPEAMENTO_TIPOS;
}

function normalizarNomeModelo(nome: string): string {
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function obterNomeTabelaFromModelo(nomeModelo: string): string {
    // Converte PascalCase para snake_case
    const resultado = nomeModelo
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
    
    // Pluraliza em português usando flexoes
    return pluralizar(resultado);
}

function compreenderArgumentos(): ConfiguracaoModelo | null {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
        mostrarAjuda();
        return null;
    }

    const nomeModelo = normalizarNomeModelo(args[0]);

    if (!validarNomeModelo(nomeModelo)) {
        console.error(`❌ Erro: Nome de modelo inválido '${nomeModelo}'.`);
        console.error("   Use PascalCase (ex: Usuario, Produto, Empresa)");
        process.exit(1);
    }

    const campos: CampoModelo[] = [];
    const relacionamentos: ConfiguracaoRelacionamento[] = [];

    let i = 1;
    while (i < args.length) {
        const arg = args[i];

        if (arg.startsWith("--")) {
            // Opção de relacionamento
            const opcao = arg.slice(2);
            const tipoRelacionamento = opcao as keyof typeof TIPOS_RELACIONAMENTO;

            if (!(tipoRelacionamento in TIPOS_RELACIONAMENTO)) {
                console.error(`❌ Erro: Opção desconhecida '${arg}'.`);
                mostrarAjuda();
                process.exit(1);
            }

            if (i + 1 >= args.length) {
                console.error(`❌ Erro: Opção '${arg}' requer um nome de modelo.`);
                process.exit(1);
            }

            const modeloAlvo = normalizarNomeModelo(args[i + 1]);
            if (!validarNomeModelo(modeloAlvo)) {
                console.error(`❌ Erro: Nome de modelo alvo inválido '${modeloAlvo}'.`);
                process.exit(1);
            }

            relacionamentos.push({
                tipo: tipoRelacionamento,
                modeloAlvo
            });

            i += 2;
        } else if (arg.includes(":")) {
            // Campo
            const [nomeCampo, tipo] = arg.split(":");

            if (!validarNomeCampo(nomeCampo)) {
                console.error(`❌ Erro: Nome de campo inválido '${nomeCampo}'.`);
                console.error("   Use minúsculas e underscores (ex: nome_completo)");
                process.exit(1);
            }

            if (!validarTipo(tipo)) {
                console.error(`❌ Erro: Tipo inválido '${tipo}' para campo '${nomeCampo}'.`);
                console.error("   Tipos suportados: texto, numero, booleano, data, data_hora");
                process.exit(1);
            }

            campos.push({
                nome: nomeCampo,
                tipo: MAPEAMENTO_TIPOS[tipo]
            });

            i++;
        } else {
            console.error(`❌ Erro: Argumento inválido '${arg}'.`);
            mostrarAjuda();
            process.exit(1);
        }
    }

    if (campos.length === 0) {
        console.error("❌ Erro: Nenhum campo especificado.");
        console.error("   Use: delegua-entidades gerar-modelo Usuario nome:texto email:texto");
        process.exit(1);
    }

    return {
        nome: nomeModelo,
        campos,
        relacionamentos
    };
}

function gerarCodigoModelo(config: ConfiguracaoModelo): string {
    const nomeTabela = obterNomeTabelaFromModelo(config.nome);
    const camposDeclaracao = config.campos
        .map((c) => `    ${c.nome}: ${c.tipo}`)
        .join("\n");

    const relacionamentosDeclaracao = config.relacionamentos
        .map((r) => {
            let propriedade: string;
            if (r.tipo === "temMuitos") {
                // Para relações temMuitos, coloca o nome no plural da entidade alvo
                propriedade = obterNomeTabelaFromModelo(r.modeloAlvo);
            } else {
                // Para pertenceA e temUm, coloca em minúsculas (singular)
                propriedade = r.modeloAlvo.toLowerCase();
            }
            
            return `    @${r.tipo}\n    ${propriedade}: ${r.modeloAlvo}`;
        })
        .join("\n");

    const todasAsPropriedades = camposDeclaracao + 
        (relacionamentosDeclaracao ? "\n\n" + relacionamentosDeclaracao : "");

    return `/**
 * Modelo ${config.nome}
 * 
 * Tabela: ${nomeTabela}
 */
@tabela("${nomeTabela}")
classe ${config.nome} herda Modelo {
    id: numero

${todasAsPropriedades}
}
`;
}

function gerarMigracao(config: ConfiguracaoModelo): string {
    const agora = new Date();
    const timestamp = [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, "0"),
        String(agora.getDate()).padStart(2, "0"),
        String(agora.getHours()).padStart(2, "0"),
        String(agora.getMinutes()).padStart(2, "0"),
        String(agora.getSeconds()).padStart(2, "0")
    ].join("");

    const nomeTabela = obterNomeTabelaFromModelo(config.nome);
    const descricao = `Criar tabela ${nomeTabela}`;

    const colunas = ["id: INTEIRO (chave primária)"];
    config.campos.forEach((campo) => {
        const tipoSQL = converterTipoParaSQL(campo.tipo);
        colunas.push(`${campo.nome}: ${tipoSQL}`);
    });

    config.relacionamentos.forEach((rel) => {
        if (rel.tipo === "pertenceA") {
            const nomeColuna = `id_${rel.modeloAlvo.toLowerCase()}`;
            colunas.push(`${nomeColuna}: INTEIRO (chave estrangeira)`);
        }
    });

    const colunasComentario = colunas.map((c) => `    // ${c}`).join("\n");

    return `/**
 * Migração: ${descricao}
 * Timestamp: ${timestamp}
 */

classe Migracao${timestamp} herda Migracao {
    versao(): texto {
        retorne "${timestamp}"
    }

    descricao(): texto {
        retorne "${descricao}"
    }

    acima() {
        // Crie a tabela ${nomeTabela} com as seguintes colunas:
${colunasComentario}

        // Exemplo de implementação:
        // criar_tabela("${nomeTabela}", [
        //     { nome: "id", tipo: "INTEIRO", chave_primaria: verdadeiro },
${config.campos.map((c) => `        //     { nome: "${c.nome}", tipo: "${converterTipoParaSQL(c.tipo)}" }`).join(",\n")}
${config.relacionamentos
    .filter((r) => r.tipo === "pertenceA")
    .map((r) => `        //     { nome: "id_${r.modeloAlvo.toLowerCase()}", tipo: "INTEIRO" }`)
    .join(",\n")}
        // ])
    }

    abaixo() {
        // Reverta a migração aqui
        // excluir_tabela("${nomeTabela}")
    }
}
`;
}

function converterTipoParaSQL(tipoDeleguA: string): string {
    const mapeamento: { [tipo: string]: string } = {
        "texto": "TEXTO",
        "numero": "INTEIRO",
        "logico": "LOGICO",
        "data": "DATA",
        "data_hora": "DATA_HORA"
    };
    return mapeamento[tipoDeleguA] || "TEXTO";
}

function criarArquivo(caminho: string, conteudo: string): void {
    const diretorio = path.dirname(caminho);
    
    if (!fs.existsSync(diretorio)) {
        fs.mkdirSync(diretorio, { recursive: true });
    }

    if (fs.existsSync(caminho)) {
        console.error(`❌ Erro: Arquivo já existe '${caminho}'.`);
        process.exit(1);
    }

    fs.writeFileSync(caminho, conteudo, "utf-8");
}

const TIPOS_RELACIONAMENTO = {
    pertenceA: true,
    temUm: true,
    temMuitos: true
};

function principal(): void {
    const config = compreenderArgumentos();

    if (!config) {
        process.exit(1);
    }

    try {
        // Gerar arquivo de modelo
        const codigoModelo = gerarCodigoModelo(config);
        const caminhoModelo = path.join(DIRETORIO_MODELOS, `${config.nome.toLowerCase()}.delegua`);
        
        criarArquivo(caminhoModelo, codigoModelo);
        console.log(`✓ Modelo criado: ${caminhoModelo}`);

        // Gerar migração
        const codigoMigracao = gerarMigracao(config);
        const agora = new Date();
        const timestamp = [
            agora.getFullYear(),
            String(agora.getMonth() + 1).padStart(2, "0"),
            String(agora.getDate()).padStart(2, "0"),
            String(agora.getHours()).padStart(2, "0"),
            String(agora.getMinutes()).padStart(2, "0"),
            String(agora.getSeconds()).padStart(2, "0")
        ].join("");

        const nomeTabela = obterNomeTabelaFromModelo(config.nome);
        const caminhoMigracao = path.join(
            DIRETORIO_MIGRACOES,
            `${timestamp}_criar_tabela_${nomeTabela}.delegua`
        );

        criarArquivo(caminhoMigracao, codigoMigracao);
        console.log(`✓ Migração criada: ${caminhoMigracao}`);

        console.log(`\n✅ Modelo '${config.nome}' gerado com sucesso!`);
        console.log(`\nPróximos passos:`);
        console.log(`  1. Edite ${caminhoModelo} e revise os campos/relacionamentos`);
        console.log(`  2. Edite ${caminhoMigracao} e implemente a criação da tabela`);
        console.log(`  3. Rode: delegua-entidades migracoes executar`);
        console.log(`  4. Importe o modelo onde precisar`);

    } catch (erro) {
        console.error(`❌ Erro ao gerar modelo:`, erro);
        process.exit(1);
    }
}

principal();
