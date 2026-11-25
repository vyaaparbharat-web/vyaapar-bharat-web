// Convert API records to form state
export const productToForm = (p = {}) => ({
  supplierId: p.supplier_id || "",
  name: p.name || "",
  category: p.category || "",
  subcategory: p.subcategory || "",
  description: p.description || "",
  price: p.price ?? "",
  priceUnit: p.price_unit || "",
  moq: p.moq ?? "",
  moqUnit: p.moq_unit || "",
  availability: p.availability || "Available",
  imageUrl: p.image_url || null,
});

export const companyToForm = (c = {}) => ({
  name: c.name || "",
  businessType: c.business_type || "",
  industry: c.industry || "",
  location: c.location || "",
  address: c.address || "",
  mapUrl: c.map_url || "",
  description: c.description || "",
  phone: c.phone || "",
  email: c.email || "",
  yearsInBusiness: c.years_in_business ?? "",
  verified: Boolean(c.verified),
  services: (c.services || []).join(", "),
  serviceAreas: (c.service_areas || []).join(", "),
  imageUrl: c.image_url || null,
  galleryImages: c.gallery_images || [],
});