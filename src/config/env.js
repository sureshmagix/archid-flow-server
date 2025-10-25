import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve .env path relative to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mqttUrl: process.env.MQTT_URL || 'mqtt://localhost:1883',
  namespace: process.env.IOT_NAMESPACE || 'archidtech'
};

// Debug log (optional, comment out after testing)
console.log('Loaded env:', {
  mongodbUri: config.mongodbUri,
  mqttUrl: config.mqttUrl,
});

if (!config.mongodbUri) throw new Error('MONGODB_URI missing in .env');
if (!config.jwtSecret) throw new Error('JWT_SECRET missing in .env');
