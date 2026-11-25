import { useEffect } from "react";
import { assetUrl } from "./api";

export const SITE_URL = "https://vyapaarbharat.net";
export const SITE_NAME = "Vyapaar Bharat";

// The tags index.html starts with, so a page can put them back when it closes
const DEFAULTS = typeof document === "undefined" ? {} : {
  title: document.title,
  description: document.querySelector('meta[name="description"]')?.content || "",
  image: `${SITE_URL}/og-image.jpg`,
};

// Plain text, one line, cut at a word boundary (Google shows about 155 characters)
export function clip(text, max = 158) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

const absolute = (url) => {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const u = assetUrl(url) || url;
  return /^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
};

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data) {
  let el = document.getElementById("page-jsonld");
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "page-jsonld";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function apply({ title, description, path, image, type = "website", noindex = false, jsonLd = null }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULTS.title;
  const desc = clip(description || DEFAULTS.description);
  const url = `${SITE_URL}${path ?? window.location.pathname}`;
  const img = absolute(image) || DEFAULTS.image;

  document.title = fullTitle;
  setMeta("name", "description", desc);
  setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
  setCanonical(url);
  setMeta("property", "og:type", type);
  setMeta("property", "og:url", url);
  setMeta("property", "og:title", fullTitle);
  setMeta("property", "og:description", desc);
  setMeta("property", "og:image", img);
  setMeta("name", "twitter:title", fullTitle);
  setMeta("name", "twitter:description", desc);
  setMeta("name", "twitter:image", img);
  setJsonLd(jsonLd);
}

/**
 * Sets the page title, description, canonical URL, share preview and structured data.
 *   useSeo({ title: "Tyres", description: "...", path: "/categories/tyres", image, jsonLd })
 * Pass null while the page is still loading; it keeps the current tags until data arrives.
 */
export function useSeo(seo) {
  const key = seo ? JSON.stringify(seo) : null;
  useEffect(() => {
    if (!key) return undefined;
    apply(JSON.parse(key));
    return () => apply({ path: window.location.pathname }); // back to the defaults when the page closes
  }, [key]);
}

// Breadcrumb trail for Google: [["Categories", "/categories"], ["Tyres", "/categories/tyres"]]
export const breadcrumbs = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: [["Home", "/"], ...items].map(([name, path], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: `${SITE_URL}${path}`,
  })),
});