# ILC (Interface por Linha de Comando)

Aqui são implementados uma série de comandos para facilitar a interação com o banco de dados, especialmente durante o desenvolvimento e testes.

## Comandos Disponíveis

## 1. Gerador de Modelos (Delégua)

Cria automaticamente um novo modelo Delégua e sua migração correspondente.

```bash
yarn gerar-modelo <NomeModelo> [campos] [relacionamentos]
```

**Exemplos:**

```bash
# Modelo simples com campos
yarn gerar-modelo Usuario nome:texto email:texto idade:numero

# Com relacionamentos
yarn gerar-modelo Produto nome:texto preco:decimal --pertenceA Categoria

# Múltiplos relacionamentos
yarn gerar-modelo Usuario nome:texto --temMuitos Pedidos --temMuitos Comentarios
```

**Tipos Suportados:** `texto`, `numero`, `inteiro`, `decimal`, `booleano`, `logico`, `data`, `data_hora`, `timestamp`

**Opções de Relacionamento:**
- `--pertenceA <Modelo>` — Adiciona relacionamento pertence a
- `--temUm <Modelo>` — Adiciona relacionamento tem um
- `--temMuitos <Modelo>` — Adiciona relacionamento tem muitos

**Saída:**
- Cria arquivo de modelo em `modelos/nomemodelo.delegua` (sintaxe Delégua)
- Cria migração em `migracoes/geradas/TIMESTAMP_criar_tabela_*.delegua` (sintaxe Delégua)
- Você deve editar a migração para implementar a criação da tabela

**Nota:** Os arquivos gerados estão em **Delégua**, não em TypeScript. Exemplo de saída:
```delegua
classe Usuario herda Modelo {
    id: numero
    nome: texto
    email: texto
}
```

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

1. **Criar Modelo:**
   ```bash
   yarn gerar-modelo Usuario nome:texto email:texto senha:texto
   ```

2. **Editar Modelo e Migração:**
   - Revise `modelos/usuario.delegua`
   - Implemente a migração em `migracoes/geradas/TIMESTAMP_*.delegua`

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

- **PascalCase para Modelos:** `Usuario`, `Produto`, `Empresa`
- **snake_case para Campos:** `nome_completo`, `email_principal`
- **Linguagem:** Modelos e migrações são gerados em **Delégua** (não TypeScript)
- **Estrutura:** Models em `modelos/`, Migrações em `migracoes/geradas/`
- **Extensões:** `.delegua` para modelos e migrações
- **Timestamps Automáticos:** Migrações usam YYYYMMDDHHMMSS
- **Rastreamento:** Ambos CLI (migrações e sementes) rastreiam execução
- **Sem Duplicação:** Não execute migrações/sementes já rodadas