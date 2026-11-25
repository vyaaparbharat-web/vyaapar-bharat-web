import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Inbox } from "lucide-react";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/AuthContext";
import RequirementRow from "../components/RequirementRow";
import { Badge, EmptyState, ErrorState, PageLoader } from "../components/ui";
import { useSeo } from "../lib/seo";

// Marketplace of buyer requirements (RFQs). Suppliers quote from here.
export default function Requirements() {
  const { isSupplier, isLoggedIn } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const scope = params.get("scope") || "active";

  const { data, loading, error, reload } = useApi(`/api/requirements?status=${scope === "all" ? "all" : "active"}`);
  const mine = useApi(isSupplier ? "/api/quotes/mine" : null);
  useSeo({
    title: category ? `${category} buyer requirements` : "Buyer requirements (RFQs) from across India",
    description: `Live buying requirements from businesses${category ? ` for ${category}` : ""}. See quantity, budget and delivery city, then call the buyer or send your quote.`,
    path: "/requirements",
  });
  const myQuoteFor = useMemo(() => Object.fromEntries((mine.data?.quotes || []).map((x) => [String(x.requirement_id), x])), [mine.data]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const all = useMemo(() => data?.requirements || [], [data]);
  const categories = useMemo(() => [...new Set(all.map((r) => r.category).filter(Boolean))].sort(), [all]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((r) => {
      if (category && r.category !== category) return false;
      if (!term) return true;
      return [r.title, r.category, r.subcategory, r.delivery_location, r.description].some((v) => v && String(v).toLowerCase().includes(term));
    });
  }, [all, q, category]);

  const actionFor = (r) => {
    if (!isSupplier || r.is_mine) return null;
    const quote = myQuoteFor[String(r.id)];
    if (quote) return <Badge tone="haldi">You quoted</Badge>;
    if (!["open", "quoted", "negotiating"].includes(r.status)) return null;
    return (
      <Link to={`/requirements/${r.id}#quote`} className="btn btn-primary btn-sm">
        Send quote
      </Link>
    );
  };

  return (
    <main className="container-page py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[34px] font-bold">Buyer requirements</h1>
          <p className="mt-1 max-w-2xl text-muted">
            {isSupplier
              ? "Buyers who need these items now. Send a quote with your price and delivery time."
              : "What businesses are looking to buy. Suppliers send quotes privately to the buyer."}
          </p>
        </div>
        {!isSupplier && (
          <Link to="/post-requirement" className="btn btn-primary">
            Post a requirement
          </Link>
        )}
      </div>

      <div className="mt-7 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="inline-flex rounded-[12px] bg-white p-1 ring-1 ring-line" role="tablist">
          {[
            ["active", "Accepting quotes"],
            ["all", "All"],
          ].map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={scope === value}
              onClick={() => update("scope", value === "active" ? "" : value)}
              className={`rounded-[9px] px-3.5 py-1.5 text-[14px] font-semibold ${scope === value ? "bg-neel-900 text-white" : "text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative flex-1">
          <span className="sr-only">Search requirements</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input className="input pl-10" placeholder="Search product, city or category" value={q} onChange={(e) => update("q", e.target.value)} />
        </label>
        <select className="input md:!w-60" value={category} onChange={(e) => update("category", e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="panel mt-5 overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <PageLoader />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={all.length ? "Nothing matches your search" : "No requirements yet"}
            action={!isSupplier && <Link to="/post-requirement" className="btn btn-primary">Post the first one</Link>}
          >
            {all.length ? "Try another word or category." : "New buyer requirements will show up here."}
          </EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {list.map((r) => (
              <RequirementRow key={r.id} requirement={r} action={actionFor(r)} />
            ))}
          </div>
        )}
      </div>

      {!isLoggedIn && (
        <p className="mt-6 text-center text-[14px] text-muted">
          Are you a supplier?{" "}
          <Link to="/login?mode=register&role=supplier" className="link">
            Create a supplier account
          </Link>{" "}
          to send quotes.
        </p>
      )}
    </main>
  );
}