import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import User from "../models/User.js";

/**
 * JWT Authentication Middleware
 * Validates Bearer tokens sent from mobile apps (Realm-stored JWT)
 * and attaches the authenticated user to req.user
 */
export async function auth(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];

    // ✅ 1. Check header presence
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid Authorization header",
      });
    }

    // ✅ 2. Extract token
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    // ✅ 3. Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      const msg =
        err.name === "TokenExpiredError"
          ? "Token expired. Please log in again."
          : "Invalid token.";
      return res.status(401).json({ success: false, message: msg });
    }

    // ✅ 4. Fetch user from DB
    const user = await User.findById(decoded.sub).select("-passwordHash");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "User account inactive" });
    }

    // ✅ 5. Attach user to request for downstream controllers
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal authentication error" });
  }
}
