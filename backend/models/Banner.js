const { Schema, model } = require("mongoose");

// Home page "Featured on Vyapaar Bharat" slideshow, managed by admins.
const bannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 }, // shown under the slideshow and used as alt text
    image_url: { type: String, required: true },
    // Where a click goes: a page on this site (/suppliers/...) or a full https:// link. Empty = not clickable.
    link_url: { type: String, default: null, trim: true },
    sort_order: { type: Number, default: 100 }, // lower shows first
    is_active: { type: Boolean, default: true },
    // Optional schedule, e.g. for paid ads: only shown between these dates
    starts_at: { type: Date, default: null },
    ends_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

module.exports = model("Banner", bannerSchema);