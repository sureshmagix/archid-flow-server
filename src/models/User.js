import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    mobile: { type: String, required: true, unique: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"], default: undefined },
    address: { type: String },
    taluk: { type: String },
    pincode: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
