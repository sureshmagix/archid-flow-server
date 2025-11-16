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

router.post('/sync', auth, syncDevice);
router.post('/share', auth, shareUserDevice);
router.delete('/:deviceId', auth, deleteDevice);

router.get('/user/:userId', auth, getUserDevices);
router.get('/', auth, myDevices);

router.post('/:id/command', auth, sendCommand);
router.get('/:id/telemetry', auth, recentTelemetry);

router.post('/register', auth, registerDevice);

export default router;
