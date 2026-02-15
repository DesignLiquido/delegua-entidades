import { Taquigrafo } from "../fontes/taquigrafia";

describe('Taquigrafia', () => {
    it('cria taquígrafo com nível padrão info', () => {
        const taquigrafo = new Taquigrafo();
        expect(taquigrafo.nivel).toBe('info');
    });

    it('cria taquígrafo com nível customizado', () => {
        const taquigrafo = new Taquigrafo('depuracao');
        expect(taquigrafo.nivel).toBe('depuracao');
    });

    it('filtra mensagens abaixo do nível configurado', () => {
        const mensagens: string[] = [];
        const taquigrafo = new Taquigrafo('avisos', (msg) => mensagens.push(msg));

        taquigrafo.erro('erro teste');
        taquigrafo.aviso('aviso teste');
        taquigrafo.info('info teste');
        taquigrafo.depuracao('depuracao teste');

        expect(mensagens).toHaveLength(2);
        expect(mensagens[0]).toContain('erro teste');
        expect(mensagens[1]).toContain('aviso teste');
    });

    it('nível desligado não loga nada', () => {
        const mensagens: string[] = [];
        const taquigrafo = new Taquigrafo('desligado', (msg) => mensagens.push(msg));

        taquigrafo.erro('erro');
        taquigrafo.aviso('aviso');
        taquigrafo.info('info');
        taquigrafo.depuracao('depuracao');

        expect(mensagens).toHaveLength(0);
    });

    it('nível depuracao registra tudo', () => {
        const mensagens: string[] = [];
        const taquigrafo = new Taquigrafo('depuracao', (msg) => mensagens.push(msg));

        taquigrafo.erro('erro');
        taquigrafo.aviso('aviso');
        taquigrafo.info('info');
        taquigrafo.depuracao('depuracao');

        expect(mensagens).toHaveLength(4);
    });

    it('nível erros só registra erros', () => {
        const mensagens: string[] = [];
        const taquigrafo = new Taquigrafo('erros', (msg) => mensagens.push(msg));

        taquigrafo.erro('erro');
        taquigrafo.aviso('aviso');
        taquigrafo.info('info');

        expect(mensagens).toHaveLength(1);
        expect(mensagens[0]).toContain('[ERRO]');
    });

    it('inclui prefixo correto para cada nível', () => {
        const mensagens: string[] = [];
        const taquigrafo = new Taquigrafo('depuracao', (msg) => mensagens.push(msg));

        taquigrafo.erro('teste');
        taquigrafo.aviso('teste');
        taquigrafo.info('teste');
        taquigrafo.depuracao('teste');

        expect(mensagens[0]).toContain('[ERRO]');
        expect(mensagens[1]).toContain('[AVISO]');
        expect(mensagens[2]).toContain('[INFO]');
        expect(mensagens[3]).toContain('[DEPURAÇÃO]');
    });

    it('passa detalhes para a função de taquigrafia', () => {
        let detalhesRecebidos: any = null;
        const taquigrafo = new Taquigrafo('info', (_msg, detalhes) => {
            detalhesRecebidos = detalhes;
        });

        taquigrafo.info('teste', { chave: 'valor' });

        expect(detalhesRecebidos).toEqual({ chave: 'valor' });
    });

    it('usa console.log como padrão', () => {
        const taquigrafo = new Taquigrafo();
        expect(taquigrafo.funcaoTaquigrafia).toBeDefined();
    });
});
