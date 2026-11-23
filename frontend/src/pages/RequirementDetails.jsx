import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { MapPin, CalendarDays, Package, Wallet, Mail, Phone, Clock, Lock, Pencil, Trash2, Ban, RotateCcw } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ago, budget, date, money, number, ref } from "../lib/format";
import { UNITS } from "../lib/constants";
import { Avatar, Badge, Confirm, EmptyState, ErrorState, Fact, Field, FormError, PageLoader, Spinner, StatusBadge } from "../components/ui";

// ---------------------------------------------------------------
// Supplier: send / revise / withdraw a quote
// ---------------------------------------------------------------
function QuotePanel({ requirement, viewer, onChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const existing = viewer.myQuote;
  const [editing, setEditing] = useState(!existing);
  const [form, setForm] = useState(() => ({
    quotedPrice: existing?.quoted_price ?? "",
    quantity: existing?.quantity ?? requirement.quantity ?? "",
    unit: existing?.unit ?? requirement.unit ?? "",
    deliveryTime: existing?.delivery_time ?? "",
    message: existing?.message ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/quotes", { method: "POST", body: { ...form, requirementId: requirement.id } });
      toast(data.message);
      setEditing(false);
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await api(`/api/quotes/${existing.id}`, { method: "DELETE" });
      toast("Quote withdrawn");
      setConfirmWithdraw(false);
      setEditing(true);
      onChange();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (existing && !editing) {
    return (
      <div className="panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold">Your quote</h2>
          <StatusBadge kind="quote" status={existing.status} label={existing.status === "pending" ? "Waiting for buyer" : undefined} />
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4">
          <Fact label="Your price">
            <span className="num">{money(existing.quoted_price)}</span>
          </Fact>
          <Fact label="Quantity">
            <span className="num">
              {number(existing.quantity)} {existing.unit}
            </span>
          </Fact>
          <Fact label="Delivery">{existing.delivery_time}</Fact>
          <Fact label="Sent">{ago(existing.updated_at || existing.created_at)}</Fact>
        </dl>
        {existing.message && <p className="mt-4 rounded-[10px] bg-page p-3 text-[14px]">{existing.message}</p>}
        {existing.status === "accepted" ? (
          <p className="mt-5 rounded-[10px] bg-ok-bg p-3 text-[14px] font-medium text-ok">The buyer accepted your quote. Contact them to confirm the order.</p>
        ) : existing.status === "rejected" ? (
          <p className="mt-5 text-[14px] text-muted">The buyer declined this quote. You can send a revised offer while the requirement is open.</p>
        ) : null}
        {viewer.canQuote && existing.status !== "accepted" && (
          <div className="mt-5 flex gap-2">
            <button className="btn btn-dark flex-1" onClick={() => setEditing(true)}>
              Revise quote
            </button>
            <button className="btn btn-danger" onClick={() => setConfirmWithdraw(true)}>
              Withdraw
            </button>
          </div>
        )}
        <Confirm
          open={confirmWithdraw}
          title="Withdraw this quote?"
          confirmLabel="Withdraw quote"
          busy={busy}
          onConfirm={withdraw}
          onCancel={() => setConfirmWithdraw(false)}
        >
          The buyer will no longer see your offer.
        </Confirm>
      </div>
    );
  }

  return (
    <form id="quote" onSubmit={submit} className="panel scroll-mt-24 p-6">
      <h2 className="text-[20px] font-bold">{existing ? "Revise your quote" : "Send a quote"}</h2>
      <p className="mt-1 text-[14px] text-muted">
        Quoting as <span className="font-semibold text-ink">{user.companyName || user.name}</span>. Only this buyer will see it.
      </p>
      <div className="mt-5 grid gap-4">
        <Field label="Total price (₹)" htmlFor="quotedPrice" hint="For the full quantity, including your charges.">
          <input id="quotedPrice" name="quotedPrice" type="number" min="1" inputMode="numeric" className="input num" value={form.quotedPrice} onChange={set} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity" htmlFor="qty">
            <input id="qty" name="quantity" type="number" min="1" className="input num" value={form.quantity} onChange={set} required />
          </Field>
          <Field label="Unit" htmlFor="unit">
            <input id="unit" name="unit" list="units" className="input" value={form.unit} onChange={set} required />
            <datalist id="units">
              {UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label="Delivery time" htmlFor="deliveryTime" optional>
          <input id="deliveryTime" name="deliveryTime" className="input" placeholder="e.g. 7 days" value={form.deliveryTime} onChange={set} />
        </Field>
        <Field label="Message to buyer" htmlFor="message" optional>
          <textarea id="message" name="message" className="input" placeholder="Brand, quality, payment terms, GST…" value={form.message} onChange={set} />
        </Field>
        <FormError>{error}</FormError>
        <div className="flex gap-2">
          {existing && (
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
          <button className="btn btn-primary btn-lg flex-1" disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} {existing ? "Update quote" : "Send quote"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------
// Buyer (owner): compare and respond to quotes
// ---------------------------------------------------------------
function QuotesForOwner({ requirement, onChange }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(`/api/requirements/${requirement.id}/quotes`, [requirement.updated_at]);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const quotes = useMemo(() => [...(data?.quotes || [])].sort((a, b) => a.quoted_price - b.quoted_price), [data]);
  const lowest = quotes.filter((q) => q.status !== "rejected")[0]?.id;
  const locked = requirement.status === "accepted" || requirement.status === "closed";

  const respond = async (quote, status) => {
    setBusyId(quote.id);
    try {
      const res = await api(`/api/quotes/${quote.id}/status`, { method: "PATCH", body: { status } });
      toast(res.message);
      setConfirm(null);
      reload();
      onChange();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h2 className="text-[20px] font-bold">Quotes received</h2>
          <p className="text-[13.5px] text-muted">Sorted by price. Only you can see these.</p>
        </div>
        <span className="num font-display text-[24px] font-bold">{quotes.length}</span>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <PageLoader label="Loading quotes…" />
      ) : quotes.length === 0 ? (
        <EmptyState icon={Clock} title="No quotes yet">
          Suppliers in this category can see your requirement. You'll find their quotes here.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {quotes.map((q) => (
            <li key={q.id} className={`p-6 ${q.status === "accepted" ? "bg-ok-bg/50" : q.status === "rejected" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={q.supplier_name} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-sans text-[16px] font-semibold tracking-normal">
                      {q.supplier_company_id ? (
                        <Link to={`/suppliers/${q.supplier_company_id}`} className="hover:text-neel-700">
                          {q.supplier_name}
                        </Link>
                      ) : (
                        q.supplier_name
                      )}
                    </h3>
                    {q.id === lowest && q.status !== "accepted" && quotes.length > 1 && <Badge tone="haldi">Lowest price</Badge>}
                    <StatusBadge kind="quote" status={q.status} label={q.status === "pending" ? "New" : undefined} />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                    {q.supplier_email && (
                      <a href={`mailto:${q.supplier_email}`} className="inline-flex items-center gap-1 hover:text-ink">
                        <Mail className="h-3.5 w-3.5" /> {q.supplier_email}
                      </a>
                    )}
                    {q.supplier_phone && (
                      <a href={`tel:${q.supplier_phone}`} className="inline-flex items-center gap-1 hover:text-ink">
                        <Phone className="h-3.5 w-3.5" /> {q.supplier_phone}
                      </a>
                    )}
                    <span>{ago(q.updated_at || q.created_at)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="num font-display text-[24px] font-bold leading-none">{money(q.quoted_price)}</div>
                  <div className="num mt-1 text-[13px] text-muted">
                    {number(q.quantity)} {q.unit}
                    {q.delivery_time ? `, ${q.delivery_time}` : ""}
                  </div>
                </div>
              </div>
              {q.message && <p className="mt-4 rounded-[10px] bg-page px-4 py-3 text-[14px] sm:ml-[58px]">{q.message}</p>}

              {!locked && q.status !== "rejected" && (
                <div className="mt-4 flex flex-wrap gap-2 sm:ml-[58px]">
                  <button className="btn btn-ok btn-sm" disabled={busyId === q.id} onClick={() => setConfirm({ quote: q, status: "accepted" })}>
                    Accept quote
                  </button>
                  {q.status !== "negotiating" && (
                    <button className="btn btn-outline btn-sm" disabled={busyId === q.id} onClick={() => respond(q, "negotiating")}>
                      Mark as negotiating
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" disabled={busyId === q.id} onClick={() => setConfirm({ quote: q, status: "rejected" })}>
                    Decline
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Confirm
        open={Boolean(confirm)}
        title={confirm?.status === "accepted" ? `Accept ${confirm?.quote.supplier_name}'s quote?` : "Decline this quote?"}
        confirmLabel={confirm?.status === "accepted" ? "Accept quote" : "Decline quote"}
        tone={confirm?.status === "accepted" ? "dark" : "danger"}
        busy={Boolean(busyId)}
        onConfirm={() => respond(confirm.quote, confirm.status)}
        onCancel={() => setConfirm(null)}
      >
        {confirm?.status === "accepted"
          ? `${money(confirm.quote.quoted_price)} for ${number(confirm.quote.quantity)} ${confirm.quote.unit}. All other quotes on this requirement will be declined and it will stop accepting new quotes.`
          : "The supplier will see that you declined. They can still send a revised quote."}
      </Confirm>
    </section>
  );
}

// ---------------------------------------------------------------
// Owner tools: edit / close / reopen / delete
// ---------------------------------------------------------------
function OwnerTools({ requirement, onChange }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setStatus = async (status) => {
    setBusy(true);
    try {
      const res = await api(`/api/requirements/${requirement.id}/status`, { method: "PATCH", body: { status } });
      toast(res.message);
      onChange();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/requirements/${requirement.id}`, { method: "DELETE" });
      toast("Requirement deleted");
      navigate("/my-requirements", { replace: true });
    } catch (err) {
      toast(err.message, "error");
      setBusy(false);
    }
  };

  return (
    <div className="panel p-6">
      <h2 className="text-[18px] font-bold">Manage requirement</h2>
      <p className="mt-1 text-[14px] text-muted">Posted {ago(requirement.created_at)}. Only you can change it.</p>
      <div className="mt-4 grid gap-2">
        {requirement.status !== "accepted" && requirement.status !== "closed" && (
          <Link to={`/requirements/${requirement.id}/edit`} className="btn btn-outline justify-start">
            <Pencil className="h-4 w-4" /> Edit details
          </Link>
        )}
        {requirement.status === "closed" ? (
          <button className="btn btn-outline justify-start" disabled={busy} onClick={() => setStatus("open")}>
            <RotateCcw className="h-4 w-4" /> Reopen for quotes
          </button>
        ) : (
          requirement.status !== "accepted" && (
            <button className="btn btn-outline justify-start" disabled={busy} onClick={() => setStatus("closed")}>
              <Ban className="h-4 w-4" /> Stop accepting quotes
            </button>
          )
        )}
        <button className="btn btn-danger justify-start" disabled={busy} onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>
      <Confirm open={confirmDelete} title="Delete this requirement?" confirmLabel="Delete" busy={busy} onConfirm={remove} onCancel={() => setConfirmDelete(false)}>
        It will be removed along with all quotes on it. This can't be undone.
      </Confirm>
    </div>
  );
}

function VisitorPanel({ requirement }) {
  const { isLoggedIn, isSupplier, isBuyer } = useAuth();
  const location = useLocation();
  const open = ["open", "quoted", "negotiating"].includes(requirement.status);

  return (
    <div className="panel p-6">
      {!isLoggedIn ? (
        <>
          <Lock className="h-5 w-5 text-neel-700" />
          <h2 className="mt-3 text-[19px] font-bold">{open ? "Have this item? Send a quote." : "This requirement is closed"}</h2>
          <p className="mt-1 text-[14px] text-muted">Log in with a supplier account to quote. Quotes go only to this buyer.</p>
          <div className="mt-5 grid gap-2">
            <Link to="/login" state={{ from: location.pathname }} className="btn btn-dark">
              Log in to quote
            </Link>
            <Link to="/login?mode=register&role=supplier" state={{ from: location.pathname }} className="btn btn-outline">
              Create supplier account
            </Link>
          </div>
        </>
      ) : isSupplier ? (
        <>
          <h2 className="text-[19px] font-bold">Not accepting quotes</h2>
          <p className="mt-1 text-[14px] text-muted">The buyer has closed this requirement or already accepted a quote.</p>
          <Link to="/requirements" className="btn btn-outline mt-5 w-full">
            See open requirements
          </Link>
        </>
      ) : (
        <>
          <h2 className="text-[19px] font-bold">Need something similar?</h2>
          <p className="mt-1 text-[14px] text-muted">
            {isBuyer ? "Only suppliers can quote here. Post your own requirement and suppliers will quote you." : "Only suppliers can send quotes."}
          </p>
          <Link to="/post-requirement" className="btn btn-primary mt-5 w-full">
            Post a requirement
          </Link>
        </>
      )}
    </div>
  );
}

export default function RequirementDetails() {
  const { id } = useParams();
  const { hash } = useLocation();
  const { data, loading, error, reload } = useApi(`/api/requirements/${id}`);

  useEffect(() => {
    if (hash === "#quote" && data) setTimeout(() => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [hash, data]);

  if (loading) return <PageLoader />;
  if (error)
    return (
      <main className="container-page py-10">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} />
        <div className="text-center">
          <Link to="/requirements" className="link">
            Back to requirements
          </Link>
        </div>
      </main>
    );

  const r = data.requirement;
  const viewer = data.viewer || {};
  const showQuotePanel = viewer.canQuote || viewer.myQuote;

  return (
    <main className="container-page py-8 lg:py-10">
      <Link to={viewer.isOwner ? "/my-requirements" : "/requirements"} className="text-[14px] font-medium text-muted hover:text-ink">
        ← {viewer.isOwner ? "My requirements" : "All requirements"}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <StatusBadge status={r.status} />
        <span>{r.category}</span>
        {r.subcategory && <span>/ {r.subcategory}</span>}
        <span className="num">Ref {ref(r.id)}</span>
      </div>
      <h1 className="mt-2 max-w-4xl text-[30px] font-bold sm:text-[38px]">{r.title}</h1>
      <p className="mt-2 text-[14px] text-muted">
        Posted {ago(r.created_at)} by {viewer.isOwner ? "you" : r.buyer_name || "a buyer"}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-6">
          <section className="panel p-6">
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Fact label="Quantity">
                <span className="num inline-flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-subtle" /> {number(r.quantity)} {r.unit}
                </span>
              </Fact>
              <Fact label="Deliver to">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-subtle" /> {r.delivery_location}
                </span>
              </Fact>
              <Fact label="Budget">
                <span className="num inline-flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-subtle" /> {budget(r.min_budget, r.max_budget)}
                </span>
              </Fact>
              <Fact label="Needed by">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-subtle" /> {r.required_by ? date(r.required_by) : "Flexible"}
                </span>
              </Fact>
            </dl>
            <div className="divider my-6" />
            <h2 className="text-[17px] font-bold">Details from the buyer</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{r.description}</p>
          </section>

          {viewer.canManage && <QuotesForOwner requirement={r} onChange={reload} />}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[92px]">
          {viewer.canManage ? (
            <OwnerTools requirement={r} onChange={reload} />
          ) : showQuotePanel ? (
            <QuotePanel key={viewer.myQuote?.updated_at || "new"} requirement={r} viewer={viewer} onChange={reload} />
          ) : (
            <VisitorPanel requirement={r} />
          )}
          {!viewer.canManage && (
            <p className="px-1 text-[13px] text-muted">
              {r.quote_count ? `${r.quote_count} supplier${r.quote_count === 1 ? " has" : "s have"} quoted so far.` : "No quotes yet. Be the first."}
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
