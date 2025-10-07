import type { FastifyInstance } from 'fastify';

export async function ciWebhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/ci', async (request, reply) => {
    const payload = request.body as unknown;
    const ciEvent = await app.ingestCiEvent.execute(payload);
    return reply.code(202).send(ciEvent);
  });
}


