const { Schema, model } = require("mongoose");

// One-time codes for sign-up and login (email or mobile).
// The code itself is never stored, only a hash of it.
const otpSchema = new Schema(
  {
    channel: { type: String, enum: ["email", "phone"], required: true },
    target: { type: String, required: true, index: true }, // normalised email or +91 phone
    purpose: { type: String, enum: ["register", "login"], default: "register" },
    code_hash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    sends: { type: Number, default: 1 }, // how many codes sent to this target in the current hour
    window_started_at: { type: Date, default: Date.now },
    last_sent_at: { type: Date, default: Date.now },
    expires_at: { type: Date, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

otpSchema.index({ target: 1, purpose: 1 }, { unique: true });
// MongoDB deletes the document automatically one hour after the code expires
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 3600 });

module.exports = model("Otp", otpSchema);