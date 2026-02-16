# ILC (Interface por Linha de Comando)

Aqui são implementados uma série de comandos para facilitar a interação com o banco de dados, especialmente durante o desenvolvimento e testes.

## Comandos Disponíveis

### 1. Gerador de Entidades

Cria automaticamente uma nova entidade TypeScript e sua migração correspondente.

```bash
yarn gerar-entidade <NomeEntidade> [campos] [relacionamentos]
```

**Exemplos:**

```bash
# Entidade simples com campos
yarn gerar-entidade Usuario nome:texto email:texto idade:numero

# Com relacionamentos
yarn gerar-entidade Produto nome:texto preco:decimal --pertenceA Categoria

# Múltiplos relacionamentos
yarn gerar-entidade Usuario nome:texto --temMuitos Pedidos --temMuitos Comentarios
```

**Tipos Suportados:** `texto`, `numero`, `inteiro`, `decimal`, `booleano`, `logico`, `data`, `data_hora`, `timestamp`

**Opções de Relacionamento:**
- `--pertenceA <Entidade>` — Adiciona relacionamento pertence a
- `--temUm <Entidade>` — Adiciona relacionamento tem um
- `--temMuitos <Entidade>` — Adiciona relacionamento tem muitos

**Saída:**
- Cria arquivo de entidade em `fontes/nomeentidade.ts`
- Cria migração vazia em `fontes/migracoes/geradas/TIMESTAMP_criar_tabela_*.ts`
- Você deve editar a migração para implementar a criação da tabela

---

### 2. CLI de Migrações

Gerencia o ciclo de vida de migrações do banco de dados.

```bash
yarn migracoes <comando>
```

**Comandos Disponíveis:**

- `gerar` — Cria uma nova migração vazia com timestamp
- `executar` — Executa todas as migrações pendentes (padrão)
- `reverter` — Reverte a última migração executada
- `status` — Mostra status das migrações
- `desfazer` — Limpa histórico de migrações

**Exemplos:**

```bash
yarn migracoes gerar       # Cria uma nova migração
yarn migracoes status      # Mostra estado das migrações
yarn migracoes executar    # Executa todas pendentes
yarn migracoes reverter    # Reverte última execução
```

**Armazenamento:**
- Histórico de migrações: `fontes/migracoes/geradas/.migracoes.json`
- Impede re-execução de migrações já executadas

---

### 3. CLI de Sementes

Executa scripts de população do banco de dados (seeders).

```bash
yarn sementes <caminho-modulo>
```

**Estrutura do Módulo de Sementes:**

```typescript
// arquivo-sementes.ts
import { ContextoEntidades } from "@designliquido/delegua-entidades";

export async function criarContexto() {
    // Retorna contexto configurado
    return new ContextoEntidades(tecnologia);
}

export const sementes = [
    class SementeProdutos {
        async executar(contexto: ContextoEntidades) {
            const colecao = contexto.colecao(Produto);
            await colecao.inserir({ nome: "Produto 1", preco: 100 });
        }
    }
];
```

**Exemplos:**

```bash
yarn sementes ./sementes/sementes-iniciais.ts
yarn sementes ./dados/sementes-desenvolvimento.ts
```

**Características:**
- Suporta dependências entre sementes
- Topological sort automático
- Rastreamento de sementes executadas (tabela `sementes`)
- Previne re-execução de sementes já rodadas

---

## Fluxo Típico de Desenvolvimento

1. **Criar Entidade:**
   ```bash
   yarn gerar-entidade Usuario nome:texto email:texto senha:texto
   ```

2. **Editar Entidade e Migração:**
   - Revise `fontes/usuario.ts`
   - Implemente a migração em `fontes/migracoes/geradas/TIMESTAMP_*.ts`

3. **Executar Migrações:**
   ```bash
   yarn migracoes executar
   ```

4. **Verificar Status:**
   ```bash
   yarn migracoes status
   ```

5. **Popular Dados (Opcional):**
   ```bash
   yarn sementes ./sementes/dados-iniciais.ts
   ```

6. **Se Precisar Reverter:**
   ```bash
   yarn migracoes reverter
   yarn migracoes status
   ```

---

## Notas Importantes

- **PascalCase para Entidades:** `Usuario`, `Produto`, `Empresa`
- **snake_case para Campos:** `nome_completo`, `email_principal`
- **Timestamps Automáticos:** Migrações usam YYYYMMDDHHMMSS
- **Rastreamento:** Ambos CLI (migrações e sementes) rastreiam execução
- **Sem Duplicação:** Não execute migrações/sementes já rodadas