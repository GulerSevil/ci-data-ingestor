import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@elastic/elasticsearch', () => {
  const Client = vi.fn(function (this: any, options: any) {
    (this as any).options = options;
  });
  return { Client };
});

describe('createElasticsearchClient', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws when API key is missing', async () => {
    const { createElasticsearchClient } = await import('../src/integrations/elasticsearch/client.js');
    expect(() => createElasticsearchClient({
      ELASTICSEARCH_NODE: 'http://localhost:9200',
      ELASTICSEARCH_INDEX: 'idx',
      NODE_ENV: 'test',
      HOST: '0.0.0.0',
      PORT: 3000,
      OBSERVABILITY_PROVIDER: 'elasticsearch',
      ELASTICSEARCH_API_KEY: undefined,
      GITHUB_WEBHOOK_SECRET: undefined,
    } as any)).toThrow(/ELASTICSEARCH_API_KEY is required/);
  });

  it('configures apiKey auth when API key provided', async () => {
    const { createElasticsearchClient } = await import('../src/integrations/elasticsearch/client.js');
    const env = {
      ELASTICSEARCH_NODE: 'http://example.com:9200',
      ELASTICSEARCH_INDEX: 'idx',
      NODE_ENV: 'test',
      HOST: '0.0.0.0',
      PORT: 3000,
      OBSERVABILITY_PROVIDER: 'elasticsearch',
      ELASTICSEARCH_API_KEY: 'abc123',
      GITHUB_WEBHOOK_SECRET: undefined,
    } as any;
    const client: any = createElasticsearchClient(env);
    expect(client).toBeTruthy();
    // Access the mocked constructor calls
    const { Client } = await import('@elastic/elasticsearch');
    const calls = (Client as any).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0].node).toBe('http://example.com:9200');
    expect((calls[0][0] as any).auth).toEqual({ apiKey: 'abc123' });
  });
});


