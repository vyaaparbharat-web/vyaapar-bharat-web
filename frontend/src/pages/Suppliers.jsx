import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Building2 } from "lucide-react";
import { useApi } from "../lib/useApi";
import SupplierCard from "../components/SupplierCard";
import { EmptyState, ErrorState } from "../components/ui";

export default function Suppliers() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const industry = params.get("industry") || "";
  const location = params.get("location") || "";
  const verified = params.get("verified") === "1";
  const { data, loading, error, reload } = useApi("/api/suppliers");

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const all = useMemo(() => data?.suppliers || [], [data]);
  const industries = useMemo(() => [...new Set(all.map((s) => s.industry).filter(Boolean))].sort(), [all]);
  const locations = useMemo(() => [...new Set(all.map((s) => s.location).filter(Boolean))].sort(), [all]);

  const suppliers = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((s) => {
      if (industry && s.industry !== industry) return false;
      if (location && s.location !== location) return false;
      if (verified && !s.verified) return false;
      if (!term) return true;
      return [s.name, s.industry, s.business_type, s.location, s.description, ...(s.services || [])].some((v) => v && String(v).toLowerCase().includes(term));
    });
  }, [all, q, industry, location, verified]);

  return (
    <main className="container-page py-10">
      <h1 className="text-[34px] font-bold">Suppliers</h1>
      <p className="mt-1 text-muted">Manufacturers, wholesalers, transporters and service providers.</p>

      <div className="mt-6 grid gap-3 rounded-[16px] border border-line bg-white p-3 md:grid-cols-[1fr_220px_220px_auto] md:items-center">
        <label className="relative">
          <span className="sr-only">Search suppliers</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input className="input pl-10" placeholder="Company, service or product" value={q} onChange={(e) => update("q", e.target.value)} />
        </label>
        <select className="input" value={industry} onChange={(e) => update("industry", e.target.value)} aria-label="Industry">
          <option value="">All industries</option>
          {industries.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </select>
        <select className="input" value={location} onChange={(e) => update("location", e.target.value)} aria-label="Location">
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-2 text-[14px]">
          <input type="checkbox" className="h-4 w-4 accent-neel-900" checked={verified} onChange={(e) => update("verified", e.target.checked ? "1" : "")} />
          Verified only
        </label>
      </div>

      {!loading && !error && <p className="num mt-5 text-[14px] text-muted">{suppliers.length} suppliers</p>}

      <div className="mt-4">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="panel h-64 animate-pulse" />
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="panel">
            <EmptyState icon={Building2} title="No suppliers match these filters">
              Clear a filter or search for a broader term.
            </EmptyState>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s) => (
              <SupplierCard key={s.id} supplier={s} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
