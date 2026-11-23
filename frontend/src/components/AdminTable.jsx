import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState, ErrorState, PageLoader } from "./ui";

// columns: [{ key, label, render?(row), className?, search?(row) }]
// filters: [{ key, label, options: [{value,label}], match(row, value) }]
export default function AdminTable({ rows = [], columns, loading, error, onRetry, searchKeys = [], filters = [], empty = "Nothing here yet.", placeholder = "Search" }) {
  const [q, setQ] = useState("");
  const [filterValues, setFilterValues] = useState({});

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((row) => {
      for (const f of filters) {
        const v = filterValues[f.key];
        if (v && !f.match(row, v)) return false;
      }
      if (!term) return true;
      return searchKeys.some((k) => {
        const v = typeof k === "function" ? k(row) : row[k];
        return v && String(v).toLowerCase().includes(term);
      });
    });
  }, [rows, q, filters, filterValues, searchKeys]);

  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">{placeholder}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input className="input !h-10 pl-9" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {filters.map((f) => (
          <select
            key={f.key}
            className="input !h-10 sm:!w-48"
            aria-label={f.label}
            value={filterValues[f.key] || ""}
            onChange={(e) => setFilterValues((s) => ({ ...s, [f.key]: e.target.value }))}
          >
            <option value="">{f.label}: all</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {!loading && !error && <span className="num px-2 text-[13px] text-muted">{visible.length} shown</span>}
      </div>
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <PageLoader />
      ) : visible.length === 0 ? (
        <EmptyState title={rows.length ? "No matches" : empty} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="bg-page text-[12.5px] text-muted">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={`px-4 py-2.5 font-semibold ${c.className || ""}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => (
                <tr key={row.id} className="align-top hover:bg-page/60">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 ${c.className || ""}`}>
                      {c.render ? c.render(row) : row[c.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
