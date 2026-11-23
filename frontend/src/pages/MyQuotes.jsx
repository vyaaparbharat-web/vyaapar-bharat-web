import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Send, MapPin } from "lucide-react";
import { useApi } from "../lib/useApi";
import { ago, money, number } from "../lib/format";
import { EmptyState, ErrorState, PageHeader, PageLoader, StatusBadge } from "../components/ui";

const TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Waiting" },
  { id: "negotiating", label: "Negotiating" },
  { id: "accepted", label: "Won" },
  { id: "rejected", label: "Declined" },
];

// Quotes sent by the logged-in supplier only
export default function MyQuotes() {
  const { data, loading, error, reload } = useApi("/api/quotes/mine");
  const [tab, setTab] = useState("all");
  const all = useMemo(() => data?.quotes || [], [data]);
  const list = tab === "all" ? all : all.filter((q) => q.status === tab);
  const count = (id) => (id === "all" ? all.length : all.filter((q) => q.status === id).length);

  return (
    <>
      <PageHeader
        title="My quotes"
        description="Every quote you've sent and what the buyer decided."
        actions={
          <Link to="/requirements" className="btn btn-primary">
            Find buyers
          </Link>
        }
      />
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} className="chip" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label} <span className="num opacity-70">{count(t.id)}</span>
          </button>
        ))}
      </div>
      <div className="panel overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <PageLoader />
        ) : list.length === 0 ? (
          <EmptyState icon={Send} title={all.length ? "No quotes with this status" : "You haven't sent any quotes"} action={!all.length && <Link to="/requirements" className="btn btn-primary">Browse requirements</Link>}>
            {all.length ? "Try another tab." : "Buyers are posting requirements every day."}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((q) => (
              <li key={q.id} className="relative flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-muted">
                    {q.requirement_category || "Requirement"} / sent {ago(q.created_at)}
                  </div>
                  <h3 className="mt-1 font-sans text-[16px] font-semibold tracking-normal">
                    {q.requirement_id ? (
                      <Link to={`/requirements/${q.requirement_id}`} className="after:absolute after:inset-0 hover:text-neel-700">
                        {q.requirement_title}
                      </Link>
                    ) : (
                      q.requirement_title
                    )}
                  </h3>
                  {q.requirement_delivery_location && (
                    <div className="mt-1 inline-flex items-center gap-1 text-[13px] text-muted">
                      <MapPin className="h-3.5 w-3.5" /> {q.requirement_delivery_location}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1.5">
                  <span className="num font-display text-[20px] font-bold">{money(q.quoted_price)}</span>
                  <span className="num text-[13px] text-muted">
                    {number(q.quantity)} {q.unit}
                    {q.delivery_time ? `, ${q.delivery_time}` : ""}
                  </span>
                  <StatusBadge kind="quote" status={q.status} label={q.status === "pending" ? "Waiting for buyer" : q.status === "accepted" ? "Won" : undefined} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
