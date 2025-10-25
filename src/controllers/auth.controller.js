import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config/env.js";

export async function login(req, res) {
  const { username, password } = req.body;

  const user = await User.findOne({
    $or: [{ mobile: username }, { email: username }],
  });
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });

  const token = jwt.sign({ sub: user._id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn || "7d",
  });

  res.json({
    success: true,
    token,
    user: { _id: user._id, name: user.name, mobile: user.mobile },
  });
}
