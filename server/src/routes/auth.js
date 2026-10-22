import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
const router = Router();
const sign = user => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
router.post('/register', asyncHandler(async (req,res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 8) return res.status(400).json({ message: 'Name, email and a password of at least 8 characters are required.' });
  const normalized = email.trim().toLowerCase();
  if (await User.exists({ email: normalized })) return res.status(409).json({ message: 'An account with this email already exists.' });
  const user = await User.create({ name: name.trim(), email: normalized, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email } });
}));
router.post('/login', asyncHandler(async (req,res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase().trim() });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  res.json({ token: sign(user), user: { id: user._id, name: user.name, email: user.email } });
}));
router.get('/me', auth, (req,res) => res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email } }));
export default router;
