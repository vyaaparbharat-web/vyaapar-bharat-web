const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function imageUploader(folder, prefix) {
  const dir = path.join(__dirname, "..", "uploads", folder);
  fs.mkdirSync(dir, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) =>
        cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) =>
      ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only JPG, PNG and WEBP images are allowed.")),
  });
}

module.exports = {
  productUpload: imageUploader("products", "product"),
  companyUpload: imageUploader("companies", "company"),
  insightUpload: imageUploader("insights", "insight"),
};
