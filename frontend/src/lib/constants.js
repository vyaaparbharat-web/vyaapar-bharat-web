export const REQUIREMENT_CATEGORIES = [
  "Automobile & Parts",
  "Transport & Logistics",
  "Tyres",
  "Electrical",
  "Electronics & Components",
  "Hardware & Fittings",
  "Machinery & Tools",
  "Industrial Supplies",
  "Construction & Building",
  "Chemicals & Raw Materials",
  "Textiles & Hosiery",
  "Packaging & Printing",
  "Agriculture & Food",
  "Health & Medical",
  "Interior & Furniture",
  "Renewable Energy",
  "Other",
];

export const UNITS = ["Pieces", "Kg", "Ton", "Meter", "Litre", "Box", "Set", "Bag", "Roll", "Truck load", "Unit", "Other"];

export const BUSINESS_TYPES = ["Manufacturer", "Wholesaler", "Distributor", "Retailer", "Exporter", "Service Provider", "Transporter"];

export const AVAILABILITY = ["Available", "Limited Stock", "Made to order", "Out of Stock"];

export const INSIGHT_CATEGORIES = [
  { name: "Market Insights", id: "market-insights" },
  { name: "Industry Trends", id: "industry-trends" },
  { name: "Sourcing Guides", id: "sourcing-guides" },
  { name: "Business Tips", id: "business-tips" },
  { name: "Trade & Export", id: "trade-export" },
  { name: "Manufacturing", id: "manufacturing" },
];

export const REQUIREMENT_STATUS = {
  open: { label: "Open", tone: "neel" },
  quoted: { label: "Quotes received", tone: "neel" },
  negotiating: { label: "Negotiating", tone: "warn" },
  accepted: { label: "Deal done", tone: "ok" },
  closed: { label: "Closed", tone: "muted" },
};

export const QUOTE_STATUS = {
  pending: { label: "Pending", tone: "neel" },
  negotiating: { label: "Negotiating", tone: "warn" },
  accepted: { label: "Accepted", tone: "ok" },
  rejected: { label: "Declined", tone: "bad" },
};
