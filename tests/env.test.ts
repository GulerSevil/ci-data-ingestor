import { describe, it, expect, beforeEach, vi } from 'vitest';

// The env module executes immediately on import, so we must reset module cache
// and manipulate process.env before each import.

const importEnvFresh = async () => {
  vi.resetModules();
  // Prevent dotenv from loading external .env files to keep tests deterministic
  vi.doMock('dotenv/config', () => ({}));
  // Dynamic ESM import to re-run module initialization
  const mod = await import('../src/config/env.js');
  return mod;
};

describe('config/env', () => {
  const originalEnv = { ...process.env };
  const originalCwd = process.cwd();

  beforeEach(() => {
    // restore a clean environment for each test
    process.env = { ...originalEnv } as NodeJS.ProcessEnv;
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  });

  it('loads defaults successfully when no env provided', async () => {
    delete process.env.PORT;
    delete process.env.ELASTICSEARCH_NODE;
    delete process.env.ELASTICSEARCH_INDEX;
    delete process.env.HOST;
    const { env } = await importEnvFresh();
    expect(env.PORT).toBe(3000);
    expect(env.HOST).toBe('0.0.0.0');
    expect(env.ELASTICSEARCH_NODE).toBe('http://localhost:9200');
    expect(env.ELASTICSEARCH_INDEX).toBe('ci-events');
  });

  it('fails fast when invalid values are provided', async () => {
    process.env.PORT = '-1';
    process.env.ELASTICSEARCH_NODE = 'not-a-url';
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: unknown) => {
      throw new Error(`process.exit(${String(code)})`);
    }) as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(importEnvFresh()).rejects.toThrow(/process\.exit\(1\)/);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('respects provided valid env values', async () => {
    process.env.PORT = '4242';
    process.env.HOST = '127.0.0.1';
    process.env.ELASTICSEARCH_NODE = 'http://example.com:9200';
    const { env } = await importEnvFresh();
    expect(env.PORT).toBe(4242);
    expect(env.HOST).toBe('127.0.0.1');
    expect(env.ELASTICSEARCH_NODE).toBe('http://example.com:9200');
  });
});


