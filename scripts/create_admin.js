/**
 * =============================================================================
 *   ArchidTech IoT – Create Admin User Script (FINAL)
 * =============================================================================
 *
 *   Run:
 *      node scripts/create_admin.js
 *
 *   Will prompt for:
 *      - name
 *      - mobile
 *      - email
 *      - password
 *
 *   Creates:
 *      role: "admin"
 * =============================================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";

// Load .env (env.js uses MONGODB_URI)
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });


// -------------------------------------------------------------
// 🔹 CLI Input Helper
// -------------------------------------------------------------
function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    })
  );
}


// -------------------------------------------------------------
// 🔹 Connect to Database
// -------------------------------------------------------------
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ ERROR: MONGODB_URI missing in .env file");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("✅ Connected to MongoDB\n");
}


// -------------------------------------------------------------
// 🔥 MAIN – Create Admin User
// -------------------------------------------------------------
async function createAdmin() {
  console.log("🚀 Admin User Creation Tool\n");

  const name = await ask("👤 Enter Admin Name: ");
  const mobile = await ask("📱 Enter Mobile Number (unique): ");
  const email = await ask("📧 Enter Email: ");
  const password = await ask("🔐 Enter Password: ");

  const passwordHash = await bcrypt.hash(password, 10);

  // Check existing admin
  const existing = await User.findOne({ mobile });

  if (existing) {
    console.error(`\n❌ User with mobile ${mobile} already exists.`);
    console.log(`   ➤ Current role: ${existing.role}`);
    process.exit(1);
  }

  // Create new admin
  const adminUser = await User.create({
    name,
    mobile,
    email,
    passwordHash,
    role: "admin",
    isSystem: false,
  });

  console.log("\n=========================================");
  console.log("🎉 Admin User Created Successfully!");
  console.log("=========================================\n");
  console.log(`🆔 ID:        ${adminUser._id}`);
  console.log(`👤 Name:      ${adminUser.name}`);
  console.log(`📱 Mobile:    ${adminUser.mobile}`);
  console.log(`📧 Email:     ${adminUser.email}`);
  console.log(`🔒 Role:      ${adminUser.role}`);
  console.log("\nYou can now log in as admin in your app.\n");

  process.exit(0);
}


// -------------------------------------------------------------
// 🔥 STARTUP
// -------------------------------------------------------------
(async () => {
  try {
    await connectDB();
    await User.ensureSystemUser(); // ensure system user exists
    await createAdmin();
  } catch (err) {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  }
})();
