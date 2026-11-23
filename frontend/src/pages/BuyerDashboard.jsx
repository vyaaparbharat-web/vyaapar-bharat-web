import { Link } from "react-router-dom";
import { FileText, Send } from "lucide-react";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/AuthContext";
import { ago, money, number } from "../lib/format";
import RequirementRow from "../components/RequirementRow";
import { EmptyState, ErrorState, PageLoader, Stat, StatusBadge } from "../components/ui";

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi("/api/dashboard/buyer");

  if (loading) return <PageLoader />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { stats, recentRequirements, recentQuotes } = data;
  const firstName = user?.name?.split(" ")[0];

  return (
    <>
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[30px] font-bold">Namaste, {firstName}</h1>
          <p className="mt-1 text-muted">
            {stats.pendingQuotes
              ? `You have ${stats.pendingQuotes} new ${stats.pendingQuotes === 1 ? "quote" : "quotes"} to review.`
              : "Here's where your requirements stand."}
          </p>
        </div>
        <Link to="/post-requirement" className="btn btn-primary">
          Post requirement
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active requirements" value={stats.activeRequirements} to="/my-requirements" />
        <Stat label="Quotes received" value={stats.quotesReceived} />
        <Stat label="New quotes" value={stats.pendingQuotes} />
        <Stat label="Deals done" value={stats.acceptedQuotes} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[18px] font-bold">Recent requirements</h2>
            <Link to="/my-requirements" className="link text-[14px]">
              View all
            </Link>
          </div>
          {recentRequirements.length === 0 ? (
            <EmptyState icon={FileText} title="No requirements yet" action={<Link to="/post-requirement" className="btn btn-primary">Post your first requirement</Link>}>
              Suppliers will quote on what you post.
            </EmptyState>
          ) : (
            <div className="divide-y divide-line">
              {recentRequirements.map((r) => (
                <RequirementRow key={r.id} requirement={r} />
              ))}
            </div>
          )}
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-[18px] font-bold">Latest quotes</h2>
          </div>
          {recentQuotes.length === 0 ? (
            <EmptyState icon={Send} title="No quotes yet">
              When suppliers quote on your requirements, they'll appear here.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {recentQuotes.map((q) => (
                <li key={q.id}>
                  <Link to={`/requirements/${q.requirement_id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-page">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{q.supplier_name}</div>
                      <div className="truncate text-[13px] text-muted">for {q.requirement_title}</div>
                      <div className="mt-1.5">
                        <StatusBadge kind="quote" status={q.status} label={q.status === "pending" ? "New" : undefined} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num font-bold">{money(q.quoted_price)}</div>
                      <div className="num text-[12.5px] text-muted">
                        {number(q.quantity)} {q.unit}
                      </div>
                      <div className="text-[12px] text-subtle">{ago(q.created_at)}</div>
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
