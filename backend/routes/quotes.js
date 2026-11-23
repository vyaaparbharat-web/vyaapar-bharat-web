const router = require("express").Router();
const { Requirement, Quote, Supplier } = require("../models");
const { authenticate, requireRole } = require("../middleware/auth");
const { asyncHandler, fail, isId, toNumber, str, plain } = require("../utils/helpers");

const OPEN_FOR_QUOTES = ["open", "quoted", "negotiating"];

// Requirement status that follows from its remaining (non-accepted) quotes
async function statusFromQuotes(requirementId) {
  if (await Quote.exists({ requirement_id: requirementId, status: "negotiating" })) return "negotiating";
  if (await Quote.exists({ requirement_id: requirementId, status: "pending" })) return "quoted";
  return "open";
}

// ===============================
// Send (or revise) a quote – suppliers only
// The quote is always tied to the logged-in supplier account.
// ===============================
router.post(
  "/",
  authenticate,
  requireRole("supplier"),
  asyncHandler(async (req, res) => {
    const { requirementId } = req.body;
    const quotedPrice = toNumber(req.body.quotedPrice);
    const quantity = toNumber(req.body.quantity);
    const unit = str(req.body.unit);

    if (!isId(requirementId)) return fail(res, 404, "Requirement not found.");
    if (!quotedPrice || quotedPrice <= 0 || !quantity || quantity <= 0 || !unit) {
      return fail(res, 400, "Quoted price, quantity and unit are required.");
    }

    const requirement = await Requirement.findById(requirementId);
    if (!requirement) return fail(res, 404, "Requirement not found.");
    if (String(requirement.buyer_id) === req.user.id) return fail(res, 400, "You can't quote on your own requirement.");
    if (!OPEN_FOR_QUOTES.includes(requirement.status)) {
      return fail(res, 400, "This requirement is no longer accepting quotes.");
    }

    const company = req.user.supplierId ? await Supplier.findById(req.user.supplierId).select("name email phone") : null;
    const fields = {
      supplier_company_id: company ? company._id : null,
      supplier_name: (company && company.name) || req.user.doc.company_name || req.user.name,
      supplier_email: (company && company.email) || req.user.email,
      supplier_phone: (company && company.phone) || req.user.doc.phone || null,
      quoted_price: quotedPrice,
      quantity,
      unit,
      delivery_time: str(req.body.deliveryTime) || null,
      message: str(req.body.message) || null,
      status: "pending",
    };

    let quote = await Quote.findOne({ requirement_id: requirement._id, supplier_user_id: req.user._id });
    const revised = Boolean(quote);
    if (quote) {
      if (quote.status === "accepted") return fail(res, 400, "Your quote was already accepted.");
      Object.assign(quote, fields);
      await quote.save();
    } else {
      quote = await Quote.create({ ...fields, requirement_id: requirement._id, supplier_user_id: req.user._id });
    }

    if (requirement.status === "open") {
      requirement.status = "quoted";
      await requirement.save();
    }

    res.status(revised ? 200 : 201).json({ success: true, message: revised ? "Quote updated" : "Quote sent", quote });
  }),
);

// ===============================
// My quotes (supplier)
// ===============================
router.get(
  "/mine",
  authenticate,
  requireRole("supplier"),
  asyncHandler(async (req, res) => {
    const quotes = await Quote.find({ supplier_user_id: req.user._id })
      .sort({ created_at: -1 })
      .populate("requirement_id", "title category subcategory delivery_location required_by status")
      .lean();

    res.json({
      success: true,
      quotes: quotes.map((q) => {
        const r = q.requirement_id || {};
        return {
          ...plain({ ...q, requirement_id: r._id || null }),
          requirement_title: r.title || "Deleted requirement",
          requirement_category: r.category || null,
          requirement_subcategory: r.subcategory || null,
          requirement_delivery_location: r.delivery_location || null,
          requirement_required_by: r.required_by || null,
          requirement_status: r.status || null,
        };
      }),
    });
  }),
);

async function loadQuoteWithAccess(req, res) {
  if (!isId(req.params.id)) return fail(res, 404, "Quote not found."), {};
  const quote = await Quote.findById(req.params.id);
  if (!quote) return fail(res, 404, "Quote not found."), {};
  const requirement = await Requirement.findById(quote.requirement_id);
  const isBuyer = requirement && String(requirement.buyer_id) === req.user.id;
  const isSupplier = String(quote.supplier_user_id) === req.user.id;
  return { quote, requirement, isBuyer, isSupplier };
}

// ===============================
// Single quote – buyer of the requirement, the supplier who sent it, or admin
// ===============================
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { quote, requirement, isBuyer, isSupplier } = await loadQuoteWithAccess(req, res);
    if (!quote) return;
    if (!isBuyer && !isSupplier && !req.user.isAdmin) return fail(res, 403, "You don't have access to this quote.");

    res.json({
      success: true,
      quote: {
        ...quote.toJSON(),
        requirement_title: requirement ? requirement.title : null,
        requirement_category: requirement ? requirement.category : null,
        requirement_delivery_location: requirement ? requirement.delivery_location : null,
      },
    });
  }),
);

// ===============================
// Accept / reject / negotiate – only the buyer who posted the requirement (or admin)
// ===============================
router.patch(
  "/:id/status",
  authenticate,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["pending", "accepted", "rejected", "negotiating"].includes(status)) {
      return fail(res, 400, "Status must be pending, accepted, rejected or negotiating.");
    }

    const { quote, requirement, isBuyer } = await loadQuoteWithAccess(req, res);
    if (!quote) return;
    if (!requirement) return fail(res, 404, "Requirement not found.");
    if (!isBuyer && !req.user.isAdmin) return fail(res, 403, "Only the buyer who posted this requirement can respond to quotes.");
    if (requirement.status === "accepted" && quote.status !== "accepted") {
      return fail(res, 400, "You already accepted another quote for this requirement.");
    }
    if (requirement.status === "closed") return fail(res, 400, "Reopen the requirement to respond to quotes.");

    quote.status = status;
    await quote.save();

    if (status === "accepted") {
      await Quote.updateMany(
        { requirement_id: requirement._id, _id: { $ne: quote._id }, status: { $ne: "rejected" } },
        { $set: { status: "rejected" } },
      );
      requirement.status = "accepted";
    } else if (status === "negotiating") {
      requirement.status = "negotiating";
    } else {
      // pending / rejected: recompute from what's left
      requirement.status = await statusFromQuotes(requirement._id);
    }
    await requirement.save();

    const labels = { accepted: "Quote accepted", rejected: "Quote rejected", negotiating: "Marked as negotiating", pending: "Quote moved back to pending" };
    res.json({ success: true, message: labels[status], quote, requirement });
  }),
);

// ===============================
// Withdraw my quote (supplier) – admin can delete any
// ===============================
router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const { quote, requirement, isSupplier } = await loadQuoteWithAccess(req, res);
    if (!quote) return;
    if (!isSupplier && !req.user.isAdmin) return fail(res, 403, "You can only withdraw your own quotes.");
    if (quote.status === "accepted" && !req.user.isAdmin) return fail(res, 400, "An accepted quote can't be withdrawn.");

    await quote.deleteOne();
    if (requirement && requirement.status !== "closed" && (requirement.status !== "accepted" || quote.status === "accepted")) {
      requirement.status = await statusFromQuotes(requirement._id);
      await requirement.save();
    }
    res.json({ success: true, message: "Quote withdrawn" });
  }),
);

module.exports = router;
