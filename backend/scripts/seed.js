// npm run seed – adds demo accounts (and a demo company) for local testing.
// Safe to run again: existing emails are skipped.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { User, Supplier } = require("../models");

const DEMO = [
  { name: "Test Buyer", email: "buyer@test.com", password: "Buyer@1234", role: "buyer", city: "Ludhiana" },
  { name: "Test Supplier", email: "supplier@test.com", password: "Supplier@1234", role: "supplier", company_name: "Test Supplier Industries", city: "Baddi" },
];

(async () => {
  try {
    await connectDB();
    for (const d of DEMO) {
      if (await User.exists({ email: d.email })) {
        console.log("exists:", d.email);
        continue;
      }
      const user = new User({ ...d, password_hash: await bcrypt.hash(d.password, 10), is_verified: true });
      if (d.role === "supplier") {
        const company = await Supplier.create({ owner_id: user._id, name: d.company_name, location: d.city, email: d.email, industry: "Hardware" });
        user.supplier_id = company._id;
      }
      await user.save();
      console.log(`created ${d.role}: ${d.email} / ${d.password}`);
    }
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
