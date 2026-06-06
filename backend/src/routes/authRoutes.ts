import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authLimiter } from '../middleware/rateLimiter';
import { register, verifyOTP, resendOTP, login, refresh, logout } from '../controllers/authController';

const router = Router();

router.post('/register', authLimiter, asyncHandler(register));
router.post('/verify-otp', authLimiter, asyncHandler(verifyOTP));
router.post('/resend-otp', authLimiter, asyncHandler(resendOTP));
router.post('/login', authLimiter, asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));

export default router;
