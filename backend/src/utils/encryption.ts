import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM

function getKey(): Buffer {
  const raw = process.env.VOTE_ENCRYPTION_KEY ?? '';
  if (!raw) throw new Error('VOTE_ENCRYPTION_KEY is not set');
  // Derive a 32-byte key from whatever length the env var is
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptVote(payload: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(hex):tag(hex):ciphertext(hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptVote(cipher: string): string {
  const key = getKey();
  const [ivHex, tagHex, dataHex] = cipher.split(':');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Invalid encrypted payload format');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

/**
 * HMAC-SHA256 of (userId + electionId) with VOTER_ID_SECRET.
 * Produces an anonymous, deterministic identifier — same user+election
 * always yields the same hash, but it cannot be reversed to find the voter.
 */
export function hashVoterId(userId: string, electionId: string): string {
  const secret = process.env.VOTER_ID_SECRET ?? '';
  if (!secret) throw new Error('VOTER_ID_SECRET is not set');
  return crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${electionId}`)
    .digest('hex');
}
