// ==============================================
// 🔹 Device Model — Owner + Shared Users (2 Control + 1 View)
// ==============================================

import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },

    name: { type: String, trim: true, default: '' },
    type: { type: String, trim: true, default: 'unknown' },

    topic: { type: String, trim: true },
    controlTopic: { type: String, trim: true },

    // Main owner (user who registered/purchased)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 🔹 Per-device sharing:
    // - Max 3 entries total
    // - Up to 2 with access = "control"
    // - Up to 1 with access = "view"
    sharedUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        access: { type: String, enum: ['control', 'view'], default: 'view' },
      },
    ],

    status: {
      type: String,
      enum: ['online', 'offline', 'unknown'],
      default: 'unknown',
    },

    lastSeenAt: { type: Date, default: null },

    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

DeviceSchema.index({ owner: 1, deviceId: 1 });

DeviceSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'online') {
    this.lastSeenAt = new Date();
  }
  next();
});

export default mongoose.model('Device', DeviceSchema);
