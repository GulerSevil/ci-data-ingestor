import { describe, it, expect } from 'vitest';
import { CiEventSchema } from '../src/core/models/CiEvent.js';

describe('CiEventSchema', () => {
  it('accepts a valid minimal event', () => {
    const input = {
      id: 'id-1',
      project: 'org/repo',
      repo: 'org/repo',
      branch: 'main',
      commitSha: 'deadbeef',
      status: 'queued',
    };
    const parsed = CiEventSchema.parse(input);
    expect(parsed.id).toBe('id-1');
    expect(parsed.provider).toBe('github');
    expect(parsed.eventType).toBe('pipeline');
  });

  it('computes types and constraints', () => {
    const input = {
      id: 'x',
      provider: 'github',
      project: 'p',
      repo: 'p',
      branch: 'b',
      commitSha: '1234567',
      status: 'success',
      durationMs: 0,
      metadata: { a: 1 },
    };
    const parsed = CiEventSchema.parse(input);
    expect(parsed.durationMs).toBe(0);
    expect(parsed.metadata).toEqual({ a: 1 });
  });

  it('rejects invalid commitSha length', () => {
    const input = {
      id: 'x',
      project: 'p',
      repo: 'p',
      branch: 'b',
      commitSha: '123',
      status: 'queued',
    };
    expect(() => CiEventSchema.parse(input)).toThrow();
  });
});


