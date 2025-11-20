/**
 * =============================================================================
 *  ArchidTech IoT – Full Device Ownership Migration Script (FINAL)
 * =============================================================================
 *
 *  This script fixes:
 *   - Devices with missing owner
 *   - Devices with invalid owner (deleted user)
 *   - Devices with sharedUsers referencing deleted users
 *   - Devices with sharedUsers missing username
 *   - Orphan devices assigned to SYSTEM-ORPHAN-DEVICE
 *
 *  Run ONCE:
 *      node scripts/migrate_fix_devices.js
 *
 *  Safe to run multiple times (idempotent).
 *
 * =============================================================================
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

import Device from "../src/models/Device.js";
import User from "../src/models/User.js";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "production"}`,
});

// --------------------------------------------------------
// 🔗 CONNECT TO MONGO
// --------------------------------------------------------
async function connectDB() {
  const uri = process.env.MONGO_URL;

  if (!uri) {
    console.error("❌ MONGO_URL missing in .env file");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("✅ Connected to MongoDB");
}

// --------------------------------------------------------
// 🔥 MIGRATION LOGIC
// --------------------------------------------------------
async function migrate() {
  console.log("\n🚀 Starting Device Ownership Migration...\n");

  // Ensure SYSTEM user exists
  await User.ensureSystemUser();

  const SYSTEM_ID = User.SYSTEM_USER_ID;

  const devices = await Device.find({});
  let fixed = 0;

  for (const d of devices) {
    let changed = false;

    let owner = d.owner;
    let ownerId = owner ? owner.toString() : null;

    // ---------------------------------------------------------------------
    // 1️⃣ FIX: Missing owner
    // ---------------------------------------------------------------------
    if (!ownerId) {
      console.log(`🛠 Device ${d.deviceId} has NO OWNER.`);

      if (d.sharedUsers.length > 0) {
        d.owner = d.sharedUsers[0].userId;
        console.log(`   👉 Assigned first shared user as owner → ${d.owner}`);
      } else {
        d.owner = SYSTEM_ID;
        console.log(`   ⚠ Assigned SYSTEM OWNER → ${SYSTEM_ID}`);
      }
      changed = true;
    }

    // Reload ownerId
    ownerId = d.owner?.toString();

    // ---------------------------------------------------------------------
    // 2️⃣ FIX: Owner exists in DB?
    // ---------------------------------------------------------------------
    if (ownerId && ownerId !== SYSTEM_ID) {
      const ownerExists = await User.findById(ownerId);

      if (!ownerExists) {
        console.log(`🛠 Device ${d.deviceId}: Owner user does NOT exist!`);

        if (d.sharedUsers.length > 0) {
          d.owner = d.sharedUsers[0].userId;
          console.log(`   👉 Owner reassigned to shared user → ${d.owner}`);
        } else {
          d.owner = SYSTEM_ID;
          console.log(`   ⚠ Assigned SYSTEM OWNER`);
        }
        changed = true;
      }
    }

    // ---------------------------------------------------------------------
    // 3️⃣ FIX: Remove sharedUsers whose user no longer exists
    // ---------------------------------------------------------------------
    const validShared = [];

    for (const su of d.sharedUsers) {
      if (!su.userId) continue;

      const exists = await User.findById(su.userId);

      if (!exists) {
        console.log(
          `   ❌ Removed invalid shared user ${su.userId} from device ${d.deviceId}`
        );
        changed = true;
        continue;
      }

      // Username fix
      if (!su.username) {
        su.username = exists.username || exists.mobile || exists.name || "Unknown";
        changed = true;
      }

      validShared.push(su);
    }

    d.sharedUsers = validShared;

    // ---------------------------------------------------------------------
    // 4️⃣ Save if modified
    // ---------------------------------------------------------------------
    if (changed) {
      await d.save();
      console.log(`   ✔ Device ${d.deviceId} updated`);
      fixed++;
    }
  }

  console.log("\n===========================================");
  console.log(`🎉 Migration Completed`);
  console.log(`🔧 Devices Updated: ${fixed}`);
  console.log("===========================================\n");

  process.exit(0);
}

// --------------------------------------------------------
// 🔥 START EXECUTION
// --------------------------------------------------------
(async () => {
  await connectDB();
  await migrate();
})();
