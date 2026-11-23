const { Schema, model } = require("mongoose");

// "Contact supplier" messages from a supplier profile / product page
const enquirySchema = new Schema(
  {
    supplier_id: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    user_id: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    quantity: { type: String, default: null },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "replied"], default: "new" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

module.exports = model("Enquiry", enquirySchema);
