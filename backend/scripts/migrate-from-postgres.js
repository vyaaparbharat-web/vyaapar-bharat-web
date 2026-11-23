// One-time copy of the old PostgreSQL data into MongoDB.
//   1. Fill PG_* and MONGODB_URI in backend/.env
//   2. npm install            (pg is a devDependency)
//   3. npm run create-admin   (requirements without a buyer go to the super admin)
//   4. npm run migrate:pg
// Safe to re-run: rows already copied (matched by legacy_id / email) are skipped.
// Old integer ids are kept in `legacy_id`; relations (buyer_id, supplier_id, requirement_id ...) are re-linked to the new ObjectIds.
require("dotenv").config();
const mongoose = require("mongoose");
const { Pool } = require("pg");
const connectDB = require("../config/db");
const { User, Supplier, Product, Requirement, Quote, Insight } = require("../models");

const pool = new Pool({
  host: process.env.PG_HOST || process.env.DB_HOST || "localhost",
  port: Number(process.env.PG_PORT || process.env.DB_PORT || 5432),
  user: process.env.PG_USER || process.env.DB_USER,
  password: String(process.env.PG_PASSWORD || process.env.DB_PASSWORD || ""),
  database: process.env.PG_DATABASE || process.env.DB_NAME,
  connectionTimeoutMillis: 10000, // 10 sec mein connect na ho toh error de do, atko mat
});

async function rows(table) {
  try {
    return (await pool.query(`SELECT * FROM ${table} ORDER BY id`)).rows;
  } catch (e) {
    console.warn(`  skipped table "${table}": ${e.message}`);
    return [];
  }
}

const dates = (r) => ({ created_at: r.created_at || new Date(), updated_at: r.updated_at || r.created_at || new Date() });
const num = (v) => (v === null || v === undefined ? null : Number(v));

// Insert keeping the original timestamps
async function insert(Model, doc) {
  const [created] = await Model.insertMany([doc], { timestamps: false });
  return created;
}

async function migrate(label, table, Model, map, { findExisting } = {}) {
  const idMap = new Map();
  const list = await rows(table);
  let added = 0;
  for (const r of list) {
    let doc = await Model.findOne({ legacy_id: r.id });
    if (!doc && findExisting) doc = await findExisting(r);
    if (!doc) {
      const data = await map(r);
      if (!data) continue;
      try {
        doc = await insert(Model, { ...data, legacy_id: r.id, ...dates(r) });
        added++;
      } catch (e) {
        console.warn(`  ${label} ${r.id} skipped: ${e.code === 11000 ? "duplicate" : e.message}`);
        continue;
      }
    }
    idMap.set(r.id, doc._id);
  }
  console.log(`${label}: ${added} copied, ${list.length - added} already present / skipped`);
  return idMap;
}

async function connectPostgres() {
  const pg = pool.options;
  console.log(`Connecting to PostgreSQL: ${pg.user}@${pg.host}:${pg.port}/${pg.database} ...`);
  try {
    await pool.query("SELECT 1");
  } catch (e) {
    const hint =
      e.code === "ECONNREFUSED"
        ? "Postgres service chalu nahi hai (services.msc mein Start karo)."
        : e.code === "28P01"
          ? "Postgres ka password galat hai (PG_PASSWORD check karo)."
          : e.code === "3D000"
            ? "Is naam ka database nahi mila (PG_DATABASE check karo)."
            : /timeout/i.test(e.message)
              ? "Postgres tak pahunch nahi pa rahe (PG_HOST / PG_PORT check karo)."
              : "";
    throw new Error(`PostgreSQL connect nahi hua: ${e.message || e.code}. ${hint}`);
  }
  console.log("PostgreSQL connected\n");
}

(async () => {
  try {
    await connectDB();
    await connectPostgres();

    const users = await migrate(
      "users",
      "users",
      User,
      (r) => ({
        name: r.name || r.email,
        email: String(r.email).toLowerCase(),
        password_hash: r.password_hash || null,
        role: ["user", "buyer", "supplier", "admin", "super_admin"].includes(r.role) ? r.role : "user",
        phone: r.phone || null,
        google_id: r.google_id || null,
        auth_provider: r.auth_provider === "google" ? "google" : "local",
        is_active: r.is_active !== false,
        is_verified: Boolean(r.is_verified),
        last_login_at: r.last_login_at || null,
      }),
      { findExisting: (r) => User.findOne({ email: String(r.email).toLowerCase() }) },
    );

    const suppliers = await migrate("suppliers", "suppliers", Supplier, (r) => ({
      name: r.name,
      business_type: r.business_type || null,
      industry: r.industry || null,
      location: r.location || null,
      address: r.address || null,
      description: r.description || null,
      phone: r.phone || null,
      email: r.email || null,
      years_in_business: num(r.years_in_business),
      verified: Boolean(r.verified),
      rating: num(r.rating),
      reviews: num(r.reviews) || 0,
      services: Array.isArray(r.services) ? r.services : [],
      service_areas: Array.isArray(r.service_areas) ? r.service_areas : [],
      image_url: r.image_url || null,
      gallery_images: Array.isArray(r.gallery_images) ? r.gallery_images : [],
    }));

    await migrate("products", "products", Product, (r) => {
      const supplierId = suppliers.get(r.supplier_id);
      if (!supplierId) return console.warn(`  product ${r.id} skipped: supplier ${r.supplier_id} not found`), null;
      return {
        supplier_id: supplierId,
        name: r.name,
        category: r.category || null,
        subcategory: r.subcategory || null,
        description: r.description || null,
        price: num(r.price),
        price_unit: r.price_unit || null,
        moq: num(r.moq),
        moq_unit: r.moq_unit || null,
        availability: r.availability || "Available",
        image_url: r.image_url || null,
      };
    });

    // Requirements posted before login existed have no buyer: they go to the first super admin
    const fallbackOwner = await User.findOne({ role: "super_admin" }).sort({ created_at: 1 });
    const requirements = await migrate("requirements", "requirements", Requirement, async (r) => {
      const buyerId = users.get(r.buyer_id) || (fallbackOwner && fallbackOwner._id);
      if (!buyerId) return console.warn(`  requirement ${r.id} skipped: no buyer (run npm run create-admin first)`), null;
      const buyer = await User.findById(buyerId).select("name");
      return {
        buyer_id: buyerId,
        buyer_name: buyer ? buyer.name : null,
        title: r.title,
        category: r.category || "General",
        subcategory: r.subcategory || null,
        quantity: num(r.quantity) || 1,
        unit: r.unit || "Units",
        description: r.description || r.title,
        min_budget: num(r.min_budget),
        max_budget: num(r.max_budget),
        delivery_location: r.delivery_location || "—",
        required_by: r.required_by || null,
        status: ["open", "quoted", "negotiating", "accepted", "closed"].includes(r.status) ? r.status : "open",
      };
    });

    await migrate("quotes", "quotes", Quote, (r) => {
      const requirementId = requirements.get(r.requirement_id);
      const supplierUser = users.get(r.supplier_user_id);
      if (!requirementId || !supplierUser) return console.warn(`  quote ${r.id} skipped: missing requirement or supplier account`), null;
      return {
        requirement_id: requirementId,
        supplier_user_id: supplierUser,
        supplier_name: r.supplier_name || "Supplier",
        supplier_email: r.supplier_email || null,
        quoted_price: num(r.quoted_price) || 0,
        quantity: num(r.quantity) || 0,
        unit: r.unit || "Units",
        delivery_time: r.delivery_time || null,
        message: r.message || null,
        status: ["pending", "accepted", "rejected", "negotiating"].includes(r.status) ? r.status : "pending",
      };
    });

    await migrate("insights", "insights", Insight, (r) => ({
      title: r.title,
      category: r.category || "General",
      category_id: String(r.category_id || r.category || "general"),
      excerpt: r.excerpt || "",
      content: r.content || "",
      image_url: r.image_url || null,
    }));

    // Every supplier account needs a company profile to manage
    const orphans = await User.find({ role: "supplier", supplier_id: null });
    for (const u of orphans) {
      const lastQuote = await Quote.findOne({ supplier_user_id: u._id }).sort({ created_at: -1 });
      const company = await Supplier.create({
        owner_id: u._id,
        name: (lastQuote && lastQuote.supplier_name) || u.name,
        email: u.email,
        phone: u.phone,
      });
      u.supplier_id = company._id;
      await u.save();
      await Quote.updateMany({ supplier_user_id: u._id }, { $set: { supplier_company_id: company._id } });
    }
    if (orphans.length) console.log(`linked ${orphans.length} supplier account(s) to a new company profile`);

    console.log("\nDone. Uploaded images in backend/uploads are reused as they are.");
  } catch (error) {
    console.error("\nMigration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
    await mongoose.disconnect();
  }
})();