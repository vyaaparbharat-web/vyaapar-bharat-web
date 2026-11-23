const jwt = require("jsonwebtoken");
const User = require("../models/User");

const ADMIN_ROLES = ["admin", "super_admin"];

function signToken(user) {
  return jwt.sign({ userId: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

async function resolveUser(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return { error: "Authentication required" };

  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    return { error: "Your session has expired. Please log in again." };
  }

  // Always read the user from the database so a disabled account or a changed
  // role takes effect immediately, not when the token expires.
  const user = await User.findById(decoded.userId).catch(() => null);
  if (!user) return { error: "Account not found. Please log in again." };
  if (!user.is_active) return { error: "Your account has been disabled.", status: 403 };
  return { user };
}

function attach(req, user) {
  req.user = {
    id: String(user._id),
    _id: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
    supplierId: user.supplier_id ? String(user.supplier_id) : null,
    isAdmin: ADMIN_ROLES.includes(user.role),
    doc: user,
  };
}

// Requires a valid token
const authenticate = async (req, res, next) => {
  try {
    const { user, error, status } = await resolveUser(req);
    if (!user) return res.status(status || 401).json({ success: false, message: error });
    attach(req, user);
    next();
  } catch (err) {
    next(err);
  }
};

// Uses the token when present, but lets guests through
const optionalAuth = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const { user } = await resolveUser(req);
      if (user) attach(req, user);
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Use after authenticate: requireRole("supplier"), requireRole("admin") ...
// "admin" also lets super_admin in.
const requireRole =
  (...roles) =>
  (req, res, next) => {
    const allowed = roles.includes("admin") ? [...roles, "super_admin"] : roles;
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You don't have access to this action." });
    }
    next();
  };

const requireAdmin = [authenticate, requireRole("admin")];

module.exports = { authenticate, optionalAuth, requireRole, requireAdmin, signToken, ADMIN_ROLES };
