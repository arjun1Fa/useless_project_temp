import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.IS_PRODUCTION ? 'info' : 'debug',
  transport: env.IS_PRODUCTION
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});
