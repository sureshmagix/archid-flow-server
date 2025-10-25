import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config/env.js";

// 🔹 SIGNUP CONTROLLER
export async function signup(req, res) {
  try {
    const { name, mobile, password, confirmPassword } = req.body;

    if (!name || !mobile || !password || !confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });

    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });

    const exists = await User.findOne({ mobile });
    if (exists)
      return res
        .status(409)
        .json({ success: false, message: "Mobile number already registered" });

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      mobile,
      passwordHash,
    });

    const token = jwt.sign({ sub: newUser._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn || "7d",
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        mobile: newUser.mobile,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// 🔹 PROFILE (GET)
export async function me(req, res) {
  return res.json({ user: req.user });
}

// 🔹 PROFILE UPDATE (PUT)
export async function updateProfile(req, res) {
  const { name, email, gender, address, taluk, pincode, userType } = req.body;
  const updateData = { name, email, gender, address, taluk, pincode, userType };

  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  const updated = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
  }).select("-passwordHash");

  res.json({ success: true, user: updated });
}
