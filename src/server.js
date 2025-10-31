import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";
import { getMqttClient } from "./mqtt/client.js";
import userRoutes from "./routes/user.routes.js"; // Handles /api/signup, /api/me, /api/me PUT
import authRoutes from "./routes/auth.routes.js"; // Handles /api/auth/login etc.
import deviceRoutes from "./routes/device.routes.js"; // Handles /api/devices/*

const app = express();

// ✅ Core Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));

// ✅ Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "ArchidTech IoT Backend is running 🚀",
  });
});

// ✅ API Routes
app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);

// ✅ Bootstrap Server
(async function bootstrap() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    console.log("🔌 Initializing MQTT client...");
    getMqttClient();
    console.log("✅ MQTT client initialized");

    app.listen(config.port, () => {
      console.log(`🚀 Server running at: http://archidtech.in:${config.port}`);
    });
  } catch (err) {
    console.error("❌ Fatal startup error:", err.message);
    process.exit(1);
  }
})();
