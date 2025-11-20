// ==============================================
// 🔹 Telemetry Controller — User-Enriched (FINAL)
// ==============================================

import Device from "../models/Device.js";
import Telemetry from "../models/Telemetry.js";

import { sendEnriched } from "../utils/enrichResponse.js";
import { enrichUserFieldsDeep } from "../utils/enrichUser.js";

// ---------------------------------------------------------------
// 🔸 Helper: Check access (Owner or Shared)
// ---------------------------------------------------------------
async function checkAccess(deviceId, userId) {
  const device = await Device.findOne({ deviceId });

  if (!device) return { allowed: false, device: null, reason: "Device not found" };

  const isOwner = String(device.owner) === String(userId);
  const shared = device.sharedUsers.find((u) => String(u.userId) === String(userId));

  if (!isOwner && !shared)
    return {
      allowed: false,
      device,
      reason: "Not allowed to view telemetry",
    };

  return { allowed: true, device };
}

// ---------------------------------------------------------------
// 🔸 Get LAST 1 Telemetry Entry
//     GET /api/telemetry/:deviceId/latest
// ---------------------------------------------------------------
export async function getLatestTelemetry(req, res) {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const access = await checkAccess(deviceId, userId);
    if (!access.allowed)
      return sendEnriched(res, { success: false, message: access.reason }, 403);

    const item = await Telemetry.findOne({ deviceId })
      .sort({ createdAt: -1 })
      .lean();

    return sendEnriched(res, { success: true, deviceId, data: item });

  } catch (err) {
    console.error("❌ getLatestTelemetry error:", err);
    return sendEnriched(res, { success: false, message: err.message }, 500);
  }
}

// ---------------------------------------------------------------
// 🔸 Get LAST N Telemetry Entries
//     GET /api/telemetry/:deviceId/limit/:count
// ---------------------------------------------------------------
export async function getRecentTelemetry(req, res) {
  try {
    const { deviceId, count } = req.params;
    const userId = req.user._id;

    const limit = Math.min(parseInt(count) || 50, 200); // Safe limit

    const access = await checkAccess(deviceId, userId);
    if (!access.allowed)
      return sendEnriched(res, { success: false, message: access.reason }, 403);

    const items = await Telemetry.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return sendEnriched(res, { success: true, deviceId, data: items });

  } catch (err) {
    console.error("❌ getRecentTelemetry error:", err);
    return sendEnriched(res, { success: false, message: err.message }, 500);
  }
}

// ---------------------------------------------------------------
// 🔸 Get Telemetry Between Time Range
//     GET /api/telemetry/:deviceId/range?from=ts&to=ts
// ---------------------------------------------------------------
export async function getTelemetryRange(req, res) {
  try {
    const { deviceId } = req.params;
    const { from, to } = req.query;
    const userId = req.user._id;

    const access = await checkAccess(deviceId, userId);
    if (!access.allowed)
      return sendEnriched(res, { success: false, message: access.reason }, 403);

    if (!from || !to)
      return sendEnriched(
        res,
        { success: false, message: "from & to timestamps required" },
        400
      );

    const items = await Telemetry.find({
      deviceId,
      createdAt: { $gte: new Date(parseInt(from)), $lte: new Date(parseInt(to)) },
    })
      .sort({ createdAt: 1 })
      .lean();

    return sendEnriched(res, { success: true, deviceId, data: items });

  } catch (err) {
    console.error("❌ getTelemetryRange error:", err);
    return sendEnriched(res, { success: false, message: err.message }, 500);
  }
}

// ---------------------------------------------------------------
// 🔸 Get Raw Telemetry (Debug Mode)
//     GET /api/telemetry/:deviceId/raw
//     ⚠️ Only Owner
// ---------------------------------------------------------------
export async function getRawTelemetry(req, res) {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ deviceId });

    if (!device)
      return sendEnriched(res, { success: false, message: "Device not found" }, 404);

    if (String(device.owner) !== String(userId))
      return sendEnriched(res, {
        success: false,
        message: "Only owner can access raw telemetry",
      }, 403);

    const items = await Telemetry.find({ deviceId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return sendEnriched(res, { success: true, deviceId, data: items });

  } catch (err) {
    console.error("❌ getRawTelemetry error:", err);
    return sendEnriched(res, { success: false, message: err.message }, 500);
  }
}

// ---------------------------------------------------------------
// 🔸 Delete Telemetry (Owner Only)
//     DELETE /api/telemetry/:deviceId
// ---------------------------------------------------------------
export async function deleteTelemetry(req, res) {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ deviceId });
    if (!device)
      return sendEnriched(res, { success: false, message: "Device not found" }, 404);

    if (String(device.owner) !== String(userId))
      return sendEnriched(
        res,
        { success: false, message: "Only owner can delete telemetry" },
        403
      );

    await Telemetry.deleteMany({ deviceId });

    return sendEnriched(res, {
      success: true,
      message: "Telemetry cleared successfully",
    });

  } catch (err) {
    console.error("❌ deleteTelemetry error:", err);
    return sendEnriched(res, { success: false, message: err.message }, 500);
  }
}
