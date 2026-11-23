const { Schema, model } = require("mongoose");

const productSchema = new Schema(
  {
    supplier_id: { type: Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: null, index: true },
    subcategory: { type: String, default: null },
    description: { type: String, default: null },
    price: { type: Number, default: null },
    price_unit: { type: String, default: null },
    moq: { type: Number, default: null },
    moq_unit: { type: String, default: null },
    availability: { type: String, default: "Available" },
    image_url: { type: String, default: null },
    legacy_id: { type: Number, default: null, index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

module.exports = model("Product", productSchema);
