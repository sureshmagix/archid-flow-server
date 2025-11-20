// ==============================================
// 🔹 Device Controller — Owner + Shared Users Rules (UPDATED FINAL VERSION)
// ==============================================

import Device from '../models/Device.js';
import Telemetry from '../models/Telemetry.js';
import User from '../models/User.js';
import { publishToDevice } from '../mqtt/client.js';

// -------------------------------------------------
// 🔸 syncDevice — Add / Update device
// -------------------------------------------------
export async function syncDevice(req, res) {
  try {
    const { id, name, type, topic, controlTopic } = req.body;
    const userId = req.user._id;

    if (!id)
      return res.status(400).json({ success: false, message: "Device ID required" });

    let device = await Device.findOne({ deviceId: id });

    // ---------------------------------------------------------------
    // ✔ CASE 1 — Device ALREADY EXISTS
    // ---------------------------------------------------------------
    if (device) {
      const isOwner = String(device.owner) === String(userId);
      const shared = device.sharedUsers.find(
        (u) => String(u.userId) === String(userId)
      );

      // ❌ Already owned by another user
      if (!isOwner && !shared) {
        return res.status(403).json({
          success: false,
          message: "Device already owned by another user. Ask the owner to share it.",
          code: "DEVICE_ALREADY_OWNED",
        });
      }

      // ✔ Shared user → just return device
      if (!isOwner && shared) {
        return res.json({
          success: true,
          device,
          sharedAccess: shared.access,
          message: `Device is shared with you (${shared.access} access)`,
        });
      }

      // ✔ FIX: If device has no owner (legacy bug), assign owner now
      if (!device.owner) {
        device.owner = userId;
      }

      // ✔ Owner can update device fields
      device.name = name ?? device.name;
      device.type = type ?? device.type;
      device.topic = topic ?? device.topic;
      device.controlTopic = controlTopic ?? device.controlTopic;

      await device.save();
      return res.json({ success: true, device });
    }

    // ---------------------------------------------------------------
    // ✔ CASE 2 — NEW DEVICE
    // ---------------------------------------------------------------
    device = await Device.create({
      deviceId: id,
      name,
      type,
      topic,
      controlTopic,
      owner: userId,
      sharedUsers: [],
    });

    return res.status(201).json({ success: true, device });
  } catch (err) {
    console.error("❌ syncDevice error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// -------------------------------------------------
// 🔸 Manual Register
// -------------------------------------------------
export async function registerDevice(req, res) {
  try {
    const { deviceId, name, meta } = req.body;

    if (!deviceId)
      return res.status(400).json({ success: false, message: "deviceId required" });

    const exists = await Device.findOne({ deviceId });
    if (exists) {
      return res.status(403).json({
        success: false,
        message: "Device already owned by another user.",
        code: "DEVICE_ALREADY_OWNED",
      });
    }

    const device = await Device.create({
      deviceId,
      name,
      meta,
      owner: req.user._id,
      sharedUsers: [],
    });

    return res.status(201).json({ success: true, device });
  } catch (err) {
    console.error("❌ registerDevice error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// -------------------------------------------------
// 🔸 Share Device (Only Owner)
// -------------------------------------------------
export async function shareUserDevice(req, res) {
  try {
    const { deviceId, username, access } = req.body;
    const ownerId = req.user._id;

    if (!deviceId || !username || !access)
      return res.status(400).json({
        success: false,
        message: "deviceId, username & access required",
      });

    if (!["control", "view"].includes(access))
      return res.status(400).json({ success: false, message: "Invalid access type" });

    const device = await Device.findOne({ deviceId });
    if (!device)
      return res.status(404).json({ success: false, message: "Device not found" });

    if (String(device.owner) !== String(ownerId))
      return res.status(403).json({ success: false, message: "Only owner can share this device" });

    // Find user by mobile or username
    const targetUser = await User.findOne({
      $or: [{ mobile: username }, { username }],
    });

    if (!targetUser)
      return res.status(404).json({ success: false, message: "User does not exist" });

    // Prevent sharing with yourself
    if (String(targetUser._id) === String(ownerId))
      return res.status(400).json({
        success: false,
        message: "Owner cannot be added as shared user",
      });

    // Prevent duplicate share
    if (device.sharedUsers.some((u) => String(u.userId) === String(targetUser._id)))
      return res.status(400).json({ success: false, message: "User already added" });

    // Apply your limits
    const controlCount = device.sharedUsers.filter((u) => u.access === "control").length;
    const viewCount = device.sharedUsers.filter((u) => u.access === "view").length;

    if (device.sharedUsers.length >= 3)
      return res.status(400).json({ message: "Max 3 shared users allowed" });

    if (access === "control" && controlCount >= 2)
      return res.status(400).json({ message: "Only 2 control users allowed" });

    if (access === "view" && viewCount >= 1)
      return res.status(400).json({ message: "Only 1 view user allowed" });

    // Save shared user
    device.sharedUsers.push({
      userId: targetUser._id,
      username: targetUser.username || targetUser.mobile, // 🔥 ADDED
      access,
    });

    await device.save();

    return res.json({
      success: true,
      message: `User added as ${access}`,
      sharedUsers: device.sharedUsers,
    });
  } catch (err) {
    console.error("❌ shareUserDevice error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// -------------------------------------------------
// 🔸 Unshare Device (Owner Only)
// -------------------------------------------------
export async function unshareUserDevice(req, res) {
  try {
    const { deviceId, userId } = req.body;
    const ownerId = req.user._id;

    if (!deviceId || !userId)
      return res.status(400).json({
        success: false,
        message: "deviceId and userId required",
      });

    const device = await Device.findOne({ deviceId });
    if (!device)
      return res.status(404).json({ success: false, message: "Device not found" });

    // Only owner can unshare
    if (String(device.owner) !== String(ownerId))
      return res.status(403).json({
        success: false,
        message: "Only owner can remove shared access",
      });

    const before = device.sharedUsers.length;

    device.sharedUsers = device.sharedUsers.filter(
      (u) => String(u.userId) !== String(userId)
    );

    if (before === device.sharedUsers.length)
      return res.status(400).json({ success: false, message: "User not found in share list" });

    await device.save();

    return res.json({
      success: true,
      message: "User removed from shared list",
      sharedUsers: device.sharedUsers,
    });
  } catch (err) {
    console.error("❌ unshareUserDevice error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

// -------------------------------------------------
// 🔸 Delete Device / Remove Own Shared Access
// -------------------------------------------------
export async function deleteDevice(req, res) {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    // 1️⃣ Fetch device
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res
        .status(404)
        .json({ success: false, message: "Device not found" });
    }

    const isOwner = String(device.owner) === String(userId);

    // ================================================
    // 2️⃣ If shared user → remove only their access
    // ================================================
    if (!isOwner) {
      const beforeCount = device.sharedUsers.length;

      device.sharedUsers = device.sharedUsers.filter(
        (u) => String(u.userId) !== String(userId)
      );

      if (beforeCount === device.sharedUsers.length) {
        return res.status(403).json({
          success: false,
          message: "You do not have shared access",
        });
      }

      await device.save();

      // ⭐ Also remove from user.sharedDevices list
      await User.updateOne(
        { _id: userId },
        { $pull: { sharedDevices: { deviceId } } }
      );

      return res.json({
        success: true,
        message: "Shared access removed successfully",
      });
    }

    // ================================================
    // 3️⃣ Owner → Delete device everywhere
    // ================================================

    // Delete the device document
    await Device.deleteOne({ _id: device._id });

    // Delete all telemetry for that device
    await Telemetry.deleteMany({ deviceId });

    // ⭐ Remove device from ALL users' sharedDevices lists
    await User.updateMany(
      {},
      { $pull: { sharedDevices: { deviceId } } }
    );

    // ⭐ Also remove from OWNER's device list if stored anywhere
    await User.updateOne(
      { _id: device.owner },
      { $pull: { devices: { deviceId } } }
    );

    return res.json({
      success: true,
      message: "Device deleted successfully for all users",
    });
  } catch (err) {
    console.error("❌ deleteDevice error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}


// -------------------------------------------------
// 🔸 Get Devices (Owner + Shared)
// -------------------------------------------------
export async function getUserDevices(req, res) {
  try {
    const userId = req.user._id.toString();

    const devices = await Device.find({
      $or: [{ owner: userId }, { "sharedUsers.userId": userId }],
    }).sort({ createdAt: -1 });

    return res.json({ success: true, devices });
  } catch (err) {
    console.error("❌ getUserDevices error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function myDevices(req, res) {
  return getUserDevices(req, res);
}

// -------------------------------------------------
// 🔸 Send Command (MQTT)
// -------------------------------------------------
export async function sendCommand(req, res) {
  const { id } = req.params;
  const { command, payload } = req.body;

  const userId = req.user._id;

  const device = await Device.findOne({
    $or: [{ _id: id }, { deviceId: id }],
  });

  if (!device)
    return res.status(404).json({ success: false, message: "Device not found" });

  const isOwner = String(device.owner) === String(userId);
  const shared = device.sharedUsers.find((u) => String(u.userId) === String(userId));

  if (!isOwner && (!shared || shared.access !== "control"))
    return res.status(403).json({
      success: false,
      message: "Not allowed to control this device",
    });

  publishToDevice(device.deviceId, {
    command,
    payload,
    ts: Date.now(),
  });

  return res.json({ success: true });
}

// -------------------------------------------------
// 🔸 Telemetry
// -------------------------------------------------
export async function recentTelemetry(req, res) {
  const { id } = req.params;
  const userId = req.user._id;

  const device = await Device.findOne({ deviceId: id });
  if (!device)
    return res.status(404).json({ success: false, message: "Device not found" });

  const allowed =
    String(device.owner) === String(userId) ||
    device.sharedUsers.some((u) => String(u.userId) === String(userId));

  if (!allowed)
    return res.status(403).json({
      success: false,
      message: "Not allowed to view data",
    });

  const items = await Telemetry.find({ deviceId: id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, deviceId: id, data: items });
}
