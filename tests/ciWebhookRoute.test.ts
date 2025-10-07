import { describe, it, expect, vi } from 'vitest';

describe('routes/ciWebhook', () => {
  it('accepts canonical CI event via /webhooks/ci and returns 202', async () => {
    vi.resetModules();
    process.env.OBSERVABILITY_PROVIDER = 'none';
    process.env.ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY ?? 'test-key';
    const { buildServer } = await import('../src/server.js');
    const app = await buildServer();
    const payload = {
      id: '1', project: 'org/repo', repo: 'org/repo', branch: 'main', commitSha: 'deadbeef', status: 'queued'
    };
    const res = await app.inject({ method: 'POST', url: '/webhooks/ci', payload });
    expect(res.statusCode).toBe(202);
    const body = res.json();
    expect(body.id).toBe('1');
    await app.close();
  });
});


