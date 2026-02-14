import { Taquigrafo } from "../fontes/taquigrafia";

describe('Logger', () => {
    it('cria logger com nível padrão info', () => {
        const logger = new Taquigrafo();
        expect(logger.nivel).toBe('info');
    });

    it('cria logger com nível customizado', () => {
        const logger = new Taquigrafo('depuracao');
        expect(logger.nivel).toBe('depuracao');
    });

    it('filtra mensagens abaixo do nível configurado', () => {
        const mensagens: string[] = [];
        const logger = new Taquigrafo('avisos', (msg) => mensagens.push(msg));

        logger.erro('erro teste');
        logger.aviso('aviso teste');
        logger.info('info teste');
        logger.depuracao('depuracao teste');

        expect(mensagens).toHaveLength(2);
        expect(mensagens[0]).toContain('erro teste');
        expect(mensagens[1]).toContain('aviso teste');
    });

    it('nível desligado não loga nada', () => {
        const mensagens: string[] = [];
        const logger = new Taquigrafo('desligado', (msg) => mensagens.push(msg));

        logger.erro('erro');
        logger.aviso('aviso');
        logger.info('info');
        logger.depuracao('depuracao');

        expect(mensagens).toHaveLength(0);
    });

    it('nível depuracao loga tudo', () => {
        const mensagens: string[] = [];
        const logger = new Taquigrafo('depuracao', (msg) => mensagens.push(msg));

        logger.erro('erro');
        logger.aviso('aviso');
        logger.info('info');
        logger.depuracao('depuracao');

        expect(mensagens).toHaveLength(4);
    });

    it('nível erros só loga erros', () => {
        const mensagens: string[] = [];
        const logger = new Taquigrafo('erros', (msg) => mensagens.push(msg));

        logger.erro('erro');
        logger.aviso('aviso');
        logger.info('info');

        expect(mensagens).toHaveLength(1);
        expect(mensagens[0]).toContain('[ERRO]');
    });

    it('inclui prefixo correto para cada nível', () => {
        const mensagens: string[] = [];
        const logger = new Taquigrafo('depuracao', (msg) => mensagens.push(msg));

        logger.erro('teste');
        logger.aviso('teste');
        logger.info('teste');
        logger.depuracao('teste');

        expect(mensagens[0]).toContain('[ERRO]');
        expect(mensagens[1]).toContain('[AVISO]');
        expect(mensagens[2]).toContain('[INFO]');
        expect(mensagens[3]).toContain('[DEPURAÇÃO]');
    });

    it('passa detalhes para a função de log', () => {
        let detalhesRecebidos: any = null;
        const logger = new Taquigrafo('info', (_msg, detalhes) => {
            detalhesRecebidos = detalhes;
        });

        logger.info('teste', { chave: 'valor' });

        expect(detalhesRecebidos).toEqual({ chave: 'valor' });
    });

    it('usa console.log como padrão', () => {
        const logger = new Taquigrafo();
        expect(logger.funcaoLog).toBeDefined();
    });
});
