// ==============================================
// 🔹 Device Model — Owner + Shared Users (FINAL)
// ==============================================

import mongoose from "mongoose";

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

    // 🔥 Correct owner assignment
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sharedUsers: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        access: {
          type: String,
          enum: ["control", "view"],
          default: "view",
        },
      },
    ],

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

DeviceSchema.index({ owner: 1, deviceId: 1 });

export default mongoose.model("Device", DeviceSchema);
