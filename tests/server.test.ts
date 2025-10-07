import { describe, it, expect, vi } from 'vitest';

const importServerFresh = async () => {
  vi.resetModules();
  process.env.ELASTICSEARCH_API_KEY = process.env.ELASTICSEARCH_API_KEY ?? 'test-key';
  const mod = await import('../src/server.js');
  return mod;
};

describe('server', () => {
  it('builds and exposes error handler (returns 500 JSON)', async () => {
    const { buildServer } = await importServerFresh();
    const app = await buildServer();
    // Register a route that throws
    app.get('/boom', async () => {
      const err: any = new Error('kaboom');
      err.statusCode = 500;
      throw err;
    });

    const res = await app.inject({ method: 'GET', url: '/boom' });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ message: 'Internal Server Error' });
    await app.close();
  });
});


