import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import sensible from './plugins/sensible.js';
import { healthRoutes } from './routes/health.js';
import config from './plugins/config.js';
import ingest from './plugins/ingest.js';
import rawBody from './plugins/rawBody.js';
import { githubWebhookRoutes } from './routes/githubWebhook.js';
import { ciWebhookRoutes } from './routes/ciWebhook.js';

async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await app.register(helmet);
  await app.register(cors, { origin: true });
  await app.register(sensible);
  await app.register(config);
  await app.register(ingest);
  await app.register(rawBody);


  await app.register(healthRoutes);
  await app.register(ciWebhookRoutes);
  await app.register(githubWebhookRoutes);

  app.setErrorHandler((error, _req, reply) => {
    const statusCode = error.statusCode ?? 500;
    const responsePayload = {
      message: statusCode >= 500 ? 'Internal Server Error' : error.message,
    } as const;
    reply.status(statusCode).send(responsePayload);
  });
  return app;
}

async function main() {
  const app = await buildServer();
  const { PORT, HOST } = app.config;
  const address = await app.listen({ port: PORT, host: HOST });
  app.log.info(`Server listening at ${address}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}

export { buildServer };



