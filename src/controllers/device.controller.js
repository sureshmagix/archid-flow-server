import Device from "../models/Device.js";
import Telemetry from "../models/Telemetry.js";
import { publishToDevice } from "../mqtt/client.js";

export async function registerDevice(req, res) {
  const { deviceId, name, meta } = req.body;

  if (!deviceId) {
    return res.status(400).json({ message: "deviceId is required" });
  }

  const exists = await Device.findOne({ deviceId });
  if (exists) {
    return res.status(409).json({ message: "Device already registered" });
  }

  const device = await Device.create({
    deviceId,
    name,
    meta,
    owner: req.user._id,
  });

  return res.status(201).json({ device });
}

export async function myDevices(req, res) {
  const devices = await Device.find({ owner: req.user._id }).sort({
    createdAt: -1,
  });
  return res.json({ devices });
}

export async function sendCommand(req, res) {
  const { id } = req.params;
  const { command, payload } = req.body;

  const device = await Device.findOne({ $or: [{ _id: id }, { deviceId: id }] });
  if (!device) {
    return res.status(404).json({ message: "Device not found" });
  }

  if (String(device.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your device" });
  }

  publishToDevice(device.deviceId, { command, payload, ts: Date.now() });
  return res.json({ ok: true });
}

export async function recentTelemetry(req, res) {
  const { id } = req.params;
  const items = await Telemetry.find({ deviceId: id })
    .sort({ createdAt: -1 })
    .limit(50);
  return res.json({ deviceId: id, data: items });
}
