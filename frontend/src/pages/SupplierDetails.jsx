import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  BadgeCheck,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle2,
} from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { mapsUrl } from "../lib/maps";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ProductCard from "../components/ProductCard";
import MapLink from "../components/MapLink";
import {
  ErrorState,
  Fact,
  Field,
  FormError,
  Img,
  PageLoader,
  Spinner,
} from "../components/ui";

function EnquiryForm({ supplier, products }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    productId: "",
    quantity: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const set = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/api/enquiries", {
        method: "POST",
        body: { ...form, supplierId: supplier.id },
      });
      setSent(true);
      toast("Enquiry sent");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="panel p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-ok" />
        <h3 className="mt-3 text-[18px] font-bold">
          Enquiry sent to {supplier.name}
        </h3>
        <p className="mt-1 text-[14px] text-muted">
          They'll reply on the email or phone you gave.
        </p>
      </div>
    );
  }

  return (
    <form id="contact" onSubmit={submit} className="panel scroll-mt-24 p-6">
      <h2 className="text-[19px] font-bold">Send an enquiry</h2>
      <p className="mt-1 text-[13.5px] text-muted">
        Goes straight to {supplier.name}.
      </p>
      <div className="mt-5 grid gap-4">
        <Field label="Your name" htmlFor="en-name">
          <input
            id="en-name"
            name="name"
            className="input"
            value={form.name}
            onChange={set}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" htmlFor="en-phone">
            <input
              id="en-phone"
              name="phone"
              type="tel"
              className="input"
              value={form.phone}
              onChange={set}
            />
          </Field>
          <Field label="Email" htmlFor="en-email">
            <input
              id="en-email"
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={set}
            />
          </Field>
        </div>
        {products.length > 0 && (
          <div className="grid grid-cols-[1fr_110px] gap-3">
            <Field label="Product" htmlFor="en-product" optional>
              <select
                id="en-product"
                name="productId"
                className="input"
                value={form.productId}
                onChange={set}
              >
                <option value="">General enquiry</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity" htmlFor="en-qty" optional>
              <input
                id="en-qty"
                name="quantity"
                className="input"
                value={form.quantity}
                onChange={set}
              />
            </Field>
          </div>
        )}
        <Field label="Message" htmlFor="en-msg">
          <textarea
            id="en-msg"
            name="message"
            className="input"
            value={form.message}
            onChange={set}
            placeholder="What do you need, and by when?"
            required
          />
        </Field>
        <FormError>{error}</FormError>
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} Send enquiry
        </button>
      </div>
    </form>
  );
}

export default function SupplierDetails() {
  const { id } = useParams();
  const { hash } = useLocation();
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(`/api/suppliers/${id}`);
  const productsQuery = useApi(`/api/products?supplierId=${id}`);
  const products = productsQuery.data?.products || [];

  useEffect(() => {
    if (hash === "#contact" && data)
      setTimeout(
        () =>
          document
            .getElementById("contact")
            ?.scrollIntoView({ behavior: "smooth" }),
        50,
      );
  }, [hash, data]);

  if (loading) return <PageLoader />;
  if (error)
    return (
      <main className="container-page py-10">
        <ErrorState
          error={error}
          onRetry={error.status === 404 ? null : reload}
        />
      </main>
    );

  const s = data.supplier;
  const isOwner = user?.supplierId === s.id;
  // Logo is shown next to the name; the big photo area is only for gallery photos
  const gallery = (s.gallery_images || []).filter(Boolean);
  // Google Maps: the saved link, or a search for the address / city
  const mapLink = mapsUrl(s);

  return (
    <main>
      <section className="border-b border-line bg-white">
        <div className="container-page py-8">
          <Link
            to="/suppliers"
            className="text-[14px] font-medium text-muted hover:text-ink"
          >
            ← All suppliers
          </Link>
          <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-5">
              {s.image_url && (
                <Img
                  src={s.image_url}
                  alt={`${s.name} logo`}
                  fit="contain"
                  className="h-20 w-20 shrink-0 rounded-[16px] border border-line sm:h-24 sm:w-24"
                />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
                  {[s.business_type, s.industry].filter(Boolean).join(", ")}
                </div>
                <h1 className="mt-1 flex flex-wrap items-center gap-3 text-[32px] font-bold sm:text-[40px]">
                  {s.name}
                  {s.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ok-bg px-3 py-1 font-sans text-[13px] font-semibold tracking-normal text-ok">
                      <BadgeCheck className="h-4 w-4" /> Verified
                    </span>
                  )}
                </h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                  <MapLink
                    company={s}
                    iconClassName="h-4 w-4"
                    className="gap-1.5"
                  />
                  {s.rating ? (
                    <span className="num inline-flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-haldi-500 text-haldi-500" />{" "}
                      {Number(s.rating).toFixed(1)}
                      {s.reviews ? ` from ${s.reviews} reviews` : ""}
                    </span>
                  ) : null}
                  {s.years_in_business ? (
                    <span className="num">
                      {s.years_in_business} years in business
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isOwner ? (
                <Link to="/supplier/profile" className="btn btn-dark">
                  Edit your profile
                </Link>
              ) : (
                <a href="#contact" className="btn btn-primary">
                  Send enquiry
                </a>
              )}
              {s.phone && (
                <a href={`tel:${s.phone}`} className="btn btn-outline">
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <MapPin className="h-4 w-4" /> Directions
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="min-w-0 space-y-10">
          {gallery.length > 0 && (
            <div
              className={`grid gap-3 ${gallery.length > 1 ? "sm:h-[380px] sm:grid-cols-[2fr_1fr]" : ""}`}
            >
              <Img
                src={gallery[0]}
                alt={s.name}
                fit="contain"
                className={`aspect-[16/9] w-full rounded-[16px] border border-line ${gallery.length > 1 ? "sm:aspect-auto sm:h-full" : ""}`}
              />
              {gallery.length > 1 && (
                <div className="grid grid-cols-3 gap-3 sm:h-full sm:min-h-0 sm:grid-cols-1 sm:grid-rows-2">
                  {gallery.slice(1, 3).map((g) => (
                    <Img
                      key={g}
                      src={g}
                      alt=""
                      fit="contain"
                      className="aspect-[4/3] w-full rounded-[16px] border border-line sm:aspect-auto sm:h-full sm:min-h-0"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {s.description && (
            <section>
              <h2 className="text-[22px] font-bold">About</h2>
              <p className="mt-3 max-w-[70ch] whitespace-pre-line leading-relaxed">
                {s.description}
              </p>
            </section>
          )}

          {(s.services?.length > 0 || s.service_areas?.length > 0) && (
            <section className="grid gap-8 sm:grid-cols-2">
              {s.services?.length > 0 && (
                <div>
                  <h2 className="text-[18px] font-bold">Services</h2>
                  <ul className="mt-3 space-y-2">
                    {s.services.map((x) => (
                      <li key={x} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" />{" "}
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {s.service_areas?.length > 0 && (
                <div>
                  <h2 className="text-[18px] font-bold">Delivers to</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.service_areas.map((x) => (
                      <span
                        key={x}
                        className="rounded-full bg-white px-3 py-1 text-[13.5px] ring-1 ring-line"
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-[22px] font-bold">Products</h2>
            {products.length === 0 ? (
              <p className="mt-2 text-muted">
                {productsQuery.loading
                  ? "Loading…"
                  : "No products listed yet. Send an enquiry to ask what they offer."}
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[92px]">
          <div className="panel p-5">
            <dl className="grid gap-4">
              {(s.address || s.location) && (
                <Fact label="Address">
                  {[s.address, s.location].filter(Boolean).join(", ")}
                  {mapLink && (
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link mt-1.5 flex items-center gap-1.5 text-[14px]"
                    >
                      <MapPin className="h-4 w-4" /> Open in Google Maps
                    </a>
                  )}
                </Fact>
              )}
              {s.phone && (
                <Fact label="Phone">
                  <a
                    href={`tel:${s.phone}`}
                    className="inline-flex items-center gap-1.5 hover:text-neel-700"
                  >
                    <Phone className="h-4 w-4 text-subtle" /> {s.phone}
                  </a>
                </Fact>
              )}
              {s.email && (
                <Fact label="Email">
                  <a
                    href={`mailto:${s.email}`}
                    className="inline-flex items-center gap-1.5 break-all hover:text-neel-700"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-subtle" /> {s.email}
                  </a>
                </Fact>
              )}
            </dl>
          </div>
          {!isOwner && <EnquiryForm supplier={s} products={products} />}
        </aside>
      </div>
    </main>
  );
}
