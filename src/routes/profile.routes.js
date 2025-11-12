// src/routes/profile.routes.js
import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/:mobile', auth, getProfile);
router.post('/update', auth, updateProfile);

export default router;
