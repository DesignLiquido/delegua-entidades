<br>

<p align="center">
  <h3 align="center">Delégua Entidades</h3>
  <p align="center">
    Biblioteca Node.js com o intuito de trabalhar com entidades de dados, com base nas instruções da <a href="https://github.com/DesignLiquido/delegua" target="_blank">Linguagem Delégua</a>, junto com o framework <a href="https://github.com/DesignLiquido/liquido" target="_blank">Liquido</a>.
  </p>
</p>

<p align="center">
    <a href="https://github.com/DesignLiquido/delegua-entidades/issues" target="_blank">
      <img src="https://img.shields.io/github/issues/DesignLiquido/delegua-entidades" />
    </a>
    <img src="https://img.shields.io/github/stars/DesignLiquido/delegua-entidades" />
    <img src="https://img.shields.io/github/forks/DesignLiquido/delegua-entidades" />
    <a href="https://www.npmjs.com/package/DesignLiquido/delegua-entidades" target="_blank">
      <img src="https://img.shields.io/npm/v/DesignLiquido/delegua-entidades" />
    </a>
    <img src="https://img.shields.io/npm/dw/DesignLiquido/delegua-entidades" />
    <img src="https://img.shields.io/github/license/DesignLiquido/delegua-entidades" />
</p>

## Motivação

[LinConEs](https://github.com/DesignLiquido/LinConEs) nasceu da necessidade de uma linguagem de consulta em português. No entanto, escrever código de produção diretamente com uma linguagem de consulta pode ocasionar uma série de problemas, como por exemplo ataques por _SQL Injection_, uma técnica bem conhecida em que uma consulta pode ser forjada para executar operações não desejadas pelos desenvolvedores originais.

Entidades é uma biblioteca para Delégua que trabalha com estruturas de manipulação de dados em alto nível, e que torna possível uma série de funcionalidades, como por exemplo:

- Gerar código em linguagem de consulta de maneira segura, a partir de classes e objetos em Delégua, observando parâmetros e impedindo a injeção de outras consultas indesejadas nas operações da sua aplicação;
- Trabalhar de maneira agnóstica, não importando qual tecnologia de dados esteja sendo usada, seja a própria memória do servidor, um banco de dados, etc.

Essa biblioteca usa uma outra biblioteca chamada `lincones-js`, onde uma lógica menos especializada é implementada para ler sentenças escritas em LinConEs e traduzi-las para SQL. Como um passo intermediário dessa tradução, há a geração de objetos de alto nível que representam comandos a serem executados em SQL. Esta biblioteca, portanto, utiliza código Delégua para também gerar esses objetos de operações de bancos de dados de alto nível, que então são utilizados por bibliotecas especializadas em uma ou outra tecnologia para a geração do SQL final.

### Inspiração

- [Active Record (Ruby on Rails)](https://guides.rubyonrails.org/active_record_basics.html);
- [SQLAlchemy (Python)](https://www.sqlalchemy.org/)
- [Entity Framework (.NET)](https://learn.microsoft.com/en-us/aspnet/entity-framework)

## Utilização

Esta biblioteca funciona por si só apenas com [Delégua](https://github.com/DesignLiquido/delegua), mas seu maior proveito ocorre com a utilização de outras bibliotecas, usadas para escrever diversas aplicações, como sistemas Web usando [Líquido](https://github.com/DesignLiquido/liquido). Ao usar apenas por si só, toda a geração de sentenças pode ser feita ou em LinConEs, ou em SQL ANSI. Ao ser combinadas com outras bibliotecas, pode ser usada na geração de SQL mais direcionado, como por exemplo para SQLite ou PostgreSQL.

O ponto de entrada dessa biblioteca é uma classe chamada `ContextoEntidades`. Esta classe contém uma série do que chamamos de coleções de dados. Cada coleção é mapeada ou como uma _collection_ de documentos ou registros (por exemplo, se usamos NoSQL), ou como uma tabela de banco de dados (quando o banco de dados é relacional). É cada uma dessas classes de coleções que geram as sentenças que as bibliotecas tecnológicas utilizam.

Para melhor ilustrar este funcionamento, vamos supor uma tabela de banco de dados de artigos. Cada artigo possui um identificador (abreviado como `id`), um título (texto) e um conteúdo (também texto). Em Delégua, cada linha desta tabela pode ser mapeada como a seguinte classe:

```js
classe Artigo {
  id: numero
  titulo: texto
  conteudo: texto
}
```

Se queremos selecionar todos os artigos dessa classe e imprimi-los usando apenass Delégua, podemos fazê-lo da seguinte forma:

```js
const entidades = importar('entidades')
const contexto = entidades.Contexto()
const artigos = contexto.colecao(Artigo).todos()
escreva(artigos) // Imprime a lista de todos os artigos encontrados.
```

### Colunas computadas

Colunas computadas podem ser declaradas com o decorador `@computada`, informando a expressao SQL e se a coluna e persistida:

```js
classe Pedido {
  id: numero
  quantidade: numero
  preco: numero

  @computada({ expressao: "quantidade * preco", persistida: verdadeiro })
  total: numero
}
```

Colunas computadas nao sao incluídas em inserts/updates, mas podem ser lidas normalmente nas consultas.

### Comandos

Entidades conta com alguns comandos de seleção e manipulação de dados:

- `contexto.colecao(Modelo).todos()`
- `contexto.colecao(Modelo).obterPorId()`
- `contexto.colecao(Modelo).obterPorCondicao()`

Há também comandos de geração de SQL, se for interessante obter a consulta gerada antes da execução:

- `contexto.modelo(Modelo).gerarSQLSelecionar()`

## Execução por linha de comando

Este pacote não funciona sozinho em modo por linha de comando. É necessário também instalar um dos pacotes específicos de tecnologia de LinConEs. 