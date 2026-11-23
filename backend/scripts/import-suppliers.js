// Import companies from a JSON file into MongoDB (and download their images).
//   npm run import:suppliers                         -> uses scripts/data/suppliers-vyapaarbharat.json
//   npm run import:suppliers -- path/to/file.json    -> any other file
// Safe to re-run: a company whose name already exists is skipped.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { Supplier } = require("../models");

const FILE = path.resolve(process.argv[2] || path.join(__dirname, "data", "suppliers-vyapaarbharat.json"));
const IMAGE_BASE = process.env.IMPORT_IMAGE_BASE || "https://vyapaarbharat.net"; // where the /uploads/... images live
const UPLOADS = path.join(__dirname, "..", "uploads");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Downloads /uploads/companies/x.png into backend/uploads/companies/x.png (if not already there)
async function ensureImage(urlPath) {
  if (!urlPath || !urlPath.startsWith("/uploads/")) return urlPath || null;
  const local = path.join(UPLOADS, urlPath.replace(/^\/uploads\//, ""));
  if (fs.existsSync(local)) return urlPath;
  try {
    const res = await fetch(IMAGE_BASE + urlPath);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.writeFileSync(local, Buffer.from(await res.arrayBuffer()));
    return urlPath;
  } catch (e) {
    console.warn(`    image not downloaded (${urlPath}): ${e.message}`);
    return null;
  }
}

(async () => {
  try {
    if (!fs.existsSync(FILE)) throw new Error(`File not found: ${FILE}`);
    const list = JSON.parse(fs.readFileSync(FILE, "utf8"));
    await connectDB();

    let added = 0;
    let skipped = 0;
    for (const c of list) {
      const name = String(c.name || "").trim();
      if (!name) continue;
      if (await Supplier.exists({ name: new RegExp(`^${escapeRegex(name)}$`, "i") })) {
        console.log(`  skip (already exists): ${name}`);
        skipped++;
        continue;
      }

      const image_url = await ensureImage(c.image_url);
      const gallery_images = (await Promise.all((c.gallery_images || []).map(ensureImage))).filter(Boolean);

      await Supplier.create({
        name,
        business_type: c.business_type || null,
        industry: c.industry || null,
        location: c.location ? String(c.location).trim() : null,
        address: c.address ? String(c.address).trim() : null,
        description: c.description ? String(c.description).trim() : null,
        phone: c.phone ? String(c.phone).trim() : null,
        email: c.email || null,
        years_in_business: c.years_in_business ?? null,
        verified: Boolean(c.verified),
        rating: c.rating ?? null,
        reviews: c.reviews || 0,
        services: c.services || [],
        service_areas: c.service_areas || [],
        image_url,
        gallery_images,
      });
      console.log(`  added: ${name}`);
      added++;
    }
    console.log(`\nDone. ${added} added, ${skipped} skipped (already there).`);
  } catch (error) {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();