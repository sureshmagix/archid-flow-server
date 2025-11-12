// ==============================================
// 🔹 Device Routes — With Realm Cloud Sync
// ==============================================

import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import {
  registerDevice,
  myDevices,
  sendCommand,
  recentTelemetry,
  getUserDevices,
  syncDevice,
} from '../controllers/device.controller.js';

const router = Router();

// 🔸 Legacy Registration
router.post('/register', auth, [body('deviceId').notEmpty()], validate, registerDevice);

// 🔸 Sync Device (used by React Native Realm app)
router.post('/sync', auth, syncDevice);

// 🔸 Fetch all devices for user (used after login)
router.get('/user/:userId', auth, getUserDevices);

// 🔸 Logged-in user's devices
router.get('/', auth, myDevices);

// 🔸 Command and telemetry endpoints
router.post('/:id/command', auth, sendCommand);
router.get('/:id/telemetry', auth, recentTelemetry);

export default router;
