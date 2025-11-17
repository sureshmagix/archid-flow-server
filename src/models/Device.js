// ==============================================
// 🔹 Device Model — Owner + Shared Users (FINAL)
// ==============================================

import mongoose from "mongoose";

const sharedUserSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // UI needs username
    username: { type: String, trim: true },

    access: {
      type: String,
      enum: ["control", "view"],
      default: "view",
    },
  },
  { _id: false }
);

const DeviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },

    name: { type: String, trim: true, default: "" },
    type: { type: String, trim: true, default: "unknown" },

    topic: { type: String, trim: true },
    controlTopic: { type: String, trim: true },

    // 🔥 Owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 Shared Users
    sharedUsers: [sharedUserSchema],

    status: {
      type: String,
      enum: ["online", "offline", "unknown"],
      default: "unknown",
    },

    lastSeenAt: { type: Date },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Indexing
DeviceSchema.index({ owner: 1, deviceId: 1 });

export default mongoose.model("Device", DeviceSchema);
