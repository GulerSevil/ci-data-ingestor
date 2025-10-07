import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { status: 'ok' } as const;
  });

  app.get('/ready', async () => {
    return { ready: true } as const;
  });
}



