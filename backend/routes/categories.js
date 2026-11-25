// Categories: public list/detail, admin create/edit/delete, and assigning products to a category
const router = require("express").Router();
const { Category, Product, Requirement } = require("../models");
const { optionalAuth, requireAdmin } = require("../middleware/auth");
const { categoryUpload } = require("../middleware/upload");
const { asyncHandler, fail, isId, str, toNumber, escapeRegex } = require("../utils/helpers");

// Used the first time the categories collection is empty
const DEFAULTS = [
  ["Transport & Logistics", "ट्रांसपोर्ट"],
  ["Automobile & Parts", "ऑटोमोबाइल पार्ट्स"],
  ["Tyres", "टायर"],
  ["Electrical", "बिजली का सामान"],
  ["Hardware & Fittings", "हार्डवेयर और फिटिंग्स"],
  ["Textiles & Hosiery", "कपड़ा और होज़री"],
  ["Interior & Furniture", "इंटीरियर और फर्नीचर"],
  ["Construction & Building", "निर्माण सामग्री"],
  ["Machinery & Tools", "मशीनरी और औज़ार"],
  ["Electronics & Components", "इलेक्ट्रॉनिक्स"],
  ["Industrial Supplies", "औद्योगिक सामान"],
  ["Chemicals & Raw Materials", "केमिकल और कच्चा माल"],
  ["Packaging & Printing", "पैकेजिंग और प्रिंटिंग"],
  ["Agriculture & Food", "कृषि और खाद्य"],
  ["Health & Medical", "स्वास्थ्य और चिकित्सा"],
  ["Renewable Energy", "सौर ऊर्जा"],
  ["Other", "अन्य"],
];

const slugify = (name) =>
  String(name)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `category-${Date.now()}`;

const sameName = (name) => new RegExp(`^${escapeRegex(name)}$`, "i");

// Fills the collection once: default list + any category names already used by products / requirements
let seeding = null;
async function ensureSeeded() {
  if (await Category.estimatedDocumentCount()) return;
  if (!seeding) {
    seeding = (async () => {
      const used = [...(await Product.distinct("category")), ...(await Requirement.distinct("category"))].filter(Boolean);
      const rows = DEFAULTS.map(([name, hi], i) => ({ name, name_hi: hi, sort_order: name === "Other" ? 999 : (i + 1) * 10, is_active: true }));
      for (const raw of used) {
        const name = String(raw).trim();
        if (name && !rows.some((r) => r.name.toLowerCase() === name.toLowerCase() || slugify(r.name) === slugify(name))) {
          rows.push({ name, name_hi: null, sort_order: 500, is_active: true });
        }
      }
      await Category.bulkWrite(
        rows.map((r) => ({ updateOne: { filter: { slug: slugify(r.name) }, update: { $setOnInsert: { ...r, slug: slugify(r.name) } }, upsert: true } })),
      );
    })().finally(() => {
      seeding = null;
    });
  }
  await seeding;
}

// { "tyres": 12, ... } keyed by lower-case category name
async function countBy(ModelCls, extraMatch = {}) {
  const rows = await ModelCls.aggregate([
    { $match: { category: { $type: "string" }, ...extraMatch } },
    { $group: { _id: { $toLower: "$category" }, n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.n]));
}

async function withCounts(categories) {
  const [products, requirements] = await Promise.all([countBy(Product), countBy(Requirement, { status: { $nin: ["closed", "accepted"] } })]);
  return categories.map((c) => {
    const json = c.toJSON ? c.toJSON() : c;
    const key = json.name.toLowerCase();
    return { ...json, product_count: products[key] || 0, requirement_count: requirements[key] || 0 };
  });
}

function categoryFields(body) {
  const sort = toNumber(body.sortOrder);
  return {
    name: str(body.name),
    name_hi: str(body.nameHi) || null,
    description: str(body.description) || null,
    image_url: str(body.imageUrl) || null,
    sort_order: sort === null ? 100 : sort,
    is_active: body.isActive === undefined ? true : Boolean(body.isActive),
  };
}

// ==================================================
// PUBLIC
// ==================================================

// ?all=1 (admins only) also returns hidden categories
router.get(
  "/categories",
  optionalAuth,
  asyncHandler(async (req, res) => {
    await ensureSeeded();
    const showAll = req.query.all && req.user && req.user.isAdmin;
    const categories = await Category.find(showAll ? {} : { is_active: true }).sort({ sort_order: 1, name: 1 });
    res.json({ success: true, categories: await withCounts(categories) });
  }),
);

router.get(
  "/categories/:slug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    await ensureSeeded();
    const category = await Category.findOne({ slug: String(req.params.slug).toLowerCase() });
    if (!category || (!category.is_active && !(req.user && req.user.isAdmin))) return fail(res, 404, "Category not found.");
    const [withCount] = await withCounts([category]);
    res.json({ success: true, category: withCount });
  }),
);

// ==================================================
// ADMIN
// ==================================================

router.post(
  "/admin/categories/upload-image",
  requireAdmin,
  categoryUpload.single("image"),
  (req, res) => {
    if (!req.file) return fail(res, 400, "Select an image.");
    res.status(201).json({ success: true, image_url: `/uploads/categories/${req.file.filename}` });
  },
);

router.post(
  "/admin/categories",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const fields = categoryFields(req.body);
    if (!fields.name) return fail(res, 400, "Category name is required.");
    if (await Category.exists({ name: sameName(fields.name) })) return fail(res, 409, "A category with this name already exists.");

    let slug = slugify(fields.name);
    if (await Category.exists({ slug })) slug = `${slug}-${Date.now().toString(36)}`;
    const category = await Category.create({ ...fields, slug });
    res.status(201).json({ success: true, message: "Category added", category });
  }),
);

router.put(
  "/admin/categories/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Category not found.");
    const category = await Category.findById(req.params.id);
    if (!category) return fail(res, 404, "Category not found.");

    const fields = categoryFields(req.body);
    if (!fields.name) return fail(res, 400, "Category name is required.");
    if (await Category.exists({ _id: { $ne: category._id }, name: sameName(fields.name) })) {
      return fail(res, 409, "A category with this name already exists.");
    }

    const oldName = category.name;
    Object.assign(category, fields);
    await category.save(); // the slug (URL) stays the same so old links keep working

    let renamed = 0;
    if (oldName !== fields.name) {
      const [p] = await Promise.all([
        Product.updateMany({ category: sameName(oldName) }, { category: fields.name }),
        Requirement.updateMany({ category: sameName(oldName) }, { category: fields.name }),
      ]);
      renamed = p.modifiedCount;
    }
    res.json({ success: true, message: renamed ? `Category saved. ${renamed} ${renamed === 1 ? "product" : "products"} updated to the new name.` : "Category saved", category });
  }),
);

// ?moveTo=<category id> moves its products (and requirements) there first
router.delete(
  "/admin/categories/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Category not found.");
    const category = await Category.findById(req.params.id);
    if (!category) return fail(res, 404, "Category not found.");

    const inUse = await Product.countDocuments({ category: sameName(category.name) });
    let target = null;
    if (req.query.moveTo) {
      target = isId(req.query.moveTo) ? await Category.findById(req.query.moveTo) : null;
      if (!target || String(target._id) === String(category._id)) return fail(res, 400, "Choose another category to move the products to.");
    }
    if (inUse && !target) {
      return fail(res, 409, `${inUse} ${inUse === 1 ? "product uses" : "products use"} this category. Move ${inUse === 1 ? "it" : "them"} to another category first.`);
    }

    if (target) {
      await Promise.all([
        Product.updateMany({ category: sameName(category.name) }, { category: target.name }),
        Requirement.updateMany({ category: sameName(category.name) }, { category: target.name }),
      ]);
    }
    await category.deleteOne();
    res.json({ success: true, message: target ? `Category deleted. Products moved to ${target.name}.` : "Category deleted" });
  }),
);

// Assign one or many products to a category. body: { productIds: [...], category: "Tyres" | null }
router.patch(
  "/admin/products/category",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const ids = (Array.isArray(req.body.productIds) ? req.body.productIds : []).filter(isId);
    if (!ids.length) return fail(res, 400, "Choose at least one product.");

    let name = null;
    if (str(req.body.category)) {
      const category = await Category.findOne({ name: sameName(str(req.body.category)) });
      if (!category) return fail(res, 400, "That category doesn't exist.");
      name = category.name;
    }

    const result = await Product.updateMany({ _id: { $in: ids } }, { category: name });
    res.json({
      success: true,
      message: `${result.modifiedCount} ${result.modifiedCount === 1 ? "product" : "products"} ${name ? `moved to ${name}` : "removed from their category"}`,
      updated: result.modifiedCount,
    });
  }),
);

module.exports = router;
module.exports.slugify = slugify;