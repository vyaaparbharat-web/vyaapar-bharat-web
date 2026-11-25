const { Schema, model } = require("mongoose");

// Product / requirement categories, managed by admins.
// Products and requirements store the category NAME (string), so renaming a
// category also renames it on every product and requirement (see routes/categories.js).
const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name_hi: { type: String, default: null, trim: true }, // optional Hindi name shown under the English one
    description: { type: String, default: null, trim: true, maxlength: 500 },
    image_url: { type: String, default: null },
    sort_order: { type: Number, default: 100 }, // lower shows first (home page shows the first 9)
    is_active: { type: Boolean, default: true }, // hidden from the public site when false
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

categorySchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } }); // case-insensitive unique

module.exports = model("Category", categorySchema);