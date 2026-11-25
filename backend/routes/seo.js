// SEO helpers served by the backend (Nginx sends these paths here):
//   /sitemap.xml   list of every public page, for Google
//   /suppliers/:id, /products/:id, /categories/:slug, /requirements/:id, /insights/:id
//                  the normal React page, but with the right title, description and share
//                  image already in the HTML (WhatsApp, Facebook and LinkedIn don't run JavaScript)
const router = require("express").Router();
const fs = require("fs");
const path = require("path");
const { Supplier, Product, Category, Requirement, Insight } = require("../models");
const { asyncHandler, isId } = require("../utils/helpers");

const SITE = (process.env.SITE_URL || "https://vyapaarbharat.net").replace(/\/+$/, "");
const SITE_NAME = "Vyapaar Bharat";
const INDEX_HTML = path.join(__dirname, "..", "..", "frontend", "dist", "index.html");

// ---------- helpers ----------

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const clip = (text, max = 158) => {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
};

const abs = (url) => (!url ? `${SITE}/og-image.jpg` : /^https?:\/\//.test(url) ? url : `${SITE}${url.startsWith("/") ? "" : "/"}${url}`);
const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

// index.html from the frontend build, re-read when a new build replaces it
let cache = { mtime: 0, html: null };
function indexHtml() {
  try {
    const { mtimeMs } = fs.statSync(INDEX_HTML);
    if (mtimeMs !== cache.mtime) cache = { mtime: mtimeMs, html: fs.readFileSync(INDEX_HTML, "utf8") };
    return cache.html;
  } catch {
    return null; // no build (local development): Vite serves the page instead
  }
}

// Swap the default tags in index.html for this page's own
function withMeta(html, { title, description, url, image, type = "website", jsonLd }) {
  const t = esc(`${title} | ${SITE_NAME}`);
  const d = esc(clip(description));
  const u = esc(url);
  const i = esc(abs(image));
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${t}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, (_, a, b) => a + d + b)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, (_, a, b) => a + u + b)
    .replace(/(<meta\s+property="og:type"\s+content=")[^"]*(")/, (_, a, b) => a + esc(type) + b)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, (_, a, b) => a + u + b)
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, (_, a, b) => a + t + b)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, (_, a, b) => a + d + b)
    .replace(/(<meta\s+property="og:image"\s+content=")[^"]*(")/, (_, a, b) => a + i + b)
    .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, (_, a, b) => a + t + b)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, (_, a, b) => a + d + b)
    .replace(/(<meta\s+name="twitter:image"\s+content=")[^"]*(")/, (_, a, b) => a + i + b);
  if (jsonLd) {
    // "<" escaped so text inside the data can't close the script tag
    const json = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
    out = out.replace("</head>", () => `<script type="application/ld+json" id="page-jsonld">${json}</script>\n</head>`);
  }
  return out;
}

function crumbs(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "/"], ...items].map(([name, p], idx) => ({ "@type": "ListItem", position: idx + 1, name, item: `${SITE}${p}` })),
  };
}

// Sends the page with its tags, or falls through (404 page / no build)
function page(load) {
  return asyncHandler(async (req, res, next) => {
    const html = indexHtml();
    if (!html) return next();
    const meta = await load(req.params);
    res.set("Cache-Control", "no-cache");
    // Unknown id: still send the app (it shows its own "not found" page) with the default tags
    res.type("html").send(meta ? withMeta(html, meta) : html);
  });
}

// ---------- detail pages ----------

router.get(
  "/suppliers/:id",
  page(async ({ id }) => {
    if (!isId(id)) return null;
    const s = await Supplier.findById(id).lean();
    if (!s) return null;
    const url = `${SITE}/suppliers/${id}`;
    return {
      title: [s.name, s.industry, s.location].filter(Boolean).join(", "),
      description:
        s.description ||
        `${s.name}${s.business_type ? `, ${s.business_type.toLowerCase()}` : ""}${s.industry ? ` in ${s.industry.toLowerCase()}` : ""}${s.location ? `, ${s.location}` : ""}. See products, address and phone number, or send an enquiry on Vyapaar Bharat.`,
      url,
      image: s.image_url || (s.gallery_images || [])[0],
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "LocalBusiness",
            "@id": url,
            name: s.name,
            url,
            description: s.description || undefined,
            image: s.image_url ? abs(s.image_url) : undefined,
            telephone: s.phone || undefined,
            email: s.email || undefined,
            hasMap: s.map_url || undefined,
            address: s.address || s.location ? { "@type": "PostalAddress", streetAddress: s.address || undefined, addressLocality: s.location || undefined, addressCountry: "IN" } : undefined,
          },
          crumbs([
            ["Suppliers", "/suppliers"],
            [s.name, `/suppliers/${id}`],
          ]),
        ],
      },
    };
  }),
);

router.get(
  "/products/:id",
  page(async ({ id }) => {
    if (!isId(id)) return null;
    const p = await Product.findById(id).populate("supplier_id", "name location").lean();
    if (!p) return null;
    const s = p.supplier_id || {};
    const url = `${SITE}/products/${id}`;
    return {
      title: [p.name, s.name && `from ${s.name}${s.location ? `, ${s.location}` : ""}`].filter(Boolean).join(" "),
      description:
        p.description ||
        `${p.name}${p.price ? ` at ₹${p.price}${p.price_unit ? ` per ${p.price_unit}` : ""}` : ""}${p.moq ? `, minimum order ${p.moq} ${p.moq_unit || ""}` : ""}. Sold by ${s.name || "a verified supplier"}${s.location ? ` in ${s.location}` : ""}. Request a quote free on Vyapaar Bharat.`,
      url,
      image: p.image_url,
      type: "product",
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            name: p.name,
            description: p.description || undefined,
            image: p.image_url ? [abs(p.image_url)] : undefined,
            category: p.category || undefined,
            brand: s.name ? { "@type": "Brand", name: s.name } : undefined,
            offers: p.price
              ? {
                  "@type": "Offer",
                  price: p.price,
                  priceCurrency: "INR",
                  availability: p.availability === "Out of Stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                  url,
                  seller: s.name ? { "@type": "Organization", name: s.name } : undefined,
                }
              : undefined,
          },
          crumbs([
            ["Products", "/products"],
            [p.name, `/products/${id}`],
          ]),
        ],
      },
    };
  }),
);

router.get(
  "/categories/:slug",
  page(async ({ slug }) => {
    const c = await Category.findOne({ slug: String(slug).toLowerCase(), is_active: true }).lean();
    if (!c) return null;
    return {
      title: `${c.name} suppliers and products in India`,
      description: c.description || `Find ${c.name.toLowerCase()} suppliers, manufacturers and dealers across India. Compare products and prices, or post your requirement free.`,
      url: `${SITE}/categories/${c.slug}`,
      image: c.image_url,
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          crumbs([
            ["Categories", "/categories"],
            [c.name, `/categories/${c.slug}`],
          ]),
        ],
      },
    };
  }),
);

router.get(
  "/requirements/:id",
  page(async ({ id }) => {
    if (!isId(id)) return null;
    const r = await Requirement.findById(id).lean();
    if (!r) return null;
    return {
      title: `${r.title}: buyer requirement${r.delivery_location ? ` in ${r.delivery_location}` : ""}`,
      description: `Buyer needs ${r.quantity} ${r.unit} of ${r.title}${r.delivery_location ? `, delivery to ${r.delivery_location}` : ""}. ${r.description || ""}`,
      url: `${SITE}/requirements/${id}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          crumbs([
            ["Buyer requirements", "/requirements"],
            [r.title, `/requirements/${id}`],
          ]),
        ],
      },
    };
  }),
);

router.get(
  "/insights/:id",
  page(async ({ id }) => {
    if (!isId(id)) return null;
    const a = await Insight.findById(id).lean();
    if (!a) return null;
    const url = `${SITE}/insights/${id}`;
    return {
      title: a.title,
      description: a.excerpt,
      url,
      image: a.image_url,
      type: "article",
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            headline: a.title,
            description: clip(a.excerpt),
            image: a.image_url ? [abs(a.image_url)] : undefined,
            datePublished: a.created_at,
            dateModified: a.updated_at || a.created_at,
            publisher: { "@id": `${SITE}/#org` },
            mainEntityOfPage: url,
          },
          crumbs([
            ["Insights", "/insights"],
            [a.title, `/insights/${id}`],
          ]),
        ],
      },
    };
  }),
);

// ---------- sitemap ----------

let sitemapCache = { at: 0, xml: "" };

router.get(
  "/sitemap.xml",
  asyncHandler(async (req, res) => {
    // Rebuilt at most once an hour
    if (Date.now() - sitemapCache.at > 60 * 60 * 1000) {
      const [categories, suppliers, products, requirements, insights] = await Promise.all([
        Category.find({ is_active: true }).select("slug updated_at").lean(),
        Supplier.find().select("updated_at").lean(),
        Product.find().select("updated_at").lean(),
        Requirement.find({ status: { $in: ["open", "quoted", "negotiating"] } }).sort({ created_at: -1 }).limit(2000).select("updated_at").lean(),
        Insight.find().select("updated_at").lean(),
      ]);

      const urls = [
        { loc: "/", priority: "1.0", changefreq: "daily" },
        { loc: "/categories", priority: "0.9", changefreq: "weekly" },
        { loc: "/suppliers", priority: "0.9", changefreq: "daily" },
        { loc: "/products", priority: "0.9", changefreq: "daily" },
        { loc: "/requirements", priority: "0.8", changefreq: "daily" },
        { loc: "/post-requirement", priority: "0.8", changefreq: "monthly" },
        { loc: "/insights", priority: "0.6", changefreq: "weekly" },
        { loc: "/pricing", priority: "0.5", changefreq: "monthly" },
        ...categories.map((c) => ({ loc: `/categories/${c.slug}`, lastmod: iso(c.updated_at), priority: "0.8", changefreq: "weekly" })),
        ...suppliers.map((s) => ({ loc: `/suppliers/${s._id}`, lastmod: iso(s.updated_at), priority: "0.8", changefreq: "weekly" })),
        ...products.map((p) => ({ loc: `/products/${p._id}`, lastmod: iso(p.updated_at), priority: "0.7", changefreq: "weekly" })),
        ...requirements.map((r) => ({ loc: `/requirements/${r._id}`, lastmod: iso(r.updated_at), priority: "0.6", changefreq: "daily" })),
        ...insights.map((a) => ({ loc: `/insights/${a._id}`, lastmod: iso(a.updated_at), priority: "0.5", changefreq: "monthly" })),
      ];

      const body = urls
        .map(
          (u) =>
            `  <url><loc>${esc(SITE + u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
        )
        .join("\n");
      sitemapCache = { at: Date.now(), xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n` };
    }
    res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(sitemapCache.xml);
  }),
);

module.exports = router;