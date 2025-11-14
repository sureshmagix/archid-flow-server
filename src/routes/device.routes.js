// ==============================================
// 🔹 Device Routes — Owner + Shared Users
// ==============================================

import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import {
  syncDevice,
  shareUserDevice,
  deleteDevice,
  getUserDevices,
  myDevices,
  sendCommand,
  recentTelemetry,
  registerDevice,
} from '../controllers/device.controller.js';

const router = Router();

// 🔹 Realm/mobile sync add/update
router.post('/sync', auth, syncDevice);

// 🔹 Share device with up to 3 users (2 control + 1 view)
router.post('/share', auth, shareUserDevice);

// 🔹 Delete device (owner) / remove shared access (shared user)
router.delete('/:deviceId', auth, deleteDevice);

// 🔹 Devices for user (owned + shared)
router.get('/user/:userId', auth, getUserDevices);
router.get('/', auth, myDevices);

// 🔹 Commands + Telemetry
router.post('/:id/command', auth, sendCommand);
router.get('/:id/telemetry', auth, recentTelemetry);

// 🔹 Legacy register
router.post('/register', auth, registerDevice);

export default router;
