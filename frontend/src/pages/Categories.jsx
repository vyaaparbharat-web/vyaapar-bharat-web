import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useApi } from "../lib/useApi";
import CategoryTile from "../components/CategoryTile";
import { EmptyState, ErrorState } from "../components/ui";
import { useSeo } from "../lib/seo";

export default function Categories() {
  const { data, loading, error, reload } = useApi("/api/categories");
  const [q, setQ] = useState("");
  useSeo({
    title: "All trade categories",
    description:
      "Browse suppliers and products by trade: transport and logistics, tyres, automobile parts, electrical, hardware, textiles and hosiery, interior, machinery and more.",
    path: "/categories",
  });

  const all = useMemo(() => data?.categories || [], [data]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter((c) => [c.name, c.name_hi, c.description].some((v) => v && v.toLowerCase().includes(term)));
  }, [all, q]);

  return (
    <main className="container-page py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[34px] font-bold">Categories</h1>
          <p className="mt-1 text-muted">Pick a trade to see its products, suppliers and open buyer requirements.</p>
        </div>
        <label className="relative w-full lg:w-[340px]">
          <span className="sr-only">Search categories</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input className="input pl-10" placeholder="Search categories" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="mt-8">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-[14px] bg-line" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title={all.length ? "No category matches that search" : "No categories yet"}>
            {all.length ? "Try a shorter word, or browse all products." : "Categories added by the admin will show up here."}
          </EmptyState>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((c) => (
              <CategoryTile key={c.id} category={c} showCount />
            ))}
          </div>
        )}
      </div>

      <p className="mt-10 text-center text-[14px] text-muted">
        Can't find your trade?{" "}
        <Link to="/post-requirement" className="link">
          Post a requirement
        </Link>{" "}
        and choose "Other".
      </p>
    </main>
  );
}