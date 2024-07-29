<br>

<p align="center">
  <h3 align="center">Delégua Entidades</h3>
  <p align="center">
    Biblioteca Node.js com o intuito de processar SQL ANSI e <a href="https://github.com/DesignLiquido/delegua" target="_blank">LinConEs</a> com base nas instruções da <a href="https://github.com/DesignLiquido/delegua" target="_blank">Linguagem Delégua</a>, junto com o framework <a href="https://github.com/DesignLiquido/liquido" target="_blank">Liquido</a>.
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

[LinConEs](https://github.com/DesignLiquido/LinConEs) nasceu da necessidade de explicar como funciona uma linguagem de consulta. No entanto, escrever código de produção diretamente com uma linguagem de consulta pode ocasionar uma série de problemas, como por exemplo ataques por SQL Injection, uma técnica bem conhecida em que uma consulta pode ser forjada para executar operações não desejadas pelos desenvolvedores originais.

Entidades é uma biblioteca para Delégua que gera código em linguagem de consulta de maneira segura, observando parâmetros e impedindo a injeção de outras consultas indesejadas nas operações da sua aplicação.

## Utilização

Esta biblioteca funciona por si só apenas com [Delégua](https://github.com/DesignLiquido/delegua) e suas diversas aplicações, como sistemas Web usando [Líquido](https://github.com/DesignLiquido/liquido). Para funcionar, requer duas coisas:

- Uma configuração de tecnologia de banco de dados (por padrão, usamos SQLite);
- Um modelo, que nada mais é que uma classe em Delégua. Esse modelo representa a linha de uma tabela, e cada uma de suas propriedades representam colunas dessa tabela.

O ponto de entrada dessa biblioteca é uma função chamada `modelo()`. Nela, passamos como argumento a classe em Delégua que representa um modelo e o retorno dela é um objeto com diversos métodos para operações de bancos de dados. Por exemplo:

```js
classe Artigo {
  id: numero
  titulo: texto
  conteudo: texto
}

const entidades = importar('entidades')
const artigos = entidades.modelo(Artigo).todos()
escreva(artigos) // Imprime a lista de todos os artigos encontrados.
```

### Comandos

Entidades conta com alguns comandos de seleção e manipulação de dados:

- `entidades.modelo(Modelo).todos()`
- `entidades.modelo(Modelo).obterPorId()`
- `entidades.modelo(Modelo).obterPorCondicao()`

Há também comandos de geração de SQL, se for interessante obter a consulta gerada antes da execução:

- `entidades.modelo(Modelo).gerarSQLSelecionar()`

## Execução por linha de comando

Este pacote não funciona sozinho em modo por linha de comando. É necessário também instalar um dos pacotes específicos de tecnologia de LinConEs. 