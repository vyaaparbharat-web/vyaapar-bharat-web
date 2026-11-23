const { Schema, model } = require("mongoose");

const QUOTE_STATUSES = ["pending", "accepted", "rejected", "negotiating"];

const quoteSchema = new Schema(
  {
    requirement_id: { type: Schema.Types.ObjectId, ref: "Requirement", required: true, index: true },
    supplier_user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    supplier_company_id: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
    supplier_name: { type: String, required: true, trim: true },
    supplier_email: { type: String, default: null },
    supplier_phone: { type: String, default: null },
    quoted_price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    delivery_time: { type: String, default: null },
    message: { type: String, default: null },
    status: { type: String, enum: QUOTE_STATUSES, default: "pending", index: true },
    legacy_id: { type: Number, default: null, index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// One live quote per supplier per requirement (re-sending updates it)
quoteSchema.index({ requirement_id: 1, supplier_user_id: 1 }, { unique: true });

module.exports = model("Quote", quoteSchema);
module.exports.QUOTE_STATUSES = QUOTE_STATUSES;
