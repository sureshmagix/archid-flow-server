// ==============================================
// 🔹 Device Model — Synced with Realm + MQTT
// ==============================================

import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema(
  {
    // Unique ID used by the app and MQTT
    deviceId: { type: String, required: true, unique: true, index: true },

    // Friendly device name
    name: { type: String, trim: true, default: '' },

    // Device type (e.g., light, pdu, etc.)
    type: { type: String, trim: true, default: 'unknown' },

    // MQTT communication topics
    topic: { type: String, trim: true },
    controlTopic: { type: String, trim: true },

    // Owner reference
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Connection status tracking
    status: {
      type: String,
      enum: ['online', 'offline', 'unknown'],
      default: 'unknown',
    },

    // Last time device was seen online
    lastSeenAt: { type: Date, default: null },

    // Additional metadata (firmware, version, etc.)
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Index for faster lookups
DeviceSchema.index({ owner: 1, deviceId: 1 });

// Automatically update `lastSeenAt` when device goes online
DeviceSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'online') {
    this.lastSeenAt = new Date();
  }
  next();
});

export default mongoose.model('Device', DeviceSchema);
