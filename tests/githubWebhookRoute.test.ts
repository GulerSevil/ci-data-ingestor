import { describe, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';

function sign(secret: string, raw: Buffer): string {
  const h = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return `sha256=${h}`;
}

const importServerFresh = async () => {
  vi.resetModules();
  process.env.ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY ?? 'test-key';
  const mod = await import('../src/server.js');
  return mod;
};

describe('routes/githubWebhook', () => {
  it('rejects when secret not configured (signature header missing)', async () => {
    const { buildServer } = await importServerFresh();
    const app = await buildServer();
    // Cannot mutate frozen config; rely on default undefined
    const res = await app.inject({
      method: 'POST', url: '/webhooks/ci/github', payload: { a: 1 }, headers: { 'x-github-event': 'push' },
    });
    // Without signature header, preValidation should 401 regardless of secret
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('rejects invalid signature', async () => {
    const { buildServer } = await importServerFresh();
    // Set env before building server so plugin reads it into config
    process.env.GITHUB_WEBHOOK_SECRET = 's';
    const app = await buildServer();
    const res = await app.inject({ method: 'POST', url: '/webhooks/ci/github', payload: { a: 1 } });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('accepts valid signature and returns 202 with mapped event', async () => {
    const { buildServer } = await importServerFresh();
    process.env.GITHUB_WEBHOOK_SECRET = 's';
    const app = await buildServer();
    // override ingest usecase to avoid ES by replacing method on existing decorator
    const executed: any[] = [];
    (app as any).ingestCiEvent = { execute: async (ev: any) => { executed.push(ev); } };

    const payload = { repository: { full_name: 'org/repo' }, ref: 'refs/heads/main', after: 'deadbeef' };
    const raw = Buffer.from(JSON.stringify(payload));
    const header = sign('s', raw);
    const res = await app.inject({
      method: 'POST',
      url: '/webhooks/ci/github',
      headers: {
        'x-github-event': 'push',
        'x-hub-signature-256': header,
        'content-type': 'application/json',
      },
      payload,
    });

    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.repo).toBe('org/repo');
    expect(executed.length).toBe(1);
    await app.close();
  });

});


