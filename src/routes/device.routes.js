import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { registerDevice, myDevices, sendCommand, recentTelemetry } from 
'../controllers/device.controller.js';

const router = Router();
router.post('/register', auth, [body('deviceId').notEmpty()], validate, 
registerDevice);
router.get('/', auth, myDevices);
router.post('/:id/command', auth, sendCommand);
router.get('/:id/telemetry', auth, recentTelemetry);
export default router;
