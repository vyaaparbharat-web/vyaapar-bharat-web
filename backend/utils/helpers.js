const mongoose = require("mongoose");

const isId = (value) => mongoose.isValidObjectId(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

const toNumber = (value) => (value === "" || value === null || value === undefined || Number.isNaN(Number(value)) ? null : Number(value));

const toList = (value) =>
  Array.isArray(value)
    ? value.map((v) => String(v).trim()).filter(Boolean)
    : typeof value === "string"
      ? value.split(",").map((v) => v.trim()).filter(Boolean)
      : [];

const str = (value) => (typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim());

// lean() results -> same shape as toJSON()
const plain = (obj) => {
  if (!obj) return obj;
  const { _id, __v, password_hash, ...rest } = obj;
  for (const k of Object.keys(rest)) {
    if (rest[k] instanceof mongoose.Types.ObjectId) rest[k] = String(rest[k]);
  }
  return { id: String(_id), ...rest };
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const fail = (res, status, message) => res.status(status).json({ success: false, message });

module.exports = { isId, toNumber, toList, str, plain, escapeRegex, asyncHandler, fail };
