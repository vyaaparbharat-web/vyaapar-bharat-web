require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const connectDB = require("./config/db");

if (!process.env.JWT_SECRET) {
  console.error(
    "JWT_SECRET is missing. Add it to backend/.env (see .env.example).",
  );
  process.exit(1);
}

const app = express();

// Behind Nginx / a load balancer, so req.ip is the real visitor IP (used by the rate limiter)
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) =>
  res.json({ message: "Vyapaar Bharat API is running" }),
);

// ---------- Routes ----------
const requirementRoutes = require("./routes/requirements");
const quoteRoutes = require("./routes/quotes");

app.use("/api/auth", require("./routes/auth"));
app.use("/api/requirements", requirementRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api", require("./routes/catalog"));
app.use("/api", require("./routes/categories"));
app.use("/api", require("./routes/banners"));
// SEO: /sitemap.xml and supplier/product/category pages with their own title + share preview
app.use(require("./routes/seo"));
app.use("/api", require("./routes/misc"));

// Old URLs kept working
app.get(
  "/api/my-requirements",
  (req, res, next) => ((req.url = "/mine"), requirementRoutes(req, res, next)),
);
app.get(
  "/api/my-quotes",
  (req, res, next) => ((req.url = "/mine"), quoteRoutes(req, res, next)),
);

// ---------- 404 + errors ----------
app.use("/api", (req, res) =>
  res
    .status(404)
    .json({
      success: false,
      message: `No API route for ${req.method} ${req.originalUrl}`,
    }),
);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    /images are allowed/.test(err.message)
  ) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Each image must be under 5 MB."
        : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
    });
  }
  if (err.code === 11000) {
    return res
      .status(409)
      .json({ success: false, message: "This record already exists." });
  }
  console.error(err);
  res
    .status(500)
    .json({ success: false, message: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`),
    ),
  )
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
