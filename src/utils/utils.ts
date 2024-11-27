
import pino, { Logger } from 'pino';

export const retrieveEnvVariable = (variableName: string, logger: Logger) => {
    const variable = process.env[variableName] || '';
    if (!variable) {
        logger.error(`${variableName} is not set`);
        process.exit(1);
    }
    return variable;
};

export const transport = pino.transport({
    target: 'pino-pretty',
});

export const logger = pino(
    {
        level: 'info',
        redact: ['poolKeys'],
        serializers: {
            error: pino.stdSerializers.err,
        },
        base: undefined,
    },
    transport,
);
