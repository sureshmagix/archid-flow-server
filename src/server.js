import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";
import { getMqttClient } from "./mqtt/client.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import deviceRoutes from "./routes/device.routes.js";

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

// ✅ Health Check (for monitoring or load balancers)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    environment: config.env,
    service: "ArchidTech IoT Backend",
    message: "Server is running 🚀",
  });
});

// ✅ API Routes
app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);

// ✅ Centralized Error Handling (optional, useful later)
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ✅ Bootstrap Server
(async function bootstrap() {
  try {
    console.log(`🟡 Environment: ${config.env}`);
    console.log("⏳ Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    console.log("🔌 Initializing MQTT client...");
    getMqttClient();
    console.log("✅ MQTT client initialized");

    const baseUrl =
      config.env === "production"
        ? `https://archidtech.in:${config.port}`
        : `http://localhost:${config.port}`;

    app.listen(config.port, "0.0.0.0", () => {
      console.log(`🚀 Server running at: ${baseUrl}`);
    });
  } catch (err) {
    console.error("❌ Fatal startup error:", err.message);
    process.exit(1);
  }
})();
