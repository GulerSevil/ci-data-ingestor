import type { FastifyInstance } from 'fastify';
import { verifyGithubSignature } from '../integrations/github/signature.js';
import { mapGithubToCiEvent } from '../integrations/github/mapper.js';

export async function githubWebhookRoutes(app: FastifyInstance) {
  app.post('/webhooks/ci/github', {
    config: { rawBody: true },
    preValidation: async (request, reply) => {
      const secret = app.config.GITHUB_WEBHOOK_SECRET;
      if (!secret || secret.trim() === '') {
        return reply.internalServerError('Webhook secret is not configured');
      }

      const signature256 = request.headers['x-hub-signature-256'] as string | undefined;
      const raw = (request as any).rawBody as Buffer | undefined;
      if (!raw || !verifyGithubSignature({ secret, rawBody: raw, signature256Header: signature256 })) {
        return reply.unauthorized('Invalid GitHub signature');
      }
    },
  }, async (request, reply) => {
    const eventName = (request.headers['x-github-event'] as string | undefined) ?? 'unknown';
    const deliveryId = (request.headers['x-github-delivery'] as string | undefined) ?? cryptoRandomId();

    const payload = request.body as any;
    const ciEvent = mapGithubToCiEvent(eventName, deliveryId, payload);
    await app.ingestCiEvent.execute(ciEvent);
    return reply.code(202).send(ciEvent);
  });
}

function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2);
}


