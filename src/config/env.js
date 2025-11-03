// src/config/env.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Decide which .env file to load
const envFile =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "../../.env.production")
    : path.resolve(__dirname, "../../.env.development");

dotenv.config({ path: envFile });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3001,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mqttUrl: process.env.MQTT_URL || "ws://archidtech.in:9001",
  namespace: process.env.IOT_NAMESPACE || "archidtech",
};

console.log(`🔧 Environment: ${config.env}`);
console.log(`🌍 Using config file: ${envFile}`);

if (!config.mongodbUri) throw new Error("❌ MONGODB_URI is missing");
if (!config.jwtSecret) throw new Error("❌ JWT_SECRET is missing");
