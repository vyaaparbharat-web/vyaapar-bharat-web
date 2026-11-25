// const router = require("express").Router();
// const { Types } = require("mongoose");
// const { Requirement, Quote, Product } = require("../models");
// const { authenticate, optionalAuth } = require("../middleware/auth");
// const { asyncHandler, fail, isId, toNumber, str, plain, escapeRegex } = require("../utils/helpers");

// // Public listing never exposes who the buyer is beyond a first name.
// const publicView = (r, viewer) => {
//   const out = plain(r);
//   const mine = viewer && String(r.buyer_id) === viewer.id;
//   out.is_mine = Boolean(mine);
//   if (!mine && !(viewer && viewer.isAdmin)) {
//     out.buyer_name = r.buyer_name ? String(r.buyer_name).split(" ")[0] : null;
//     delete out.buyer_id;
//   }
//   return out;
// };

// async function withQuoteCounts(match, sort = { created_at: -1 }, limit = 0) {
//   const pipeline = [
//     { $match: match },
//     { $sort: sort },
//     ...(limit ? [{ $limit: limit }] : []),
//     { $lookup: { from: "quotes", localField: "_id", foreignField: "requirement_id", as: "q" } },
//     { $addFields: { quote_count: { $size: "$q" } } },
//     { $project: { q: 0 } },
//   ];
//   return Requirement.aggregate(pipeline);
// }

// function readBody(body) {
//   return {
//     title: str(body.title),
//     category: str(body.category),
//     subcategory: str(body.subcategory) || null,
//     quantity: toNumber(body.quantity),
//     unit: str(body.unit),
//     description: str(body.description),
//     min_budget: toNumber(body.minBudget),
//     max_budget: toNumber(body.maxBudget),
//     delivery_location: str(body.deliveryLocation),
//     required_by: body.requiredBy ? new Date(body.requiredBy) : null,
//   };
// }

// function validate(data) {
//   if (!data.title || !data.category || !data.quantity || !data.unit || !data.description || !data.delivery_location) {
//     return "Title, category, quantity, unit, description and delivery location are required.";
//   }
//   if (data.quantity <= 0) return "Quantity must be more than 0.";
//   if (data.min_budget != null && data.max_budget != null && data.min_budget > data.max_budget) {
//     return "Minimum budget can't be more than maximum budget.";
//   }
//   if (data.required_by && Number.isNaN(data.required_by.getTime())) return "Required-by date is not valid.";
//   return null;
// }

// async function loadOwned(req, res) {
//   if (!isId(req.params.id)) return fail(res, 404, "Requirement not found."), null;
//   const requirement = await Requirement.findById(req.params.id);
//   if (!requirement) return fail(res, 404, "Requirement not found."), null;
//   if (String(requirement.buyer_id) !== req.user.id && !req.user.isAdmin) {
//     return fail(res, 403, "Only the buyer who posted this requirement can change it."), null;
//   }
//   return requirement;
// }

// // ===============================
// // Create requirement (owned by the logged-in user)
// // ===============================
// router.post(
//   "/",
//   authenticate,
//   asyncHandler(async (req, res) => {
//     const data = readBody(req.body);
//     const error = validate(data);
//     if (error) return fail(res, 400, error);

//     if (req.body.productId && isId(req.body.productId)) {
//       const product = await Product.findById(req.body.productId).select("supplier_id");
//       if (product) {
//         data.product_id = product._id;
//         data.supplier_id = product.supplier_id;
//       }
//     }

//     // A Google user who never picked a type becomes a buyer by posting
//     if (req.user.role === "user") {
//       req.user.doc.role = "buyer";
//       await req.user.doc.save();
//     }

//     const requirement = await Requirement.create({ ...data, buyer_id: req.user._id, buyer_name: req.user.name });
//     res.status(201).json({ success: true, message: "Requirement posted", requirement });
//   }),
// );

// // ===============================
// // All requirements (marketplace) – public
// // ?q= &category= &status=open|active|all
// // ===============================
// router.get(
//   "/",
//   optionalAuth,
//   asyncHandler(async (req, res) => {
//     const match = {};
//     const { q, category, status } = req.query;
//     if (q) {
//       const rx = new RegExp(escapeRegex(q), "i");
//       match.$or = [{ title: rx }, { category: rx }, { subcategory: rx }, { delivery_location: rx }, { description: rx }];
//     }
//     if (category) match.category = new RegExp(`^${escapeRegex(category)}$`, "i");
//     if (status === "active") match.status = { $in: ["open", "quoted", "negotiating"] };
//     else if (status && status !== "all") match.status = status;

//     const rows = await withQuoteCounts(match);
//     res.json({ success: true, requirements: rows.map((r) => publicView(r, req.user)) });
//   }),
// );

// // ===============================
// // My requirements (buyer)
// // ===============================
// router.get(
//   "/mine",
//   authenticate,
//   asyncHandler(async (req, res) => {
//     const rows = await withQuoteCounts({ buyer_id: req.user._id });
//     res.json({ success: true, requirements: rows.map((r) => ({ ...plain(r), is_mine: true })) });
//   }),
// );

// // ===============================
// // Single requirement – public, with viewer info
// // ===============================
// router.get(
//   "/:id",
//   optionalAuth,
//   asyncHandler(async (req, res) => {
//     if (!isId(req.params.id)) return fail(res, 404, "Requirement not found.");
//     const [row] = await withQuoteCounts({ _id: new Types.ObjectId(req.params.id) });
//     if (!row) return fail(res, 404, "Requirement not found.");

//     const viewer = { isOwner: false, myQuote: null, canQuote: false, canManage: false };
//     if (req.user) {
//       viewer.isOwner = String(row.buyer_id) === req.user.id;
//       viewer.canManage = viewer.isOwner || req.user.isAdmin;
//       if (req.user.role === "supplier") {
//         const mine = await Quote.findOne({ requirement_id: row._id, supplier_user_id: req.user._id });
//         viewer.myQuote = mine ? mine.toJSON() : null;
//         viewer.canQuote =
//           !viewer.isOwner && ["open", "quoted", "negotiating"].includes(row.status) && (!mine || mine.status !== "accepted");
//       }
//     }

//     res.json({ success: true, requirement: publicView(row, req.user), viewer });
//   }),
// );

// // ===============================
// // Edit requirement (owner / admin)
// // ===============================
// router.put(
//   "/:id",
//   authenticate,
//   asyncHandler(async (req, res) => {
//     const requirement = await loadOwned(req, res);
//     if (!requirement) return;
//     if (requirement.status === "accepted") return fail(res, 400, "A requirement with an accepted quote can't be edited.");

//     const data = readBody(req.body);
//     const error = validate(data);
//     if (error) return fail(res, 400, error);

//     Object.assign(requirement, data);
//     await requirement.save();
//     res.json({ success: true, message: "Requirement updated", requirement });
//   }),
// );

// // ===============================
// // Close / reopen (owner / admin)
// // ===============================
// router.patch(
//   "/:id/status",
//   authenticate,
//   asyncHandler(async (req, res) => {
//     const requirement = await loadOwned(req, res);
//     if (!requirement) return;
//     const { status } = req.body;

//     if (status === "closed") {
//       if (requirement.status === "accepted") return fail(res, 400, "This requirement already has an accepted quote.");
//       requirement.status = "closed";
//     } else if (status === "open") {
//       if (requirement.status !== "closed") return fail(res, 400, "Only a closed requirement can be reopened.");
//       const quotes = await Quote.countDocuments({ requirement_id: requirement._id, status: { $ne: "rejected" } });
//       requirement.status = quotes ? "quoted" : "open";
//     } else {
//       return fail(res, 400, "Status must be closed or open.");
//     }
//     await requirement.save();
//     res.json({ success: true, message: status === "closed" ? "Requirement closed" : "Requirement reopened", requirement });
//   }),
// );

// // ===============================
// // Delete (owner / admin) – also removes its quotes
// // ===============================
// router.delete(
//   "/:id",
//   authenticate,
//   asyncHandler(async (req, res) => {
//     const requirement = await loadOwned(req, res);
//     if (!requirement) return;
//     await Quote.deleteMany({ requirement_id: requirement._id });
//     await requirement.deleteOne();
//     res.json({ success: true, message: "Requirement deleted" });
//   }),
// );

// // ===============================
// // Quotes on a requirement
// // buyer (owner) / admin → all quotes; supplier → only their own
// // ===============================
// router.get(
//   "/:id/quotes",
//   authenticate,
//   asyncHandler(async (req, res) => {
//     if (!isId(req.params.id)) return fail(res, 404, "Requirement not found.");
//     const requirement = await Requirement.findById(req.params.id).select("buyer_id");
//     if (!requirement) return fail(res, 404, "Requirement not found.");

//     const isOwner = String(requirement.buyer_id) === req.user.id;
//     const filter = { requirement_id: requirement._id };
//     if (!isOwner && !req.user.isAdmin) {
//       if (req.user.role !== "supplier") return fail(res, 403, "Only the buyer can see quotes on this requirement.");
//       filter.supplier_user_id = req.user._id;
//     }

//     const quotes = await Quote.find(filter).sort({ created_at: -1 });
//     res.json({ success: true, quotes });
//   }),
// );

// module.exports = router;



const router = require("express").Router();
const { Types } = require("mongoose");
const { Requirement, Quote, Product } = require("../models");
const { authenticate, optionalAuth } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");
const { asyncHandler, fail, isId, toNumber, str, plain, escapeRegex } = require("../utils/helpers");
const { normalisePhone, normaliseEmail } = require("../utils/otp");

// Guests (not logged in) can post a few requirements per hour from one IP
const guestLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: "Too many requirements posted. Try again in an hour, or log in." });
const limitGuests = (req, res, next) => (req.user ? next() : guestLimit(req, res, next));

// Buyer contact details are public so suppliers can call the buyer directly.
// Older requirements have no contact_* fields, so fall back to the buyer's account.
const publicView = (r, viewer) => {
  const out = plain(r);
  const u = r.buyer_user || {};
  delete out.buyer_user;
  const mine = viewer && r.buyer_id && String(r.buyer_id) === viewer.id;
  out.is_mine = Boolean(mine);
  out.buyer_name = r.buyer_name || u.name || null;
  out.buyer_phone = r.contact_phone || u.phone || null;
  out.buyer_email = r.contact_email || u.email || null;
  out.buyer_company = r.contact_company || u.company_name || null;
  out.has_account = Boolean(r.buyer_id);
  if (!mine && !(viewer && viewer.isAdmin)) delete out.buyer_id;
  return out;
};

async function withQuoteCounts(match, sort = { created_at: -1 }, limit = 0) {
  const pipeline = [
    { $match: match },
    { $sort: sort },
    ...(limit ? [{ $limit: limit }] : []),
    { $lookup: { from: "quotes", localField: "_id", foreignField: "requirement_id", as: "q" } },
    { $addFields: { quote_count: { $size: "$q" } } },
    {
      $lookup: {
        from: "users",
        let: { b: "$buyer_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$b"] } } }, { $project: { name: 1, phone: 1, email: 1, company_name: 1 } }],
        as: "bu",
      },
    },
    { $addFields: { buyer_user: { $arrayElemAt: ["$bu", 0] } } },
    { $project: { q: 0, bu: 0 } },
  ];
  return Requirement.aggregate(pipeline);
}

// Contact details from the form. Logged-in users default to their account details.
// Returns { error } or { contact }.
function readContact(body, user) {
  const name = str(body.contactName) || (user && user.name) || "";
  const rawPhone = str(body.contactPhone) || (user && user.phone) || "";
  const rawEmail = str(body.contactEmail) || (user && user.email) || "";
  const company = str(body.contactCompany) || (user && user.company_name) || null;

  const phone = rawPhone ? normalisePhone(rawPhone) : null;
  const email = rawEmail ? normaliseEmail(rawEmail) : null;

  if (!name) return { error: "Enter your name." };
  if (name.length > 120) return { error: "Name is too long." };
  if (rawPhone && !phone) return { error: "Enter a valid 10-digit mobile number." };
  if (rawEmail && !email) return { error: "Enter a valid email address." };
  if (!user && !phone) return { error: "Enter your mobile number so suppliers can contact you." };
  if (!phone && !email) return { error: "Add a mobile number or email so suppliers can contact you." };
  if (company && company.length > 160) return { error: "Company name is too long." };

  return { contact: { buyer_name: name, contact_phone: phone, contact_email: email, contact_company: company } };
}

function readBody(body) {
  return {
    title: str(body.title),
    category: str(body.category),
    subcategory: str(body.subcategory) || null,
    quantity: toNumber(body.quantity),
    unit: str(body.unit),
    description: str(body.description),
    min_budget: toNumber(body.minBudget),
    max_budget: toNumber(body.maxBudget),
    delivery_location: str(body.deliveryLocation),
    required_by: body.requiredBy ? new Date(body.requiredBy) : null,
  };
}

function validate(data) {
  if (!data.title || !data.category || !data.quantity || !data.unit || !data.description || !data.delivery_location) {
    return "Title, category, quantity, unit, description and delivery location are required.";
  }
  if (data.quantity <= 0) return "Quantity must be more than 0.";
  if (data.min_budget != null && data.max_budget != null && data.min_budget > data.max_budget) {
    return "Minimum budget can't be more than maximum budget.";
  }
  if (data.required_by && Number.isNaN(data.required_by.getTime())) return "Required-by date is not valid.";
  return null;
}

async function loadOwned(req, res) {
  if (!isId(req.params.id)) return fail(res, 404, "Requirement not found."), null;
  const requirement = await Requirement.findById(req.params.id);
  if (!requirement) return fail(res, 404, "Requirement not found."), null;
  if (String(requirement.buyer_id) !== req.user.id && !req.user.isAdmin) {
    return fail(res, 403, "Only the buyer who posted this requirement can change it."), null;
  }
  return requirement;
}

// ===============================
// Create requirement: logged-in users, or guests with their contact details
// ===============================
router.post(
  "/",
  optionalAuth,
  limitGuests,
  asyncHandler(async (req, res) => {
    // Hidden "website" field: real people leave it empty, simple bots fill it in
    if (str(req.body.website)) return fail(res, 400, "Couldn't post this requirement.");
    if (req.user && req.user.role === "supplier") return fail(res, 403, "Supplier accounts can't post requirements. Use a buyer account.");

    const data = readBody(req.body);
    const error = validate(data);
    if (error) return fail(res, 400, error);

    const { contact, error: contactError } = readContact(req.body, req.user && req.user.doc);
    if (contactError) return fail(res, 400, contactError);

    if (req.body.productId && isId(req.body.productId)) {
      const product = await Product.findById(req.body.productId).select("supplier_id");
      if (product) {
        data.product_id = product._id;
        data.supplier_id = product.supplier_id;
      }
    }

    if (!req.user) {
      const requirement = await Requirement.create({ ...data, ...contact, buyer_id: null, posted_as_guest: true });
      return res.status(201).json({ success: true, message: "Requirement posted", requirement, guest: true });
    }

    // A Google user who never picked a type becomes a buyer by posting
    if (req.user.role === "user") {
      req.user.doc.role = "buyer";
      await req.user.doc.save();
    }

    const requirement = await Requirement.create({ ...data, ...contact, buyer_id: req.user._id });
    res.status(201).json({ success: true, message: "Requirement posted", requirement });
  }),
);

// ===============================
// All requirements (marketplace) – public
// ?q= &category= &status=open|active|all
// ===============================
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const match = {};
    const { q, category, status } = req.query;
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      match.$or = [{ title: rx }, { category: rx }, { subcategory: rx }, { delivery_location: rx }, { description: rx }];
    }
    if (category) match.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    if (status === "active") match.status = { $in: ["open", "quoted", "negotiating"] };
    else if (status && status !== "all") match.status = status;

    const rows = await withQuoteCounts(match);
    res.json({ success: true, requirements: rows.map((r) => publicView(r, req.user)) });
  }),
);

// ===============================
// My requirements (buyer)
// ===============================
router.get(
  "/mine",
  authenticate,
  asyncHandler(async (req, res) => {
    const rows = await withQuoteCounts({ buyer_id: req.user._id });
    res.json({ success: true, requirements: rows.map((r) => ({ ...publicView(r, req.user), is_mine: true })) });
  }),
);

// ===============================
// Single requirement – public, with viewer info
// ===============================
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Requirement not found.");
    const [row] = await withQuoteCounts({ _id: new Types.ObjectId(req.params.id) });
    if (!row) return fail(res, 404, "Requirement not found.");

    const viewer = { isOwner: false, myQuote: null, canQuote: false, canManage: false };
    if (req.user) {
      viewer.isOwner = String(row.buyer_id) === req.user.id;
      viewer.canManage = viewer.isOwner || req.user.isAdmin;
      if (req.user.role === "supplier") {
        const mine = await Quote.findOne({ requirement_id: row._id, supplier_user_id: req.user._id });
        viewer.myQuote = mine ? mine.toJSON() : null;
        viewer.canQuote =
          !viewer.isOwner && ["open", "quoted", "negotiating"].includes(row.status) && (!mine || mine.status !== "accepted");
      }
    }

    res.json({ success: true, requirement: publicView(row, req.user), viewer });
  }),
);

// ===============================
// Edit requirement (owner / admin)
// ===============================
router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const requirement = await loadOwned(req, res);
    if (!requirement) return;
    if (requirement.status === "accepted") return fail(res, 400, "A requirement with an accepted quote can't be edited.");

    const data = readBody(req.body);
    const error = validate(data);
    if (error) return fail(res, 400, error);

    if (req.body.contactName !== undefined || req.body.contactPhone !== undefined) {
      // Empty fields keep what the requirement already has (not the editor's own details)
      const current = {
        name: requirement.buyer_name,
        phone: requirement.contact_phone,
        email: requirement.contact_email,
        company_name: requirement.contact_company,
      };
      const { contact, error: contactError } = readContact(req.body, current);
      if (contactError) return fail(res, 400, contactError);
      Object.assign(data, contact);
    }

    Object.assign(requirement, data);
    await requirement.save();
    res.json({ success: true, message: "Requirement updated", requirement });
  }),
);

// ===============================
// Close / reopen (owner / admin)
// ===============================
router.patch(
  "/:id/status",
  authenticate,
  asyncHandler(async (req, res) => {
    const requirement = await loadOwned(req, res);
    if (!requirement) return;
    const { status } = req.body;

    if (status === "closed") {
      if (requirement.status === "accepted") return fail(res, 400, "This requirement already has an accepted quote.");
      requirement.status = "closed";
    } else if (status === "open") {
      if (requirement.status !== "closed") return fail(res, 400, "Only a closed requirement can be reopened.");
      const quotes = await Quote.countDocuments({ requirement_id: requirement._id, status: { $ne: "rejected" } });
      requirement.status = quotes ? "quoted" : "open";
    } else {
      return fail(res, 400, "Status must be closed or open.");
    }
    await requirement.save();
    res.json({ success: true, message: status === "closed" ? "Requirement closed" : "Requirement reopened", requirement });
  }),
);

// ===============================
// Delete (owner / admin) – also removes its quotes
// ===============================
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const requirement = await loadOwned(req, res);
    if (!requirement) return;
    await Quote.deleteMany({ requirement_id: requirement._id });
    await requirement.deleteOne();
    res.json({ success: true, message: "Requirement deleted" });
  }),
);

// ===============================
// Quotes on a requirement
// buyer (owner) / admin → all quotes; supplier → only their own
// ===============================
router.get(
  "/:id/quotes",
  authenticate,
  asyncHandler(async (req, res) => {
    if (!isId(req.params.id)) return fail(res, 404, "Requirement not found.");
    const requirement = await Requirement.findById(req.params.id).select("buyer_id");
    if (!requirement) return fail(res, 404, "Requirement not found.");

    const isOwner = String(requirement.buyer_id) === req.user.id;
    const filter = { requirement_id: requirement._id };
    if (!isOwner && !req.user.isAdmin) {
      if (req.user.role !== "supplier") return fail(res, 403, "Only the buyer can see quotes on this requirement.");
      filter.supplier_user_id = req.user._id;
    }

    const quotes = await Quote.find(filter).sort({ created_at: -1 });
    res.json({ success: true, quotes });
  }),
);

module.exports = router;