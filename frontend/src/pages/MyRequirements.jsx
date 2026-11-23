import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useApi } from "../lib/useApi";
import RequirementRow from "../components/RequirementRow";
import { EmptyState, ErrorState, PageHeader, PageLoader } from "../components/ui";

const TABS = [
  { id: "active", label: "Active", match: (r) => ["open", "quoted", "negotiating"].includes(r.status) },
  { id: "accepted", label: "Deal done", match: (r) => r.status === "accepted" },
  { id: "closed", label: "Closed", match: (r) => r.status === "closed" },
  { id: "all", label: "All", match: () => true },
];

// Only the requirements posted by the logged-in buyer
export default function MyRequirements() {
  const { data, loading, error, reload } = useApi("/api/requirements/mine");
  const [tab, setTab] = useState("active");
  const all = useMemo(() => data?.requirements || [], [data]);
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.id, all.filter(t.match).length])), [all]);
  const list = all.filter(TABS.find((t) => t.id === tab).match);

  return (
    <>
      <PageHeader
        title="My requirements"
        description="Everything you've posted. Open one to compare quotes and accept the best offer."
        actions={
          <Link to="/post-requirement" className="btn btn-primary">
            Post requirement
          </Link>
        }
      />
      <div className="mb-4 flex gap-1 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className="chip" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label} <span className="num opacity-70">{counts[t.id] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="panel overflow-hidden">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <PageLoader />
        ) : list.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={all.length ? "Nothing here" : "You haven't posted anything yet"}
            action={!all.length && <Link to="/post-requirement" className="btn btn-primary">Post your first requirement</Link>}
          >
            {all.length ? "Requirements with this status will show up here." : "Tell suppliers what you need and they'll send you quotes."}
          </EmptyState>
        ) : (
          <div className="divide-y divide-line">
            {list.map((r) => (
              <RequirementRow key={r.id} requirement={{ ...r, is_mine: false }} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
