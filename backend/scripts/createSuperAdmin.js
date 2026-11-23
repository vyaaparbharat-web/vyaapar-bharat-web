// npm run create-admin  – creates the super admin from SUPER_ADMIN_* in .env
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { User } = require("../models");

(async () => {
  try {
    const name = process.env.SUPER_ADMIN_NAME;
    const email = (process.env.SUPER_ADMIN_EMAIL || "").toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!name || !email || !password) throw new Error("SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required.");

    await connectDB();
    if (await User.exists({ email })) {
      console.log("Super admin already exists:", email);
    } else {
      await User.create({ name, email, password_hash: await bcrypt.hash(password, 12), role: "super_admin", is_verified: true });
      console.log("Super admin created:", email);
    }
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
