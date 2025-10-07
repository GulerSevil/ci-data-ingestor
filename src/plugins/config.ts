import fp from 'fastify-plugin';
import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: import('../config/env.js').Env
  }
}

export default fp(async (app) => {
  app.decorate('config', env);
});