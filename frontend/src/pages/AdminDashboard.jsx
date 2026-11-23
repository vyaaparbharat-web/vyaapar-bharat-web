import { Link } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { ago, money } from "../lib/format";
import { ErrorState, PageHeader, PageLoader, Stat, StatusBadge } from "../components/ui";

export default function AdminDashboard() {
  const stats = useApi("/api/admin/stats");
  const reqs = useApi("/api/admin/requirements");
  const quotes = useApi("/api/admin/quotes");

  if (stats.loading) return <PageLoader />;
  if (stats.error) return <ErrorState error={stats.error} onRetry={stats.reload} />;
  const s = stats.data.stats;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Activity across the marketplace."
        actions={
          <>
            <Link to="/admin/companies/add" className="btn btn-outline">
              Add company
            </Link>
            <Link to="/admin/products/add" className="btn btn-primary">
              Add product
            </Link>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active requirements" value={s.activeRequirements} note={`${s.requirements} total`} to="/admin/requirements" />
        <Stat label="Quotes" value={s.quotes} to="/admin/quotes" />
        <Stat label="Users" value={s.users} note={`${s.buyers} buyers, ${s.suppliers} suppliers`} to="/admin/users" />
        <Stat label="Companies" value={s.companies} note={`${s.products} products`} to="/admin/companies" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[18px] font-bold">Latest requirements</h2>
            <Link to="/admin/requirements" className="link text-[14px]">
              All
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {(reqs.data?.requirements || []).slice(0, 6).map((r) => (
              <li key={r.id}>
                <Link to={`/requirements/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-page">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{r.title}</div>
                    <div className="truncate text-[13px] text-muted">
                      {r.buyer_name} ({r.buyer_email}), {ago(r.created_at)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[18px] font-bold">Latest quotes</h2>
            <Link to="/admin/quotes" className="link text-[14px]">
              All
            </Link>
          </div>
          <ul className="divide-y divide-line">
            {(quotes.data?.quotes || []).slice(0, 6).map((q) => (
              <li key={q.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{q.supplier_name}</div>
                  <div className="truncate text-[13px] text-muted">for {q.requirement_title || "deleted requirement"}</div>
                </div>
                <div className="text-right">
                  <div className="num font-semibold">{money(q.quoted_price)}</div>
                  <StatusBadge kind="quote" status={q.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
