// ==============================================
// 🔹 Telemetry Routes — User-Enriched API (FINAL)
// ==============================================

import { Router } from "express";
import { auth } from "../middleware/auth.js";

import {
  getLatestTelemetry,
  getRecentTelemetry,
  getTelemetryRange,
  getRawTelemetry,
  deleteTelemetry,
} from "../controllers/telemetry.controller.js";

const router = Router();

// ---------------------------------------------------------------
// 🔸 Get LAST telemetry sample
//     GET /api/telemetry/:deviceId/latest
// ---------------------------------------------------------------
router.get("/:deviceId/latest", auth, getLatestTelemetry);

// ---------------------------------------------------------------
// 🔸 Get last N samples
//     GET /api/telemetry/:deviceId/limit/:count
// ---------------------------------------------------------------
router.get("/:deviceId/limit/:count", auth, getRecentTelemetry);

// ---------------------------------------------------------------
// 🔸 Time-range telemetry
//     GET /api/telemetry/:deviceId/range?from=ts&to=ts
// ---------------------------------------------------------------
router.get("/:deviceId/range", auth, getTelemetryRange);

// ---------------------------------------------------------------
// 🔸 Raw telemetry (Owner-only debugging)
//     GET /api/telemetry/:deviceId/raw
// ---------------------------------------------------------------
router.get("/:deviceId/raw", auth, getRawTelemetry);

// ---------------------------------------------------------------
// 🔸 Delete telemetry (Owner-only)
//     DELETE /api/telemetry/:deviceId
// ---------------------------------------------------------------
router.delete("/:deviceId", auth, deleteTelemetry);

export default router;
