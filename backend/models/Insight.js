const { Schema, model } = require("mongoose");

const insightSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    category_id: { type: String, required: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    image_url: { type: String, default: null },
    author_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    legacy_id: { type: Number, default: null, index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

module.exports = model("Insight", insightSchema);
