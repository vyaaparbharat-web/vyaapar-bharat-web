// Suppliers (company profiles), products and supplier-side self service
const router = require("express").Router();
const { Supplier, Product, Enquiry } = require("../models");
const { authenticate, optionalAuth, requireRole, requireAdmin } = require("../middleware/auth");
const { productUpload, companyUpload } = require("../middleware/upload");
const { asyncHandler, fail, isId, toNumber, toList, str, plain, escapeRegex } = require("../utils/helpers");

// ---------- helpers ----------

// Only accept real Google Maps links (share links or google.com/maps URLs)
const MAPS_LINK = /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

function companyFields(body, { allowVerified }) {
  const fields = {
    name: str(body.name),
    business_type: str(body.businessType) || null,
    industry: str(body.industry) || null,
    location: str(body.location) || null,
    address: str(body.address) || null,
    map_url: MAPS_LINK.test(str(body.mapUrl)) ? str(body.mapUrl) : null,
    description: str(body.description) || null,
    phone: str(body.phone) || null,
    email: str(body.email) || null,
    years_in_business: toNumber(body.yearsInBusiness),
    services: toList(body.services),
    service_areas: toList(body.serviceAreas),
    image_url: str(body.imageUrl) || null,
    gallery_images: toList(body.galleryImages),
  };
  if (allowVerified) fields.verified = Boolean(body.verified);
  return fields;
}

function productFields(body) {
  return {
    name: str(body.name),
    category: str(body.category) || null,
    subcategory: str(body.subcategory) || null,
    description: str(body.description) || null,
    price: toNumber(body.price),
    price_unit: str(body.priceUnit) || null,
    moq: toNumber(body.moq),
    moq_unit: str(body.moqUnit) || null,
    availability: str(body.availability) || "Available",
    image_url: str(body.imageUrl) || null,
  };
}

// Product joined with the supplier fields the frontend expects (supplier_name, supplier_location, ...)
function flattenProduct(p, full = false) {
  const s = p.supplier_id && p.supplier_id._id ? p.supplier_id : null;
  const out = plain({ ...p, supplier_id: s ? s._id : p.supplier_id });
  out.supplier_name = s ? s.name : null;
  out.supplier_location = s ? s.location : null;
  out.supplier_address = s ? s.address : null;
  out.supplier_map_url = s ? s.map_url : null;
  out.supplier_verified = s ? s.verified : false;
  out.supplier_rating = s ? s.rating : null;
  if (full && s) {
    Object.assign(out, {
      supplier_business_type: s.business_type,
      supplier_industry: s.industry,
      supplier_description: s.description,
      supplier_phone: s.phone,
      supplier_email: s.email,
      supplier_years: s.years_in_business,
      supplier_reviews: s.reviews,
      supplier_image_url: s.image_url,
    });
  }
  return out;
}

const canEditProduct = (req, product) =>
  req.user.isAdmin || (req.user.role === "supplier" && req.user.supplierId && String(product.supplier_id) === req.user.supplierId);

// ==================================================
// SUPPLIERS (public directory)
// ==================================================

router.get(
  "/suppliers",
  asyncHandler(async (req, res) => {
    const match = {};
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(req.query.q), "i");
      match.$or = [{ name: rx }, { industry: rx }, { location: rx }, { services: rx }];
    }
    if (req.query.industry) match.industry = new RegExp(`^${escapeRegex(req.query.industry)}$`, "i");

    const suppliers = await Supplier.aggregate([
      { $match: match },
      { $sort: { verified: -1, created_at: -1 } },
      { $lookup: { from: "products", localField: "_id", foreignField: "supplier_id", as: "p" } },
      { $addFields: { product_count: { $size: "$p" } } },
      { $project: { p: 0 } },
    ]);
    res.json({ success: true, suppliers: suppliers.map(plain) });
  }),
);

router.get(
  "/suppliers/:id",
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Supplier not found.");
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return fail(res, 404, "Supplier not found.");
    res.json({ success: true, supplier });
  }),
);

// Admin: create company
router.post(
  "/suppliers",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const fields = companyFields(req.body, { allowVerified: true });
    if (!fields.name) return fail(res, 400, "Company name is required.");
    const supplier = await Supplier.create(fields);
    res.status(201).json({ success: true, message: "Company created", supplier });
  }),
);

// Admin: update company
router.put(
  "/admin/suppliers/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Company not found.");
    const fields = companyFields(req.body, { allowVerified: true });
    if (!fields.name) return fail(res, 400, "Company name is required.");
    const company = await Supplier.findByIdAndUpdate(req.params.id, fields, { new: true, runValidators: true });
    if (!company) return fail(res, 404, "Company not found.");
    res.json({ success: true, message: "Company updated", company });
  }),
);

// Admin: delete company (and its products)
router.delete(
  "/admin/suppliers/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Company not found.");
    const company = await Supplier.findByIdAndDelete(req.params.id);
    if (!company) return fail(res, 404, "Company not found.");
    await Product.deleteMany({ supplier_id: company._id });
    res.json({ success: true, message: "Company deleted", company: { id: String(company._id), name: company.name } });
  }),
);

// Admin or supplier: upload company images
router.post(
  "/suppliers/upload-images",
  authenticate,
  requireRole("admin", "supplier"),
  companyUpload.array("images", 10),
  (req, res) => {
    if (!req.files || !req.files.length) return fail(res, 400, "Select at least one image.");
    res.status(201).json({ success: true, images: req.files.map((f) => `/uploads/companies/${f.filename}`) });
  },
);

// ==================================================
// SUPPLIER SELF-SERVICE (logged-in supplier's own company)
// ==================================================

router.get(
  "/supplier/profile",
  authenticate,
  requireRole("supplier"),
  asyncHandler(async (req, res) => {
    const company = req.user.supplierId ? await Supplier.findById(req.user.supplierId) : null;
    if (!company) return fail(res, 404, "No company profile is linked to this account.");
    res.json({ success: true, company });
  }),
);

router.put(
  "/supplier/profile",
  authenticate,
  requireRole("supplier"),
  asyncHandler(async (req, res) => {
    if (!req.user.supplierId) return fail(res, 404, "No company profile is linked to this account.");
    const fields = companyFields(req.body, { allowVerified: false }); // suppliers can't verify themselves
    if (!fields.name) return fail(res, 400, "Company name is required.");
    const company = await Supplier.findByIdAndUpdate(req.user.supplierId, fields, { new: true, runValidators: true });
    res.json({ success: true, message: "Company profile saved", company });
  }),
);

router.get(
  "/supplier/products",
  authenticate,
  requireRole("supplier"),
  asyncHandler(async (req, res) => {
    if (!req.user.supplierId) return res.json({ success: true, products: [] });
    const products = await Product.find({ supplier_id: req.user.supplierId }).sort({ created_at: -1 }).populate("supplier_id").lean();
    res.json({ success: true, products: products.map((p) => flattenProduct(p)) });
  }),
);

router.get(
  "/supplier/enquiries",
  authenticate,
  requireRole("supplier"),
  asyncHandler(async (req, res) => {
    if (!req.user.supplierId) return res.json({ success: true, enquiries: [] });
    const enquiries = await Enquiry.find({ supplier_id: req.user.supplierId })
      .sort({ created_at: -1 })
      .populate("product_id", "name")
      .lean();
    res.json({
      success: true,
      enquiries: enquiries.map((e) => ({
        ...plain({ ...e, product_id: e.product_id ? e.product_id._id : null }),
        product_name: e.product_id ? e.product_id.name : null,
      })),
    });
  }),
);

// ==================================================
// PRODUCTS
// ==================================================

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const match = {};
    if (req.query.supplierId && isId(req.query.supplierId)) match.supplier_id = req.query.supplierId;
    if (req.query.category) match.category = new RegExp(`^${escapeRegex(req.query.category)}$`, "i");
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(req.query.q), "i");
      match.$or = [{ name: rx }, { category: rx }, { subcategory: rx }, { description: rx }];
    }
    const products = await Product.find(match).sort({ created_at: -1 }).populate("supplier_id").lean();
    res.json({ success: true, products: products.map((p) => flattenProduct(p)) });
  }),
);

router.get(
  "/products/:id",
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Product not found.");
    const product = await Product.findById(req.params.id).populate("supplier_id").lean();
    if (!product) return fail(res, 404, "Product not found.");
    res.json({ success: true, product: flattenProduct(product, true) });
  }),
);

router.post(
  "/products/upload-image",
  authenticate,
  requireRole("admin", "supplier"),
  productUpload.single("image"),
  (req, res) => {
    if (!req.file) return fail(res, 400, "Select an image.");
    res.status(201).json({ success: true, image_url: `/uploads/products/${req.file.filename}` });
  },
);

// Admin: any company. Supplier: always their own company.
router.post(
  "/products",
  authenticate,
  requireRole("admin", "supplier"),
  asyncHandler(async (req, res) => {
    const fields = productFields(req.body);
    if (!fields.name) return fail(res, 400, "Product name is required.");

    const supplierId = req.user.isAdmin ? req.body.supplierId : req.user.supplierId;
    if (!isId(supplierId) || !(await Supplier.exists({ _id: supplierId }))) {
      return fail(res, req.user.isAdmin ? 400 : 404, req.user.isAdmin ? "Choose a company." : "No company profile is linked to this account.");
    }

    const product = await Product.create({ ...fields, supplier_id: supplierId, created_by: req.user._id });
    res.status(201).json({ success: true, message: "Product added", product });
  }),
);

router.put(
  "/products/:id",
  authenticate,
  requireRole("admin", "supplier"),
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Product not found.");
    const product = await Product.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    if (!canEditProduct(req, product)) return fail(res, 403, "You can only edit your own products.");

    const fields = productFields(req.body);
    if (!fields.name) return fail(res, 400, "Product name is required.");
    if (req.user.isAdmin && req.body.supplierId) {
      if (!isId(req.body.supplierId) || !(await Supplier.exists({ _id: req.body.supplierId }))) return fail(res, 400, "Choose a company.");
      fields.supplier_id = req.body.supplierId;
    }

    Object.assign(product, fields);
    await product.save();
    res.json({ success: true, message: "Product saved", product });
  }),
);

router.delete(
  "/products/:id",
  authenticate,
  requireRole("admin", "supplier"),
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Product not found.");
    const product = await Product.findById(req.params.id);
    if (!product) return fail(res, 404, "Product not found.");
    if (!canEditProduct(req, product)) return fail(res, 403, "You can only delete your own products.");
    await product.deleteOne();
    res.json({ success: true, message: "Product deleted" });
  }),
);

// ==================================================
// ENQUIRIES ("Contact supplier")
// ==================================================

router.post(
  "/enquiries",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { supplierId, productId } = req.body;
    if (!isId(supplierId) || !(await Supplier.exists({ _id: supplierId }))) return fail(res, 404, "Supplier not found.");

    const name = str(req.body.name) || (req.user && req.user.name);
    const email = str(req.body.email) || (req.user && req.user.email) || null;
    const phone = str(req.body.phone) || null;
    const message = str(req.body.message);
    if (!name || !message) return fail(res, 400, "Name and message are required.");
    if (!email && !phone) return fail(res, 400, "Add an email or phone number so the supplier can reply.");

    const enquiry = await Enquiry.create({
      supplier_id: supplierId,
      product_id: isId(productId) ? productId : null,
      user_id: req.user ? req.user._id : null,
      name,
      email,
      phone,
      quantity: str(req.body.quantity) || null,
      message,
    });
    res.status(201).json({ success: true, message: "Enquiry sent", enquiry });
  }),
);

module.exports = router;