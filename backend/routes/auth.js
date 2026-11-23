const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const { User, Supplier, Otp } = require("../models");
const { authenticate, signToken } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");
const { asyncHandler, fail, str } = require("../utils/helpers");
const otp = require("../utils/otp");

// Brute-force protection (per IP)
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many login attempts. Try again in 15 minutes." });
const otpLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: "Too many codes requested. Try again in an hour." });
const registerLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 20 });

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function session(res, user, extra = {}, status = 200) {
  return res.status(status).json({
    success: true,
    token: signToken(user),
    user: user.toPublic(),
    needsRoleSelection: user.role === "user",
    ...extra,
  });
}

// A supplier account always manages one company profile in the directory.
async function ensureSupplierCompany(user) {
  if (user.supplier_id) return;
  const company = await Supplier.create({
    owner_id: user._id,
    name: user.company_name || user.name,
    location: user.city || null,
    email: user.email,
    phone: user.phone || null,
    verified: false,
  });
  user.supplier_id = company._id;
}

// Creates a fresh code for (target, purpose), enforces resend limits and delivers it.
// Sends the HTTP response itself.
async function issueCode(res, { channel, target, purpose }) {
  const now = Date.now();
  let record = await Otp.findOne({ target, purpose });

  if (record) {
    const wait = otp.RESEND_AFTER_SEC - Math.floor((now - record.last_sent_at.getTime()) / 1000);
    if (wait > 0) return fail(res, 429, `Please wait ${wait} seconds before asking for a new code.`);
    const windowOver = now - record.window_started_at.getTime() > 60 * 60 * 1000;
    if (!windowOver && record.sends >= otp.MAX_SENDS_PER_HOUR) {
      return fail(res, 429, "Too many codes sent to this address. Try again in an hour.");
    }
    if (windowOver) {
      record.sends = 0;
      record.window_started_at = new Date(now);
    }
  } else {
    record = new Otp({ channel, target, purpose, window_started_at: new Date(now), sends: 0 });
  }

  const code = otp.generateCode();
  record.channel = channel;
  record.code_hash = otp.hashCode(code, target);
  record.attempts = 0;
  record.sends += 1;
  record.last_sent_at = new Date(now);
  record.expires_at = new Date(now + otp.CODE_TTL_MIN * 60 * 1000);
  await record.save();

  try {
    if (channel === "email") await otp.sendEmail(target, code);
    else await otp.sendSms(target, code);
  } catch (error) {
    console.error("OTP send failed:", error.message);
    return fail(res, 502, error.message.startsWith("Couldn't") ? error.message : "Couldn't send the code right now. Please try again.");
  }

  return res.json({
    success: true,
    channel,
    message: `Code sent to ${otp.mask(channel, target)}`,
    expiresInSec: otp.CODE_TTL_MIN * 60,
    resendInSec: otp.RESEND_AFTER_SEC,
  });
}

// Checks a code; burns it after too many wrong tries. Returns null if OK, else an error message.
async function checkCode(target, code, purpose = "register") {
  const record = await Otp.findOne({ target, purpose });
  if (!record || record.expires_at.getTime() < Date.now()) return "This code has expired. Ask for a new one.";
  if (record.attempts >= otp.MAX_ATTEMPTS) return "Too many wrong tries. Ask for a new code.";
  if (!/^\d{6}$/.test(String(code || "")) || !otp.sameHash(otp.hashCode(String(code), target), record.code_hash)) {
    record.attempts += 1;
    await record.save();
    const left = otp.MAX_ATTEMPTS - record.attempts;
    return left > 0 ? `Wrong code. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries. Ask for a new code.";
  }
  await record.deleteOne(); // a code works only once
  return null;
}

// "name@x.com" -> email, anything else -> Indian mobile number
function parseIdentifier(raw) {
  const value = String(raw || "").trim();
  if (value.includes("@")) {
    const target = otp.normaliseEmail(value);
    return target ? { channel: "email", target } : { error: "Enter a valid email address." };
  }
  const target = otp.normalisePhone(value);
  return target ? { channel: "phone", target } : { error: "Enter a valid email or 10-digit mobile number." };
}

// ===============================
// Step 1 of sign-up: send a 6-digit code to email or mobile
// body: { channel: "email" | "phone", email, phone }
// ===============================
router.post(
  "/send-otp",
  otpLimit,
  asyncHandler(async (req, res) => {
    const channel = req.body.channel === "phone" ? "phone" : "email";
    const target = channel === "email" ? otp.normaliseEmail(req.body.email) : otp.normalisePhone(req.body.phone);
    if (!target) return fail(res, 400, channel === "email" ? "Enter a valid email address." : "Enter a valid 10-digit mobile number.");

    const taken = channel === "email" ? await User.exists({ email: target }) : await User.exists({ phone: target });
    if (taken) return fail(res, 409, `An account with this ${channel === "email" ? "email" : "mobile number"} already exists. Log in instead.`);

    return issueCode(res, { channel, target, purpose: "register" });
  }),
);

// ===============================
// Login with a code (no password)
// Step 1 body: { identifier: "email or mobile" }
// ===============================
router.post(
  "/login/send-otp",
  otpLimit,
  asyncHandler(async (req, res) => {
    const { channel, target, error } = parseIdentifier(req.body.identifier);
    if (error) return fail(res, 400, error);

    const user = await User.findOne(channel === "email" ? { email: target } : { phone: target });
    if (!user) {
      return fail(res, 404, `No account found with this ${channel === "email" ? "email" : "mobile number"}. Create an account first.`);
    }
    if (!user.is_active) return fail(res, 403, "Your account has been disabled.");

    return issueCode(res, { channel, target, purpose: "login" });
  }),
);

// Step 2 body: { identifier, otp }
router.post(
  "/login/verify-otp",
  loginLimit,
  asyncHandler(async (req, res) => {
    const { channel, target, error } = parseIdentifier(req.body.identifier);
    if (error) return fail(res, 400, error);

    const codeError = await checkCode(target, req.body.otp, "login");
    if (codeError) return fail(res, 400, codeError);

    const user = await User.findOne(channel === "email" ? { email: target } : { phone: target });
    if (!user) return fail(res, 404, "No account found. Create an account first.");
    if (!user.is_active) return fail(res, 403, "Your account has been disabled.");

    // The code proves they own this email / number
    if (channel === "email") user.is_verified = true;
    else user.phone_verified = true;
    user.last_login_at = new Date();
    await user.save();

    return session(res, user, { message: "Login successful" });
  }),
);

// ===============================
// Step 2 of sign-up: create the account (needs the code from step 1)
// body: { name, email, password, role, phone, companyName, city, verifyVia: "email" | "phone", otp }
// ===============================
router.post(
  "/register",
  registerLimit,
  asyncHandler(async (req, res) => {
    const name = str(req.body.name);
    const email = otp.normaliseEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const role = req.body.role === "supplier" ? "supplier" : "buyer";
    const rawPhone = str(req.body.phone);
    const phone = rawPhone ? otp.normalisePhone(rawPhone) : null;
    const companyName = str(req.body.companyName) || null;
    const city = str(req.body.city) || null;
    const verifyVia = req.body.verifyVia === "phone" ? "phone" : "email";

    if (!name) return fail(res, 400, "Enter your full name.");
    if (!email) return fail(res, 400, "Enter a valid email address.");
    if (rawPhone && !phone) return fail(res, 400, "Enter a valid 10-digit mobile number.");
    if (verifyVia === "phone" && !phone) return fail(res, 400, "Enter your mobile number to verify by SMS.");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return fail(res, 400, "Password must be at least 8 characters and include a letter and a number.");
    }
    if (role === "supplier" && !companyName) return fail(res, 400, "Enter your company name.");

    if (await User.exists({ email })) return fail(res, 409, "An account with this email already exists. Log in instead.");
    if (phone && (await User.exists({ phone }))) return fail(res, 409, "An account with this mobile number already exists. Log in instead.");

    const codeError = await checkCode(verifyVia === "phone" ? phone : email, req.body.otp);
    if (codeError) return fail(res, 400, codeError);

    const user = new User({
      name,
      email,
      password_hash: await bcrypt.hash(password, 12),
      role,
      phone,
      company_name: companyName,
      city,
      auth_provider: "local",
      is_verified: verifyVia === "email",
      phone_verified: verifyVia === "phone",
      last_login_at: new Date(),
    });
    if (role === "supplier") await ensureSupplierCompany(user);
    await user.save();

    return session(res, user, { message: "Account created" }, 201);
  }),
);

// ===============================
// Login
// ===============================
router.post(
  "/login",
  loginLimit,
  asyncHandler(async (req, res) => {
    const email = str(req.body.email).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (!email || !password) return fail(res, 400, "Email and password are required.");

    const user = await User.findOne({ email });
    if (!user || !user.password_hash) {
      return fail(res, 401, user ? "This account uses Google sign-in. Continue with Google." : "Invalid email or password.");
    }
    if (!user.is_active) return fail(res, 403, "Your account has been disabled.");
    if (!(await bcrypt.compare(password, user.password_hash))) return fail(res, 401, "Invalid email or password.");

    user.last_login_at = new Date();
    await user.save();
    return session(res, user, { message: "Login successful" });
  }),
);

// ===============================
// Google login / signup
// ===============================
router.post(
  "/google",
  loginLimit,
  asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (!credential) return fail(res, 400, "Google credential is required.");

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return fail(res, 401, "Google sign-in could not be verified.");
    }

    const { sub: googleId, email, name, email_verified: emailVerified } = payload || {};
    if (!email || !emailVerified) return fail(res, 401, "Google email could not be verified.");

    let user = (await User.findOne({ google_id: googleId })) || (await User.findOne({ email: email.toLowerCase() }));
    let created = false;

    if (user) {
      if (!user.is_active) return fail(res, 403, "Your account has been disabled.");
      user.google_id = googleId;
      user.is_verified = true;
      if (!user.password_hash) user.auth_provider = "google";
    } else {
      created = true;
      user = new User({
        name: name || email.split("@")[0],
        email: email.toLowerCase(),
        role: "user",
        google_id: googleId,
        auth_provider: "google",
        is_verified: true,
      });
    }
    user.last_login_at = new Date();
    await user.save();

    return session(res, user, { message: created ? "Account created" : "Login successful" }, created ? 201 : 200);
  }),
);

// ===============================
// Choose buyer / supplier (Google sign-ups)
// ===============================
router.post(
  "/select-role",
  authenticate,
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!["buyer", "supplier"].includes(role)) return fail(res, 400, "Choose buyer or supplier.");

    const user = req.user.doc;
    if (user.role !== "user") return fail(res, 403, "Your account type is already set.");

    user.role = role;
    if (role === "supplier") {
      user.company_name = str(req.body.companyName) || user.company_name;
      await ensureSupplierCompany(user);
    }
    await user.save();
    return session(res, user, { message: "Account type saved" });
  }),
);

// ===============================
// Current user
// ===============================
router.get("/me", authenticate, (req, res) => {
  res.json({ success: true, user: req.user.doc.toPublic() });
});

// ===============================
// Update my profile
// ===============================
router.patch(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user.doc;
    const name = str(req.body.name);
    const phone = str(req.body.phone);

    if (!name) return fail(res, 400, "Name is required.");
    if (name.length > 255 || phone.length > 50) return fail(res, 400, "Name or phone number is too long.");

    user.name = name;
    if (phone) {
      const normalised = otp.normalisePhone(phone);
      if (!normalised) return fail(res, 400, "Enter a valid 10-digit mobile number.");
      if (normalised !== user.phone) {
        if (await User.exists({ phone: normalised, _id: { $ne: user._id } })) return fail(res, 409, "This mobile number is used by another account.");
        user.phone = normalised;
        user.phone_verified = false; // a new number has to be verified again
      }
    } else {
      user.phone = null;
      user.phone_verified = false;
    }
    if (req.body.companyName !== undefined) user.company_name = str(req.body.companyName) || null;
    if (req.body.city !== undefined) user.city = str(req.body.city) || null;
    if (req.body.gstNumber !== undefined) user.gst_number = str(req.body.gstNumber) || null;
    await user.save();

    res.json({ success: true, message: "Profile saved", user: user.toPublic() });
  }),
);

// ===============================
// Change password
// ===============================
router.patch(
  "/password",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user.doc;
    const { currentPassword = "", newPassword = "" } = req.body;

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return fail(res, 400, "New password must be at least 8 characters and include a letter and a number.");
    }
    if (user.password_hash && !(await bcrypt.compare(currentPassword, user.password_hash))) {
      return fail(res, 400, "Current password is incorrect.");
    }

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password changed" });
  }),
);

module.exports = router;