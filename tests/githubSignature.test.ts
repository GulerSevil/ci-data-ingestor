import { describe, it, expect } from 'vitest';
import { verifyGithubSignature } from '../src/integrations/github/signature.js';
import crypto from 'node:crypto';

describe('verifyGithubSignature', () => {
  it('returns false when header missing', () => {
    const ok = verifyGithubSignature({ secret: 's', rawBody: Buffer.from('x'), signature256Header: undefined });
    expect(ok).toBe(false);
  });

  it('validates correct sha256 signature', () => {
    const secret = 'topsecret';
    const raw = Buffer.from('hello');
    const h = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const header = `sha256=${h}`;
    const ok = verifyGithubSignature({ secret, rawBody: raw, signature256Header: header });
    expect(ok).toBe(true);
  });

  it('rejects wrong scheme or wrong signature', () => {
    const secret = 'topsecret';
    const raw = Buffer.from('hello');
    const header = `sha1=deadbeef`;
    expect(verifyGithubSignature({ secret, rawBody: raw, signature256Header: header })).toBe(false);
    const header2 = `sha256=${'0'.repeat(64)}`;
    expect(verifyGithubSignature({ secret, rawBody: raw, signature256Header: header2 })).toBe(false);
  });
});


