#!/usr/bin/env node

/**
 * CLI para Gerador de Entidades
 * 
 * Uso:
 *   yarn gerar-entidade Usuario nome:texto email:texto idade:numero
 *   yarn gerar-entidade Usuario nome:texto --pertenceA Empresa --temMuitos Pedidos
 */

import path from "path";
import fs from "fs";

interface CampoEntidade {
    nome: string;
    tipo: string;
}

interface ConfiguracaoRelacionamento {
    tipo: "pertenceA" | "temUm" | "temMuitos";
    entidadeAlvo: string;
}

interface ConfiguracaoEntidade {
    nome: string;
    campos: CampoEntidade[];
    relacionamentos: ConfiguracaoRelacionamento[];
}

const DIRETORIO_ENTIDADES = path.join(process.cwd(), "fontes");
const DIRETORIO_MIGRACOES = path.join(process.cwd(), "fontes", "migracoes", "geradas");

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
delegua-entidades: Gerador de Entidades

USO:
  yarn gerar-entidade <NomeEntidade> [campos] [opções]

ARGUMENTOS:
  NomeEntidade       Nome da entidade em PascalCase (ex: Usuario, Produto)
  campos             Campos no formato nome:tipo (ex: nome:texto email:texto)

TIPOS SUPORTADOS:
  texto, numero, inteiro, decimal, booleano, logico, data, data_hora, timestamp

OPÇÕES:
  --pertenceA <Entidade>     Adiciona relacionamento pertence a
  --temUm <Entidade>         Adiciona relacionamento tem um
  --temMuitos <Entidade>     Adiciona relacionamento tem muitos

EXEMPLOS:
  yarn gerar-entidade Usuario nome:texto email:texto idade:numero
  yarn gerar-entidade Produto nome:texto preco:decimal --pertenceA Categoria
  yarn gerar-entidade Usuario nome:texto --temMuitos Pedidos --temMuitos Comentarios

NOTAS:
  - A entidade sempre possuirá um campo 'id: numero' como chave primária
  - Use nomes em PascalCase para nomes de entidades
  - Use nomes em minusculas para campos (ex: nome_completo, email_principal)
    `);
}

function validarNomeEntidade(nome: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(nome);
}

function validarNomeCampo(nome: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(nome);
}

function validarTipo(tipo: string): boolean {
    return tipo in MAPEAMENTO_TIPOS;
}

function normalizarNomeEntidade(nome: string): string {
    return nome.charAt(0).toUpperCase() + nome.slice(1);
}

function obterNomeTabelaFromEntidade(nomeEntidade: string): string {
    // Converte PascalCase para snake_case
    const resultado = nomeEntidade
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
    
    // Plural simples (adiciona 's')
    return resultado + "s";
}

function parseArgumentos(): ConfiguracaoEntidade | null {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
        mostrarAjuda();
        return null;
    }

    const nomeEntidade = normalizarNomeEntidade(args[0]);

    if (!validarNomeEntidade(nomeEntidade)) {
        console.error(`❌ Erro: Nome de entidade inválido '${nomeEntidade}'.`);
        console.error("   Use PascalCase (ex: Usuario, Produto, Empresa)");
        process.exit(1);
    }

    const campos: CampoEntidade[] = [];
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
                console.error(`❌ Erro: Opção '${arg}' requer um nome de entidade.`);
                process.exit(1);
            }

            const entidadeAlvo = normalizarNomeEntidade(args[i + 1]);
            if (!validarNomeEntidade(entidadeAlvo)) {
                console.error(`❌ Erro: Nome de entidade alvo inválido '${entidadeAlvo}'.`);
                process.exit(1);
            }

            relacionamentos.push({
                tipo: tipoRelacionamento,
                entidadeAlvo
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
        console.error("   Use: yarn gerar-entidade Usuario nome:texto email:texto");
        process.exit(1);
    }

    return {
        nome: nomeEntidade,
        campos,
        relacionamentos
    };
}

function gerarCodigoEntidade(config: ConfiguracaoEntidade): string {
    const nomeTabela = obterNomeTabelaFromEntidade(config.nome);
    const camposDeclaracao = config.campos
        .map((c) => `    ${c.nome}: ${c.tipo};`)
        .join("\n");

    const relacionamentosDeclaracao = config.relacionamentos
        .map((r) => {
            const propriedade = r.tipo === "temMuitos" 
                ? obterNomeTabelaFromEntidade(r.entidadeAlvo)
                : `${r.entidadeAlvo.toLowerCase()}`;
            
            return `    @${r.tipo}(() => ${r.entidadeAlvo}) ${propriedade}?: any;`;
        })
        .join("\n");

    const todasAsPropriedades = camposDeclaracao + 
        (relacionamentosDeclaracao ? "\n" + relacionamentosDeclaracao : "");

    return `import { Entidade } from "../entidade";

/**
 * Entidade ${config.nome}
 * 
 * Tabela: ${nomeTabela}
 */
@tabela("${nomeTabela}")
export class ${config.nome} extends Entidade {
    id: numero;

${todasAsPropriedades}

    constructor(dados?: Partial<${config.nome}>) {
        super();
        if (dados) {
            Object.assign(this, dados);
        }
    }
}
`;
}

function gerarMigracao(config: ConfiguracaoEntidade): string {
    const agora = new Date();
    const timestamp = [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, "0"),
        String(agora.getDate()).padStart(2, "0"),
        String(agora.getHours()).padStart(2, "0"),
        String(agora.getMinutes()).padStart(2, "0"),
        String(agora.getSeconds()).padStart(2, "0")
    ].join("");

    const nomeTabela = obterNomeTabelaFromEntidade(config.nome);
    const descricao = `Criar tabela ${nomeTabela}`;

    const colunas = ["id: INTEIRO (chave primária)"];
    config.campos.forEach((campo) => {
        const tipoSQL = converterTipoParaSQL(campo.tipo);
        colunas.push(`${campo.nome}: ${tipoSQL}`);
    });

    config.relacionamentos.forEach((rel) => {
        if (rel.tipo === "pertenceA") {
            const nomeColuna = `id_${rel.entidadeAlvo.toLowerCase()}`;
            colunas.push(`${nomeColuna}: INTEIRO (chave estrangeira)`);
        }
    });

    const colunasComentario = colunas.map((c) => `//     ${c}`).join("\n");

    return `import { Migracao } from "../../migracoes/migracao";

export const migracao = new Migracao("${timestamp}", "${descricao}");

// Crie a tabela ${nomeTabela} com as seguintes colunas:
${colunasComentario}

// Exemplo de implementação:
// migracao.criarTabela("${nomeTabela}", [
//     new Coluna("id", "INTEIRO", undefined, false, true, false, true),
${config.campos.map((c) => `//     new Coluna("${c.nome}", "${converterTipoParaSQL(c.tipo)}")`).join(",\n")}
${config.relacionamentos
    .filter((r) => r.tipo === "pertenceA")
    .map((r) => `//     new Coluna("id_${r.entidadeAlvo.toLowerCase()}", "INTEIRO")`)
    .join(",\n")}
// ]);
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

function main(): void {
    const config = parseArgumentos();

    if (!config) {
        process.exit(1);
    }

    try {
        // Gerar arquivo de entidade
        const codigoEntidade = gerarCodigoEntidade(config);
        const caminhoEntidade = path.join(DIRETORIO_ENTIDADES, `${config.nome.toLowerCase()}.ts`);
        
        criarArquivo(caminhoEntidade, codigoEntidade);
        console.log(`✓ Entidade criada: ${caminhoEntidade}`);

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

        const nomeTabela = obterNomeTabelaFromEntidade(config.nome);
        const caminhoMigracao = path.join(
            DIRETORIO_MIGRACOES,
            `${timestamp}_criar_tabela_${nomeTabela}.ts`
        );

        criarArquivo(caminhoMigracao, codigoMigracao);
        console.log(`✓ Migração criada: ${caminhoMigracao}`);

        console.log(`\n✅ Entidade '${config.nome}' gerada com sucesso!`);
        console.log(`\nPróximos passos:`);
        console.log(`  1. Edite ${caminhoEntidade} e revise os campos/relacionamentos`);
        console.log(`  2. Edite ${caminhoMigracao} e implemente a criação da tabela`);
        console.log(`  3. Rode: yarn migracoes executar`);
        console.log(`  4. Importe a entidade onde precisar`);

    } catch (erro) {
        console.error(`❌ Erro ao gerar entidade:`, erro);
        process.exit(1);
    }
}

main();
