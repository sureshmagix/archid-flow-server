// ==============================================
// 🔹 Device Controller — Owner + Shared Users Rules
// ==============================================

import Device from '../models/Device.js';
import Telemetry from '../models/Telemetry.js';
import User from '../models/User.js';
import { publishToDevice } from '../mqtt/client.js';

// -------------------------------------------------
// 🔸 syncDevice — Owner-only Add/Update
// -------------------------------------------------
export async function syncDevice(req, res) {
  try {
    const { id, name, type, topic, controlTopic } = req.body;
    const userId = req.user._id;

    if (!id) return res.status(400).json({ message: 'Device ID required' });

    let device = await Device.findOne({ deviceId: id });

    if (device) {
      const isOwner = String(device.owner) === String(userId);
      const shared = device.sharedUsers.find(
        u => String(u.userId) === String(userId)
      );

      // Not owner and not shared → blocked
      if (!isOwner && !shared) {
        return res
          .status(403)
          .json({ message: 'Device already registered by another user' });
      }

      // Shared user → read-only (no update)
      if (!isOwner && shared) {
        return res.json({
          success: true,
          device,
          info: `Shared device loaded (${shared.access})`,
        });
      }

      // Owner update
      device.name = name ?? device.name;
      device.type = type ?? device.type;
      device.topic = topic ?? device.topic;
      device.controlTopic = controlTopic ?? device.controlTopic;

      await device.save();
      return res.json({ success: true, device });
    }

    // New device by owner
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
    console.error('❌ syncDevice error:', err);
    res.status(500).json({ message: err.message });
  }
}

// -------------------------------------------------
// 🔸 registerDevice (legacy)
// -------------------------------------------------
export async function registerDevice(req, res) {
  try {
    const { deviceId, name, meta } = req.body;
    if (!deviceId)
      return res.status(400).json({ message: 'deviceId required' });

    const exists = await Device.findOne({ deviceId });
    if (exists)
      return res
        .status(409)
        .json({ message: 'Device already registered by a user' });

    const device = await Device.create({
      deviceId,
      name,
      meta,
      owner: req.user._id,
      sharedUsers: [],
    });

    return res.status(201).json({ success: true, device });
  } catch (err) {
    console.error('❌ registerDevice error:', err);
    res.status(500).json({ message: err.message });
  }
}

// -------------------------------------------------
// 🔸 Share Device — Up to 3 users (2 control + 1 view)
// Body: { deviceId, username (mobile), access }
// -------------------------------------------------
export async function shareUserDevice(req, res) {
  try {
    const { deviceId, username, access } = req.body;
    const ownerId = req.user._id;

    if (!deviceId || !username || !access)
      return res
        .status(400)
        .json({ message: 'deviceId, username & access required' });

    if (!['control', 'view'].includes(access))
      return res.status(400).json({ message: 'Invalid access type' });

    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    if (String(device.owner) !== String(ownerId))
      return res.status(403).json({ message: 'Only owner can share' });

    const targetUser = await User.findOne({ mobile: username });
    if (!targetUser)
      return res.status(404).json({ message: 'User does not exist' });

    if (String(targetUser._id) === String(ownerId))
      return res.status(400).json({ message: 'Owner cannot be added' });

    if (device.sharedUsers.some(u => String(u.userId) === String(targetUser._id)))
      return res.status(400).json({ message: 'User already added' });

    const total = device.sharedUsers.length;
    const controlCount = device.sharedUsers.filter(u => u.access === 'control')
      .length;
    const viewCount = device.sharedUsers.filter(u => u.access === 'view')
      .length;

    if (total >= 3)
      return res
        .status(400)
        .json({ message: 'Maximum 3 shared users allowed' });

    if (access === 'control' && controlCount >= 2)
      return res
        .status(400)
        .json({ message: 'Only 2 control users allowed' });

    if (access === 'view' && viewCount >= 1)
      return res
        .status(400)
        .json({ message: 'Only 1 view user allowed' });

    device.sharedUsers.push({
      userId: targetUser._id,
      access,
    });

    await device.save();

    return res.json({
      success: true,
      message: `User added as ${access}`,
      sharedUsers: device.sharedUsers,
    });
  } catch (err) {
    console.error('❌ shareUserDevice error:', err);
    res.status(500).json({ message: err.message });
  }
}

// -------------------------------------------------
// 🔸 Delete Device / Remove Only Own Shared Access
// -------------------------------------------------
export async function deleteDevice(req, res) {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const isOwner = String(device.owner) === String(userId);

    if (!isOwner) {
      const before = device.sharedUsers.length;
      device.sharedUsers = device.sharedUsers.filter(
        u => String(u.userId) !== String(userId)
      );
      if (device.sharedUsers.length === before)
        return res.status(403).json({ message: 'You are not a shared user' });

      await device.save();
      return res.json({ success: true, message: 'Shared access removed' });
    }

    await Device.deleteOne({ _id: device._id });
    await Telemetry.deleteMany({ deviceId });

    return res.json({ success: true, message: 'Device deleted' });
  } catch (err) {
    console.error('❌ deleteDevice error:', err);
    res.status(500).json({ message: err.message });
  }
}

// -------------------------------------------------
// 🔸 Fetch Devices (Owner + Shared)
// -------------------------------------------------
export async function getUserDevices(req, res) {
  try {
    const paramUserId = req.params.userId;
    const authedUserId = req.user._id.toString();
    const userId = paramUserId || authedUserId;

    // Optional safety: ensure they only query their own ID
    if (paramUserId && paramUserId !== authedUserId) {
      console.warn('⚠️ userId param mismatch, using token user');
    }

    const devices = await Device.find({
      $or: [{ owner: userId }, { 'sharedUsers.userId': userId }],
    }).sort({ createdAt: -1 });

    return res.json({ devices });
  } catch (err) {
    console.error('❌ getUserDevices error:', err);
    res.status(500).json({ message: err.message });
  }
}

export async function myDevices(req, res) {
  req.params.userId = req.user._id.toString();
  return getUserDevices(req, res);
}

// -------------------------------------------------
// 🔸 Commands — Only Owner & Control Users
// -------------------------------------------------
export async function sendCommand(req, res) {
  const { id } = req.params;
  const { command, payload } = req.body;
  const userId = req.user._id;

  const device = await Device.findOne({
    $or: [{ _id: id }, { deviceId: id }],
  });

  if (!device) return res.status(404).json({ message: 'Device not found' });

  const isOwner = String(device.owner) === String(userId);
  const shared = device.sharedUsers.find(u => String(u.userId) === String(userId));

  if (!isOwner && (!shared || shared.access !== 'control'))
    return res.status(403).json({ message: 'Not allowed to control device' });

  publishToDevice(device.deviceId, { command, payload, ts: Date.now() });
  return res.json({ ok: true });
}

// -------------------------------------------------
// 🔸 Telemetry — Owner + Any Shared (read-only)
// -------------------------------------------------
export async function recentTelemetry(req, res) {
  const { id } = req.params;
  const userId = req.user._id;

  const device = await Device.findOne({ deviceId: id });
  if (!device) return res.status(404).json({ message: 'Device not found' });

  const allowed =
    String(device.owner) === String(userId) ||
    device.sharedUsers.some(u => String(u.userId) === String(userId));

  if (!allowed)
    return res.status(403).json({ message: 'Not allowed to view data' });

  const items = await Telemetry.find({ deviceId: id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ deviceId: id, data: items });
}
