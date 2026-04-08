import fs from "fs";
import os from "os";
import path from "path";

import { lerConfiguracaoDelprops } from "../fontes/ilc/leitor-configuracao";

describe("leitor-configuracao", () => {
    function criarDiretorioTemporario(): string {
        return fs.mkdtempSync(path.join(os.tmpdir(), "delegua-entidades-config-"));
    }

    it("aceita configuracao plana em dados.<propriedade>", () => {
        const diretorio = criarDiretorioTemporario();
        const caminhoArquivo = path.join(diretorio, "configuracao.delprops");

        fs.writeFileSync(
            caminhoArquivo,
            [
                "dados.tecnologia = \"mysql\"",
                "dados.caminho = \"localhost:3306/delegua_entidades\"",
                "dados.usuario = \"root\"",
                "dados.senha = \"123123\"",
            ].join("\n")
        );

        const configuracao = lerConfiguracaoDelprops(diretorio);

        expect(configuracao).not.toBeNull();
        expect(configuracao?.dados.padrao).toEqual({
            tecnologia: "mysql",
            caminho: "localhost:3306/delegua_entidades",
            usuario: "root",
            senha: "123123",
        });
    });

    it("aceita configuracao nomeada em dados.<conexao>.<propriedade>", () => {
        const diretorio = criarDiretorioTemporario();
        const caminhoArquivo = path.join(diretorio, "configuracao.delprops");

        fs.writeFileSync(
            caminhoArquivo,
            [
                "dados.principal.tecnologia = 'postgresql'",
                "dados.principal.host = 'localhost'",
                "dados.principal.porta = 5432",
                "dados.principal.banco = 'app'",
            ].join("\n")
        );

        const configuracao = lerConfiguracaoDelprops(diretorio);

        expect(configuracao).not.toBeNull();
        expect(configuracao?.dados.principal).toEqual({
            tecnologia: "postgresql",
            host: "localhost",
            porta: 5432,
            banco: "app",
        });
    });
});
