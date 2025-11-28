import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    mobile: { type: String, required: true, unique: true },

    username: { type: String, unique: true, sparse: true },

    email: { type: String },

    passwordHash: { type: String, required: true },
       isActive: { type: Boolean, default: true },


    gender: { type: String },
    address: { type: String },
    taluk: { type: String },
    pincode: { type: String },

    // ============================================
    // ⭐ DEVICES OWNED BY THIS USER
    // ============================================
    devices: [
      {
        deviceId: { type: String, required: true }
      }
    ],

    // ============================================
    // ⭐ DEVICES SHARED TO THIS USER
    // ============================================
    sharedDevices: [
      {
        deviceId: { type: String, required: true },
        access: {
          type: String,
          enum: ["control", "view"],
          default: "view"
        }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
