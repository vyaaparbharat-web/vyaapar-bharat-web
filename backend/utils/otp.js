// Create, send and check one-time codes (email via SMTP, SMS via Fast2SMS).
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const CODE_TTL_MIN = 10; // code valid for 10 minutes
const RESEND_AFTER_SEC = 60; // wait before asking for a new code
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5; // wrong guesses before the code is burned

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

const hashCode = (code, target) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET || "dev").update(`${target}:${code}`).digest("hex");

const sameHash = (a, b) => {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// "98765 43210", "+91-9876543210", "09876543210" -> "+919876543210"; null if not a valid Indian mobile
function normalisePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  const ten = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(ten) ? `+91${ten}` : null;
}

const normaliseEmail = (raw) => {
  const e = String(raw || "").trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
};

const mask = (channel, target) =>
  channel === "email" ? target.replace(/^(.{2}).*(@.*)$/, "$1•••$2") : `${target.slice(0, 3)} •••••${target.slice(-3)}`;

// ---------- delivery ----------

let transporter = null;
function mailer() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendEmail(to, code) {
  const t = mailer();
  if (!t) {
    if (process.env.NODE_ENV === "production") throw new Error("Email sending is not set up on the server.");
    console.log(`[DEV] Email OTP for ${to}: ${code}  (set SMTP_USER / SMTP_PASS to send real email)`);
    return;
  }
  await t.sendMail({
    from: process.env.MAIL_FROM || `Vyapaar Bharat <${process.env.SMTP_USER}>`,
    to,
    subject: `${code} is your Vyapaar Bharat code`,
    text: `Your Vyapaar Bharat verification code is ${code}. It is valid for ${CODE_TTL_MIN} minutes. Don't share it with anyone.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:420px">
      <h2 style="color:#003297;margin:0 0 8px">Vyapaar Bharat</h2>
      <p>Your verification code is:</p>
      <p style="font-size:30px;font-weight:700;letter-spacing:6px;color:#001a5c;margin:8px 0">${code}</p>
      <p style="color:#586078">Valid for ${CODE_TTL_MIN} minutes. Don't share this code with anyone, our team will never ask for it.</p>
    </div>`,
  });
}

async function sendSms(to, code) {
  const key = process.env.FAST2SMS_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("SMS sending is not set up on the server.");
    console.log(`[DEV] SMS OTP for ${to}: ${code}  (set FAST2SMS_API_KEY to send real SMS)`);
    return;
  }
  // Fast2SMS OTP route: delivers "Your OTP: <code>" to a 10-digit Indian number
  const url = new URL("https://www.fast2sms.com/dev/bulkV2");
  url.search = new URLSearchParams({ authorization: key, route: "otp", variables_values: code, numbers: to.slice(-10) }).toString();
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.return !== true) {
    console.error("Fast2SMS error:", data);
    throw new Error("Couldn't send the SMS right now. Try email instead, or try again in a minute.");
  }
}

module.exports = {
  CODE_TTL_MIN,
  RESEND_AFTER_SEC,
  MAX_SENDS_PER_HOUR,
  MAX_ATTEMPTS,
  generateCode,
  hashCode,
  sameHash,
  normalisePhone,
  normaliseEmail,
  mask,
  sendEmail,
  sendSms,
};