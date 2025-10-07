import { describe, it, expect, vi } from 'vitest';

const importServerFresh = async () => {
  vi.resetModules();
  // Ensure required ingest config is present before importing server and plugins
  process.env.ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY ?? 'test-key';
  const mod = await import('../src/server.js');
  return mod;
};

describe('health endpoints', () => {
  it('GET /health returns ok', async () => {
    const { buildServer } = await importServerFresh();
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('GET /ready returns ready true', async () => {
    const { buildServer } = await importServerFresh();
    const app = await buildServer();
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ready: true });
    await app.close();
  });
});



