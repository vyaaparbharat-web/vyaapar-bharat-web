const { Schema, model } = require("mongoose");

// A company / business profile shown in the supplier directory.
const supplierSchema = new Schema(
  {
    owner_id: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true, trim: true },
    business_type: { type: String, default: null },
    industry: { type: String, default: null, index: true },
    location: { type: String, default: null },
    address: { type: String, default: null },
    description: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    years_in_business: { type: Number, default: null },
    verified: { type: Boolean, default: false },
    rating: { type: Number, default: null },
    reviews: { type: Number, default: 0 },
    services: { type: [String], default: [] },
    service_areas: { type: [String], default: [] },
    image_url: { type: String, default: null },
    gallery_images: { type: [String], default: [] },
    legacy_id: { type: Number, default: null, index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

supplierSchema.index({ name: "text", industry: "text", location: "text", description: "text" });

module.exports = model("Supplier", supplierSchema);
