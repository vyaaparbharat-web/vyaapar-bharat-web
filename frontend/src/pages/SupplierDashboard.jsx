import { Link } from "react-router-dom";
import { Send, Search, AlertCircle } from "lucide-react";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/AuthContext";
import { ago, money } from "../lib/format";
import RequirementRow from "../components/RequirementRow";
import { Badge, EmptyState, ErrorState, PageLoader, Stat, StatusBadge } from "../components/ui";

export default function SupplierDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi("/api/dashboard/supplier");

  if (loading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { company, stats, recentQuotes, leads } = data;
  const profileIncomplete = company && (!company.industry || !company.location || !company.description);

  return (
    <>
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[30px] font-bold">{company?.name || user?.companyName || user?.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-muted">
            {company?.verified ? <Badge tone="ok">Verified supplier</Badge> : <Badge>Not verified yet</Badge>}
            {company && (
              <Link to={`/suppliers/${company.id}`} className="link text-[14px]">
                View public profile
              </Link>
            )}
          </div>
        </div>
        <Link to="/requirements" className="btn btn-primary">
          Find buyers
        </Link>
      </div>

      {profileIncomplete && (
        <div className="mb-5 flex flex-col gap-3 rounded-[14px] border border-[#f5cfa8] bg-warn-bg p-4 sm:flex-row sm:items-center">
          <AlertCircle className="h-5 w-5 shrink-0 text-warn" />
          <p className="flex-1 text-[14px] text-[#7a3600]">Add your industry, city and a short description so buyers can find you, and we can show you matching requirements.</p>
          <Link to="/supplier/profile" className="btn btn-dark btn-sm">
            Complete profile
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Quotes sent" value={stats.quotesSent} to="/my-quotes" />
        <Stat label="Waiting for buyer" value={stats.pendingQuotes} to="/my-quotes" />
        <Stat label="Orders won" value={stats.acceptedQuotes} to="/my-quotes" />
        <Stat label="Products listed" value={stats.products} to="/supplier/products" note={stats.newEnquiries ? `${stats.newEnquiries} new enquiries` : null} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="text-[18px] font-bold">Buyers you haven't quoted</h2>
              <p className="text-[13px] text-muted">{company?.industry ? `${company.industry} first, then the newest.` : "Newest first."}</p>
            </div>
            <Link to="/requirements" className="link text-[14px]">
              See all
            </Link>
          </div>
          {leads.length === 0 ? (
            <EmptyState icon={Search} title="You're all caught up">
              No new open requirements right now. Check back soon.
            </EmptyState>
          ) : (
            <div className="divide-y divide-line">
              {leads.map((r) => (
                <RequirementRow
                  key={r.id}
                  requirement={r}
                  showStatus={false}
                  action={
                    <Link to={`/requirements/${r.id}#quote`} className="btn btn-primary btn-sm">
                      Send quote
                    </Link>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[18px] font-bold">Your latest quotes</h2>
            <Link to="/my-quotes" className="link text-[14px]">
              View all
            </Link>
          </div>
          {recentQuotes.length === 0 ? (
            <EmptyState icon={Send} title="No quotes sent yet">
              Pick a buyer requirement and send your price.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {recentQuotes.map((q) => (
                <li key={q.id}>
                  <Link to={q.requirement_id ? `/requirements/${q.requirement_id}` : "/my-quotes"} className="flex items-start gap-3 px-5 py-4 hover:bg-page">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{q.requirement_title}</div>
                      <div className="text-[13px] text-muted">{ago(q.updated_at || q.created_at)}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="num font-bold">{money(q.quoted_price)}</span>
                      <StatusBadge kind="quote" status={q.status} label={q.status === "pending" ? "Waiting" : undefined} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
