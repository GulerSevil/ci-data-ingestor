import crypto from 'node:crypto';

export function verifyGithubSignature(params: {
  secret: string;
  rawBody: Buffer;
  signature256Header: string | undefined;
}): boolean {
  console.log('[verifyGithubSignature]', params);
  const { secret, rawBody, signature256Header } = params;
  if (!signature256Header) return false;
  const [schemeRaw, signatureRaw] = signature256Header.split('=');
  const scheme = (schemeRaw ?? '').toLowerCase();
  const signature = (signatureRaw ?? '').trim();
  if (scheme !== 'sha256' || signature.length === 0) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digestHex = hmac.digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const digBuf = Buffer.from(digestHex, 'hex');
    // GitHub signatures are 64 hex chars (32 bytes)
    if (signature.length !== 64) return false;
    if (sigBuf.length !== digBuf.length) return false;
    const equal = crypto.timingSafeEqual(sigBuf, digBuf);
  
    return equal;
  } catch {
    return false;
  }
}


