// ==============================================
// 🔹 Device Routes (FINAL)
// ==============================================

import { Router } from "express";
import { auth } from "../middleware/auth.js";

import {
  syncDevice,
  shareUserDevice,
  deleteDevice,
  getUserDevices,
  myDevices,
  sendCommand,
  recentTelemetry,
  registerDevice,
} from "../controllers/device.controller.js";

const router = Router();

// Main add/update route
router.post("/sync", auth, syncDevice);

// Share device
router.post("/share", auth, shareUserDevice);

// Delete device
router.delete("/:deviceId", auth, deleteDevice);

// Load devices
router.get("/", auth, myDevices);
router.get("/user/:userId", auth, getUserDevices);

// Control device (MQTT)
router.post("/:id/command", auth, sendCommand);

// Telemetry
router.get("/:id/telemetry", auth, recentTelemetry);

// Manual register
router.post("/register", auth, registerDevice);

export default router;
