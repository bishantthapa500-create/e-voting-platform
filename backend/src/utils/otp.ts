import crypto from 'crypto';

/** Generate a cryptographically random 6-digit OTP string */
export function generateOTP(): string {
  // Use random bytes → convert to number → mod 1_000_000 → zero-pad to 6 digits
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, '0');
}

/** OTP expiry: 10 minutes from now */
export function otpExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}
