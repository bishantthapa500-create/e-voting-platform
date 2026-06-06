import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { generateOTP, otpExpiry } from '../utils/otp';
import { sendOTP } from '../services/emailService';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback_secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_fallback_secret';

function issueAccessToken(userId: string, role: string, email: string): string {
  return jwt.sign({ userId, role, email }, ACCESS_SECRET, { expiresIn: '15m' });
}

function issueRefreshToken(userId: string): string {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ success: false, message: 'Name, email and password are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ success: false, message: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const otp = generateOTP();
  const adminCount = await User.countDocuments({ role: 'ADMIN' });
  const role = adminCount === 0 ? 'ADMIN' : 'VOTER';

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    isVerified: false,
    otpCode: otp,
    otpExpiry: otpExpiry(),
  });

  // Send OTP — fire and forget (don't fail registration if email is misconfigured)
  sendOTP(user.email, otp).catch((err) => console.error('OTP email error:', err));

  res.status(201).json({
    success: true,
    message: 'Registered successfully. Check your email for the OTP.',
    data: { userId: user._id },
  });
};

// ─── Verify OTP ──────────────────────────────────────────────────────────────
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body as { email?: string; otp?: string };

  if (!email || !otp) {
    res.status(400).json({ success: false, message: 'Email and OTP are required' });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ success: false, message: 'Account is already verified' });
    return;
  }

  if (
    !user.otpCode ||
    !user.otpExpiry ||
    user.otpCode !== otp ||
    user.otpExpiry < new Date()
  ) {
    res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    return;
  }

  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpiry = undefined;

  const accessToken = issueAccessToken(user._id.toString(), user.role, user.email);
  const refreshToken = issueRefreshToken(user._id.toString());
  user.refreshTokens.push(hashToken(refreshToken));

  await user.save();

  await AuditLog.create({
    userId: user._id,
    action: 'VERIFY_OTP',
    ip: req.ip ?? '',
    userAgent: req.headers['user-agent'] ?? '',
  });

  res.json({
    success: true,
    message: 'Email verified. Welcome!',
    data: {
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required' });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || user.isVerified) {
    // Generic response to prevent enumeration
    res.json({ success: true, message: 'If your email is unverified, a new OTP has been sent.' });
    return;
  }

  const otp = generateOTP();
  user.otpCode = otp;
  console.log(otp);
  user.otpExpiry = otpExpiry();
  await user.save();

  sendOTP(user.email, otp).catch((err) => console.error('Resend OTP error:', err));

  res.json({ success: true, message: 'OTP resent. Check your email.' });
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required' });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
    return;
  }

  const accessToken = issueAccessToken(user._id.toString(), user.role, user.email);
  const refreshToken = issueRefreshToken(user._id.toString());

  // Keep max 5 refresh tokens per user (simple rotation)
  user.refreshTokens.push(hashToken(refreshToken));
  if (user.refreshTokens.length > 5) user.refreshTokens.shift();
  await user.save();

  await AuditLog.create({
    userId: user._id,
    action: 'LOGIN',
    ip: req.ip ?? '',
    userAgent: req.headers['user-agent'] ?? '',
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    res.status(401).json({ success: false, message: 'Refresh token required' });
    return;
  }

  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(refreshToken, REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    return;
  }

  const user = await User.findById(decoded['userId']);
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found' });
    return;
  }

  const hashed = hashToken(refreshToken);
  if (!user.refreshTokens.includes(hashed)) {
    // Token reuse detected — clear all tokens (token theft)
    user.refreshTokens = [];
    await user.save();
    res.status(401).json({ success: false, message: 'Refresh token reuse detected. Please log in again.' });
    return;
  }

  // Rotate: remove old, issue new
  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  const newAccess = issueAccessToken(user._id.toString(), user.role, user.email);
  const newRefresh = issueRefreshToken(user._id.toString());
  user.refreshTokens.push(hashToken(newRefresh));
  await user.save();

  res.json({
    success: true,
    data: { accessToken: newAccess, refreshToken: newRefresh },
  });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (refreshToken) {
    const hashed = hashToken(refreshToken);
    await User.updateOne(
      { refreshTokens: hashed },
      { $pull: { refreshTokens: hashed } },
    );
  }

  res.json({ success: true, message: 'Logged out successfully' });
};
