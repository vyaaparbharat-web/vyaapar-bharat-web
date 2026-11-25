// Google Maps link for a company.
// Uses the exact link the company saved (map_url) if there is one,
// otherwise searches Google Maps for "address, city" (or "company name, city").
// Accepts company fields (name, address, location, map_url) or product fields (supplier_*).
export function mapsUrl(c = {}) {
  const mapUrl = c.map_url ?? c.supplier_map_url;
  if (mapUrl) return mapUrl;

  const name = c.name ?? c.supplier_name;
  const address = c.address ?? c.supplier_address;
  const location = c.location ?? c.supplier_location;
  if (!address && !location) return null;

  const query = address ? [address, location].filter(Boolean).join(", ") : [name, location].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const isMapsLink = (url) =>
  /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(url || "").trim());