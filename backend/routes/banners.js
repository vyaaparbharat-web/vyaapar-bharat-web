// Home page banners: public list + admin management
const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const { Banner } = require("../models");
const { requireAdmin } = require("../middleware/auth");
const { bannerUpload } = require("../middleware/upload");
const { asyncHandler, fail, isId, str, toNumber } = require("../utils/helpers");

const UPLOADS = path.join(__dirname, "..", "uploads", "banners");
const SEED_MARK = path.join(UPLOADS, ".seeded");
const OLD_ASSETS = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "src",
  "assets",
);

// The banners that used to be hard-coded on the home page
const OLD_BANNERS = [
  ["AR Roadline", "ar roadline.png"],
  ["North India Heavy Transport", "north india heavy transport.png"],
  ["Sai Tyre House", "sai tyre hosue.png"],
  ["Quick Transport & Solution", "quick transport and solution.png"],
  ["Sonu Motor Garage", "sonu motor garage.png"],
  ["Raman Tempo Service", "raman tempo.png"],
];

// Runs once ever: copies the old home page banners into uploads/banners and saves them.
// A marker file stops it from coming back after an admin deletes them.
let seeding = null;
async function ensureSeeded() {
  if (fs.existsSync(SEED_MARK)) return;
  if (!seeding) {
    seeding = (async () => {
      fs.mkdirSync(UPLOADS, { recursive: true });
      if (!(await Banner.estimatedDocumentCount())) {
        const rows = [];
        OLD_BANNERS.forEach(([title, file], i) => {
          const from = path.join(OLD_ASSETS, file);
          if (!fs.existsSync(from)) return;
          const name = `banner-seed-${i + 1}${path.extname(file).toLowerCase()}`;
          fs.copyFileSync(from, path.join(UPLOADS, name));
          rows.push({
            title,
            image_url: `/uploads/banners/${name}`,
            sort_order: (i + 1) * 10,
            is_active: true,
          });
        });
        if (rows.length) await Banner.insertMany(rows);
      }
      fs.writeFileSync(SEED_MARK, new Date().toISOString());
    })().finally(() => {
      seeding = null;
    });
  }
  await seeding;
}

// "/suppliers/123" (this site) or "https://..." only
function cleanLink(value) {
  const link = str(value);
  if (!link) return { link: null };
  if (/^\/(?!\/)/.test(link) || /^https?:\/\/[^\s]+$/i.test(link))
    return { link };
  return {
    error: "Link should start with / (a page on this site) or https://",
  };
}

function toDate(value) {
  const s = str(value);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function bannerFields(body) {
  const title = str(body.title);
  const image = str(body.imageUrl);
  const { link, error: linkError } = cleanLink(body.linkUrl);
  const startsAt = toDate(body.startsAt);
  const endsAt = toDate(body.endsAt);
  const sort = toNumber(body.sortOrder);

  if (!title) return { error: "Give the banner a name." };
  if (!image) return { error: "Upload the banner image." };
  if (linkError) return { error: linkError };
  if (startsAt === undefined || endsAt === undefined)
    return { error: "Dates are not valid." };
  if (startsAt && endsAt && endsAt < startsAt)
    return { error: "End date should be after the start date." };

  return {
    fields: {
      title,
      image_url: image,
      link_url: link,
      sort_order: sort === null ? 100 : sort,
      is_active: body.isActive === undefined ? true : Boolean(body.isActive),
      starts_at: startsAt,
      ends_at: endsAt,
    },
  };
}

// ==================================================
// PUBLIC: banners showing right now
// ==================================================
router.get(
  "/banners",
  asyncHandler(async (req, res) => {
    await ensureSeeded();
    const now = new Date();
    const banners = await Banner.find({
      is_active: true,
      $and: [
        { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
        { $or: [{ ends_at: null }, { ends_at: { $gte: now } }] },
      ],
    }).sort({ sort_order: 1, created_at: 1 });
    res.json({ success: true, banners });
  }),
);

// ==================================================
// ADMIN
// ==================================================
router.get(
  "/admin/banners",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await ensureSeeded();
    const banners = await Banner.find().sort({ sort_order: 1, created_at: 1 });
    res.json({ success: true, banners });
  }),
);

router.post(
  "/admin/banners/upload-image",
  requireAdmin,
  bannerUpload.single("image"),
  (req, res) => {
    if (!req.file) return fail(res, 400, "Select an image.");
    res
      .status(201)
      .json({
        success: true,
        image_url: `/uploads/banners/${req.file.filename}`,
      });
  },
);

router.post(
  "/admin/banners",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { fields, error } = bannerFields(req.body);
    if (error) return fail(res, 400, error);
    if (req.body.sortOrder === undefined || req.body.sortOrder === "") {
      const last = await Banner.findOne().sort({ sort_order: -1 });
      fields.sort_order = last ? last.sort_order + 10 : 10; // new banners go to the end
    }
    const banner = await Banner.create(fields);
    res.status(201).json({ success: true, message: "Banner added", banner });
  }),
);

// body: { ids: [...] } in the new order
router.post(
  "/admin/banners/reorder",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).filter(isId);
    if (!ids.length) return fail(res, 400, "Nothing to reorder.");
    await Banner.bulkWrite(
      ids.map((id, i) => ({
        updateOne: {
          filter: { _id: id },
          update: { sort_order: (i + 1) * 10 },
        },
      })),
    );
    res.json({ success: true, message: "Order saved" });
  }),
);

router.put(
  "/admin/banners/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Banner not found.");
    const { fields, error } = bannerFields(req.body);
    if (error) return fail(res, 400, error);
    const banner = await Banner.findByIdAndUpdate(req.params.id, fields, {
      new: true,
      runValidators: true,
    });
    if (!banner) return fail(res, 404, "Banner not found.");
    res.json({ success: true, message: "Banner saved", banner });
  }),
);

// Show / hide without opening the form
router.patch(
  "/admin/banners/:id/active",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Banner not found.");
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { is_active: Boolean(req.body.isActive) },
      { new: true },
    );
    if (!banner) return fail(res, 404, "Banner not found.");
    res.json({
      success: true,
      message: banner.is_active ? "Banner is live" : "Banner hidden",
      banner,
    });
  }),
);

router.delete(
  "/admin/banners/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Banner not found.");
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return fail(res, 404, "Banner not found.");
    res.json({ success: true, message: "Banner deleted" });
  }),
);

module.exports = router;
