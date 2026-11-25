import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, Phone, Mail, Star } from "lucide-react";
import MapLink from "../components/MapLink";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/AuthContext";
import { money, number } from "../lib/format";
import { REQUIREMENT_CATEGORIES } from "../lib/constants";
import ProductCard from "../components/ProductCard";
import { Badge, ErrorState, Fact, Img, PageLoader } from "../components/ui";
import { breadcrumbs, SITE_URL, useSeo } from "../lib/seo";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSupplier, isLoggedIn } = useAuth();
  const { data, loading, error, reload } = useApi(`/api/products/${id}`);
  const product = data?.product;
  const more = useApi(product ? `/api/products?supplierId=${product.supplier_id}` : null);
  useSeo(
    product && {
      title: [product.name, product.supplier_location && `from ${product.supplier_name}, ${product.supplier_location}`].filter(Boolean).join(" "),
      description:
        product.description ||
        `${product.name}${product.price ? ` at ₹${product.price}${product.price_unit ? ` per ${product.price_unit}` : ""}` : ""}${product.moq ? `, minimum order ${product.moq} ${product.moq_unit || ""}` : ""}. Sold by ${product.supplier_name || "a verified supplier"}${product.supplier_location ? ` in ${product.supplier_location}` : ""}. Request a quote free on Vyapaar Bharat.`,
      path: `/products/${product.id}`,
      image: product.image_url,
      type: "product",
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Product",
            name: product.name,
            description: product.description || undefined,
            image: product.image_url ? [`${SITE_URL}${product.image_url}`] : undefined,
            category: product.category || undefined,
            brand: product.supplier_name ? { "@type": "Brand", name: product.supplier_name } : undefined,
            ...(product.price
              ? {
                  offers: {
                    "@type": "Offer",
                    price: product.price,
                    priceCurrency: "INR",
                    availability: product.availability === "Out of Stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                    url: `${SITE_URL}/products/${product.id}`,
                    seller: { "@type": "Organization", name: product.supplier_name },
                  },
                }
              : {}),
          },
          breadcrumbs([
            ["Products", "/products"],
            [product.name, `/products/${product.id}`],
          ]),
        ],
      },
    },
  );

  if (loading) return <PageLoader />;
  if (error)
    return (
      <main className="container-page py-10">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} />
      </main>
    );

  const p = product;
  const price = money(p.price);
  const related = (more.data?.products || []).filter((x) => x.id !== p.id).slice(0, 4);

  // "Request a quote" = a requirement linked to this product, pre-filled
  const requestQuote = () => {
    const prefill = {
      title: p.name,
      category: REQUIREMENT_CATEGORIES.includes(p.category) ? p.category : "",
      subcategory: p.subcategory || "",
      quantity: p.moq || "",
      unit: p.moq_unit || p.price_unit || "",
      description: `Looking for: ${p.name}${p.supplier_name ? ` (seen from ${p.supplier_name})` : ""}.\n`,
    };
    // kept in sessionStorage too, so it survives the login redirect
    sessionStorage.setItem("vb_prefill", JSON.stringify({ prefill, productId: p.id }));
    navigate("/post-requirement", { state: { prefill, productId: p.id } });
  };

  return (
    <main className="container-page py-8 lg:py-10">
      <nav className="text-[14px] text-muted" aria-label="Breadcrumb">
        <Link to="/products" className="hover:text-ink">
          Products
        </Link>
        {p.category && (
          <>
            {" / "}
            <Link to={`/products?category=${encodeURIComponent(p.category)}`} className="hover:text-ink">
              {p.category}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <Img src={p.image_url} alt={p.name} fallbackLabel={p.name} className="aspect-[4/3] w-full rounded-[18px] border border-line" />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={p.availability === "Out of Stock" ? "bad" : p.availability === "Available" ? "ok" : "warn"}>{p.availability}</Badge>
            {p.subcategory && <span className="text-[13.5px] text-muted">{p.subcategory}</span>}
          </div>
          <h1 className="mt-3 text-[30px] font-bold sm:text-[36px]">{p.name}</h1>

          <div className="mt-5 rounded-[14px] bg-white p-5 ring-1 ring-line">
            {price ? (
              <div className="num font-display text-[34px] font-bold leading-none">
                {price}
                {p.price_unit && <span className="font-sans text-[16px] font-medium text-muted"> / {p.price_unit}</span>}
              </div>
            ) : (
              <div className="font-display text-[24px] font-bold">Price on request</div>
            )}
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <Fact label="Minimum order">{p.moq ? `${number(p.moq)} ${p.moq_unit || ""}` : "No minimum"}</Fact>
              <Fact label="Ships from">{p.supplier_location ? <MapLink company={p} iconClassName="h-4 w-4" /> : null}</Fact>
            </dl>
            {!isSupplier && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button className="btn btn-primary btn-lg" onClick={requestQuote}>
                  Request a quote
                </button>
                <Link to={`/suppliers/${p.supplier_id}#contact`} className="btn btn-outline btn-lg">
                  Contact supplier
                </Link>
              </div>
            )}
            {!isLoggedIn && <p className="mt-3 text-[13px] text-muted">You'll be asked to log in. Posting a requirement is free.</p>}
          </div>

          {p.description && (
            <section className="mt-6">
              <h2 className="text-[18px] font-bold">About this product</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/90">{p.description}</p>
            </section>
          )}

          <section className="panel mt-6 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] text-muted">Sold by</div>
                <Link to={`/suppliers/${p.supplier_id}`} className="mt-0.5 flex items-center gap-1.5 font-display text-[19px] font-bold hover:text-neel-700">
                  {p.supplier_name}
                  {p.supplier_verified && <BadgeCheck className="h-5 w-5 text-ok" aria-label="Verified" />}
                </Link>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-muted">
                  <MapLink company={p} />
                  {p.supplier_rating ? (
                    <span className="num inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-haldi-500 text-haldi-500" /> {Number(p.supplier_rating).toFixed(1)}
                      {p.supplier_reviews ? ` (${p.supplier_reviews})` : ""}
                    </span>
                  ) : null}
                  {p.supplier_years ? <span className="num">{p.supplier_years} years in business</span> : null}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.supplier_phone && (
                <a href={`tel:${p.supplier_phone}`} className="btn btn-outline btn-sm">
                  <Phone className="h-4 w-4" /> {p.supplier_phone}
                </a>
              )}
              {p.supplier_email && (
                <a href={`mailto:${p.supplier_email}`} className="btn btn-outline btn-sm">
                  <Mail className="h-4 w-4" /> Email
                </a>
              )}
            </div>
          </section>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[24px] font-bold">More from {p.supplier_name}</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {related.map((x) => (
              <ProductCard key={x.id} product={x} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}