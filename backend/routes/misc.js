// Insights, dashboards and admin tools
const router = require("express").Router();
const { User, Supplier, Product, Requirement, Quote, Insight, Enquiry } = require("../models");
const { authenticate, requireRole, requireAdmin } = require("../middleware/auth");
const { insightUpload } = require("../middleware/upload");
const { asyncHandler, fail, isId, str, plain, escapeRegex } = require("../utils/helpers");

// ==================================================
// INSIGHTS
// ==================================================

router.get(
  "/insights",
  asyncHandler(async (req, res) => {
    const insights = await Insight.find().sort({ created_at: -1 });
    res.json({ success: true, insights });
  }),
);

router.get(
  "/insights/:id",
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Insight not found.");
    const insight = await Insight.findById(req.params.id);
    if (!insight) return fail(res, 404, "Insight not found.");
    res.json({ success: true, insight });
  }),
);

const insightFields = (b) => ({
  title: str(b.title),
  category: str(b.category),
  category_id: str(b.category_id),
  excerpt: str(b.excerpt),
  content: str(b.content),
  image_url: str(b.image_url) || null,
});
const insightError = (f) =>
  !f.title || !f.category || !f.category_id || !f.excerpt || !f.content ? "Title, category, excerpt and content are required." : null;

router.post(
  "/insights/upload-image",
  requireAdmin,
  insightUpload.single("image"),
  (req, res) => {
    if (!req.file) return fail(res, 400, "Select an image.");
    res.status(201).json({ success: true, image_url: `/uploads/insights/${req.file.filename}` });
  },
);

router.post(
  "/insights",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const f = insightFields(req.body);
    const err = insightError(f);
    if (err) return fail(res, 400, err);
    const insight = await Insight.create({ ...f, author_id: req.user._id });
    res.status(201).json({ success: true, message: "Insight published", insight });
  }),
);

router.put(
  "/insights/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Insight not found.");
    const f = insightFields(req.body);
    const err = insightError(f);
    if (err) return fail(res, 400, err);
    const insight = await Insight.findByIdAndUpdate(req.params.id, f, { new: true });
    if (!insight) return fail(res, 404, "Insight not found.");
    res.json({ success: true, message: "Insight saved", insight });
  }),
);

router.delete(
  "/insights/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Insight not found.");
    const insight = await Insight.findByIdAndDelete(req.params.id);
    if (!insight) return fail(res, 404, "Insight not found.");
    res.json({ success: true, message: "Insight deleted" });
  }),
);

// ==================================================
// DASHBOARDS (always scoped to the logged-in user)
// ==================================================

router.get(
  "/dashboard/buyer",
  authenticate,
  asyncHandler(async (req, res) => {
    const reqs = await Requirement.find({ buyer_id: req.user._id }).sort({ created_at: -1 }).lean();
    const ids = reqs.map((r) => r._id);
    const quotes = await Quote.find({ requirement_id: { $in: ids } }).sort({ created_at: -1 }).lean();
    const titles = Object.fromEntries(reqs.map((r) => [String(r._id), r.title]));
    const countBy = {};
    quotes.forEach((q) => (countBy[String(q.requirement_id)] = (countBy[String(q.requirement_id)] || 0) + 1));

    res.json({
      success: true,
      stats: {
        totalRequirements: reqs.length,
        activeRequirements: reqs.filter((r) => ["open", "quoted", "negotiating"].includes(r.status)).length,
        quotesReceived: quotes.length,
        pendingQuotes: quotes.filter((q) => q.status === "pending").length,
        acceptedQuotes: quotes.filter((q) => q.status === "accepted").length,
      },
      recentRequirements: reqs.slice(0, 5).map((r) => ({ ...plain(r), quote_count: countBy[String(r._id)] || 0 })),
      recentQuotes: quotes.slice(0, 6).map((q) => ({ ...plain(q), requirement_title: titles[String(q.requirement_id)] })),
    });
  }),
);

router.get(
  "/dashboard/supplier",
  authenticate,
  requireRole("supplier"),
  asyncHandler(async (req, res) => {
    const company = req.user.supplierId ? await Supplier.findById(req.user.supplierId) : null;
    const [quotes, productCount, enquiryCount, newEnquiries] = await Promise.all([
      Quote.find({ supplier_user_id: req.user._id }).sort({ created_at: -1 }).populate("requirement_id", "title status delivery_location").lean(),
      company ? Product.countDocuments({ supplier_id: company._id }) : 0,
      company ? Enquiry.countDocuments({ supplier_id: company._id }) : 0,
      company ? Enquiry.countDocuments({ supplier_id: company._id, status: "new" }) : 0,
    ]);

    // Open requirements this supplier hasn't quoted yet; same industry first
    const quotedIds = quotes.map((q) => q.requirement_id && q.requirement_id._id).filter(Boolean);
    const openMatch = { status: { $in: ["open", "quoted", "negotiating"] }, _id: { $nin: quotedIds }, buyer_id: { $ne: req.user._id } };
    let leads = [];
    if (company && company.industry) {
      leads = await Requirement.find({ ...openMatch, category: new RegExp(escapeRegex(company.industry), "i") }).sort({ created_at: -1 }).limit(5).lean();
    }
    if (leads.length < 5) {
      const more = await Requirement.find({ ...openMatch, _id: { $nin: [...quotedIds, ...leads.map((l) => l._id)] } })
        .sort({ created_at: -1 })
        .limit(5 - leads.length)
        .lean();
      leads = leads.concat(more);
    }

    res.json({
      success: true,
      company,
      stats: {
        products: productCount,
        quotesSent: quotes.length,
        pendingQuotes: quotes.filter((q) => ["pending", "negotiating"].includes(q.status)).length,
        acceptedQuotes: quotes.filter((q) => q.status === "accepted").length,
        enquiries: enquiryCount,
        newEnquiries,
      },
      recentQuotes: quotes.slice(0, 6).map((q) => {
        const r = q.requirement_id || {};
        return {
          ...plain({ ...q, requirement_id: r._id || null }),
          requirement_title: r.title || "Deleted requirement",
          requirement_status: r.status || null,
          requirement_delivery_location: r.delivery_location || null,
        };
      }),
      leads: leads.map((r) => {
        const out = plain(r);
        delete out.buyer_id;
        out.buyer_name = r.buyer_name ? String(r.buyer_name).split(" ")[0] : null;
        return out;
      }),
    });
  }),
);

// ==================================================
// ADMIN
// ==================================================

router.get(
  "/admin/stats",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const [users, buyers, suppliersUsers, companies, products, requirements, activeRequirements, quotes, insights, enquiries] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "buyer" }),
        User.countDocuments({ role: "supplier" }),
        Supplier.countDocuments(),
        Product.countDocuments(),
        Requirement.countDocuments(),
        Requirement.countDocuments({ status: { $in: ["open", "quoted", "negotiating"] } }),
        Quote.countDocuments(),
        Insight.countDocuments(),
        Enquiry.countDocuments(),
      ]);
    res.json({
      success: true,
      stats: { users, buyers, suppliers: suppliersUsers, companies, products, requirements, activeRequirements, quotes, insights, enquiries },
    });
  }),
);

router.get(
  "/admin/requirements",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const rows = await Requirement.aggregate([
      { $sort: { created_at: -1 } },
      { $lookup: { from: "quotes", localField: "_id", foreignField: "requirement_id", as: "q" } },
      { $lookup: { from: "users", localField: "buyer_id", foreignField: "_id", as: "b" } },
      {
        $addFields: {
          quote_count: { $size: "$q" },
          buyer_email: { $arrayElemAt: ["$b.email", 0] },
          buyer_phone: { $arrayElemAt: ["$b.phone", 0] },
        },
      },
      { $project: { q: 0, b: 0 } },
    ]);
    res.json({ success: true, requirements: rows.map(plain) });
  }),
);

router.get(
  "/admin/quotes",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const quotes = await Quote.find().sort({ created_at: -1 }).populate("requirement_id", "title category delivery_location").lean();
    res.json({
      success: true,
      quotes: quotes.map((q) => {
        const r = q.requirement_id || {};
        return {
          ...plain({ ...q, requirement_id: r._id || null }),
          requirement_title: r.title || null,
          requirement_category: r.category || null,
          requirement_location: r.delivery_location || null,
        };
      }),
    });
  }),
);

router.get(
  "/admin/enquiries",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const enquiries = await Enquiry.find().sort({ created_at: -1 }).populate("supplier_id", "name").lean();
    res.json({
      success: true,
      enquiries: enquiries.map((e) => ({
        ...plain({ ...e, supplier_id: e.supplier_id ? e.supplier_id._id : null }),
        supplier_name: e.supplier_id ? e.supplier_id.name : null,
      })),
    });
  }),
);

router.get(
  "/admin/users",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(req.query.q), "i");
      filter.$or = [{ name: rx }, { email: rx }, { company_name: rx }];
    }
    const users = await User.find(filter).sort({ created_at: -1 }).limit(500);
    res.json({ success: true, users: users.map((u) => u.toPublic()) });
  }),
);

// Enable/disable accounts; only super_admin can grant or remove admin rights
router.patch(
  "/admin/users/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "User not found.");
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "User not found.");
    if (String(user._id) === req.user.id) return fail(res, 400, "You can't change your own account here.");
    if (user.role === "super_admin") return fail(res, 403, "Super admin accounts can't be changed.");

    if (typeof req.body.isActive === "boolean") user.is_active = req.body.isActive;
    if (req.body.role) {
      const role = req.body.role;
      if (!["user", "buyer", "supplier", "admin"].includes(role)) return fail(res, 400, "Invalid role.");
      const touchesAdmin = role === "admin" || user.role === "admin";
      if (touchesAdmin && req.user.role !== "super_admin") return fail(res, 403, "Only a super admin can change admin access.");
      user.role = role;
      if (role === "supplier" && !user.supplier_id) {
        const company = await Supplier.create({ owner_id: user._id, name: user.company_name || user.name, email: user.email });
        user.supplier_id = company._id;
      }
    }
    await user.save();
    res.json({ success: true, message: "User updated", user: user.toPublic() });
  }),
);

module.exports = router;
