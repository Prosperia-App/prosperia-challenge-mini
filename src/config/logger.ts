import pino from 'pino';
import { config } from './env.js';

const pinoConfig = config.nodeEnv === 'production' ? {} : { transport: { target: 'pino-pretty' } };

export const logger = pino(pinoConfig);
