const { Schema, model } = require("mongoose");

const ROLES = ["user", "buyer", "supplier", "admin", "super_admin"];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 255 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, default: null },
    role: { type: String, enum: ROLES, default: "user" },
    phone: { type: String, default: null, maxlength: 50 },
    company_name: { type: String, default: null, trim: true },
    city: { type: String, default: null, trim: true },
    gst_number: { type: String, default: null, trim: true },
    // For suppliers: the company profile (suppliers collection) this account manages
    supplier_id: { type: Schema.Types.ObjectId, ref: "Supplier", default: null },
    google_id: { type: String, default: null, index: true, sparse: true },
    auth_provider: { type: String, enum: ["local", "google"], default: "local" },
    is_active: { type: Boolean, default: true },
    is_verified: { type: Boolean, default: false }, // email verified (OTP or Google)
    phone_verified: { type: Boolean, default: false }, // mobile verified by OTP
    last_login_at: { type: Date, default: null },
    legacy_id: { type: Number, default: null, index: true }, // id from the old PostgreSQL table
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// Shape the frontend stores in localStorage (camelCase, no secrets)
userSchema.methods.toPublic = function toPublic() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    companyName: this.company_name,
    city: this.city,
    gstNumber: this.gst_number,
    supplierId: this.supplier_id ? String(this.supplier_id) : null,
    authProvider: this.auth_provider,
    isActive: this.is_active,
    isVerified: this.is_verified,
    phoneVerified: this.phone_verified,
    createdAt: this.created_at,
  };
};

module.exports = model("User", userSchema);
module.exports.ROLES = ROLES;