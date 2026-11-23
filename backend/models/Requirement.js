const { Schema, model } = require("mongoose");

const REQUIREMENT_STATUSES = ["open", "quoted", "negotiating", "accepted", "closed"];

// A buyer's RFQ. Always belongs to the user who posted it (buyer_id).
const requirementSchema = new Schema(
  {
    buyer_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    buyer_name: { type: String, default: null },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, trim: true },
    subcategory: { type: String, default: null },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    min_budget: { type: Number, default: null },
    max_budget: { type: Number, default: null },
    delivery_location: { type: String, required: true, trim: true },
    required_by: { type: Date, default: null },
    status: { type: String, enum: REQUIREMENT_STATUSES, default: "open", index: true },
    // Optional: requirement raised from a product page
    product_id: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    supplier_id: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
    legacy_id: { type: Number, default: null, index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

module.exports = model("Requirement", requirementSchema);
module.exports.REQUIREMENT_STATUSES = REQUIREMENT_STATUSES;
