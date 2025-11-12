// ==============================================
// 🔹 Device Controller — CRUD + Cloud Sync
// ==============================================

import Device from '../models/Device.js';
import Telemetry from '../models/Telemetry.js';
import { publishToDevice } from '../mqtt/client.js';

// -------------------------------------------------
// 🔸 Sync Device (Add or Update from Mobile App)
// -------------------------------------------------
export async function syncDevice(req, res) {
  try {
    const { id, name, type, topic, controlTopic, userId } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Device id is required' });
    }

    const ownerId = userId || req.user?._id;
    if (!ownerId) {
      return res.status(400).json({ message: 'User ID missing' });
    }

    let device = await Device.findOne({ deviceId: id });

    if (device) {
      // Update existing
      device.name = name || device.name;
      device.type = type || device.type;
      device.topic = topic || device.topic;
      device.controlTopic = controlTopic || device.controlTopic;
      device.owner = ownerId;
      await device.save();
      console.log(`🔄 Updated existing device → ${id}`);
    } else {
      // Create new
      device = await Device.create({
        deviceId: id,
        name,
        type,
        topic,
        controlTopic,
        owner: ownerId,
      });
      console.log(`✅ Created new device → ${id}`);
    }

    return res.json({ success: true, device });
  } catch (err) {
    console.error('❌ syncDevice error:', err);
    res.status(500).json({ message: 'Failed to sync device', error: err.message });
  }
}

// -------------------------------------------------
// 🔸 Get Devices for a User (Mobile Login Sync)
// -------------------------------------------------
export async function getUserDevices(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const devices = await Device.find({ owner: userId }).sort({ createdAt: -1 });
    return res.json({ devices });
  } catch (err) {
    console.error('❌ getUserDevices error:', err);
    res.status(500).json({ message: 'Failed to fetch devices', error: err.message });
  }
}

// -------------------------------------------------
// 🔸 Register Device (Legacy API)
// -------------------------------------------------
export async function registerDevice(req, res) {
  const { deviceId, name, meta } = req.body;

  if (!deviceId) {
    return res.status(400).json({ message: 'deviceId is required' });
  }

  const exists = await Device.findOne({ deviceId });
  if (exists) {
    return res.status(409).json({ message: 'Device already registered' });
  }

  const device = await Device.create({
    deviceId,
    name,
    meta,
    owner: req.user._id,
  });

  return res.status(201).json({ device });
}

// -------------------------------------------------
// 🔸 Get Devices for Logged-in User (Legacy)
// -------------------------------------------------
export async function myDevices(req, res) {
  const devices = await Device.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });
  return res.json({ devices });
}

// -------------------------------------------------
// 🔸 Send Command via MQTT
// -------------------------------------------------
export async function sendCommand(req, res) {
  const { id } = req.params;
  const { command, payload } = req.body;

  const device = await Device.findOne({ $or: [{ _id: id }, { deviceId: id }] });
  if (!device) {
    return res.status(404).json({ message: 'Device not found' });
  }

  if (String(device.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not your device' });
  }

  publishToDevice(device.deviceId, { command, payload, ts: Date.now() });
  return res.json({ ok: true });
}

// -------------------------------------------------
// 🔸 Recent Telemetry Fetch
// -------------------------------------------------
export async function recentTelemetry(req, res) {
  const { id } = req.params;
  const items = await Telemetry.find({ deviceId: id })
    .sort({ createdAt: -1 })
    .limit(50);
  return res.json({ deviceId: id, data: items });
}
