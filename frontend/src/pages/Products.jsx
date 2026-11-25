import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, PackageSearch } from "lucide-react";
import { useApi } from "../lib/useApi";
import ProductCard from "../components/ProductCard";
import { EmptyState, ErrorState } from "../components/ui";
import { useSeo } from "../lib/seo";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const verified = params.get("verified") === "1";
  const sort = params.get("sort") || "new";
  const { data, loading, error, reload } = useApi("/api/products");
  useSeo({
    title: category
      ? `${category} products from suppliers in India`
      : "Products from verified suppliers in India",
    description: `Compare prices and minimum order quantities${category ? ` for ${category}` : ""} straight from manufacturers, wholesalers and dealers on Vyapaar Bharat. Ask for a quote free.`,
    path: "/products",
  });

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const all = useMemo(() => data?.products || [], [data]);
  const categories = useMemo(
    () => [...new Set(all.map((p) => p.category).filter(Boolean))].sort(),
    [all],
  );

  const products = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = all.filter((p) => {
      if (category && p.category !== category) return false;
      if (verified && !p.supplier_verified) return false;
      if (!term) return true;
      return [
        p.name,
        p.category,
        p.subcategory,
        p.description,
        p.supplier_name,
        p.supplier_location,
      ].some((v) => v && String(v).toLowerCase().includes(term));
    });
    if (sort === "price-asc")
      list = [...list].sort(
        (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
      );
    if (sort === "price-desc")
      list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    return list;
  }, [all, q, category, verified, sort]);

  return (
    <main className="container-page py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[34px] font-bold">Products</h1>
          <p className="mt-1 text-muted">
            Prices and minimum order quantities straight from suppliers.
          </p>
        </div>
        <label className="relative w-full lg:w-[380px]">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <input
            className="input pl-10"
            placeholder="Search products or suppliers"
            value={q}
            onChange={(e) => update("q", e.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-5">
        <button
          className="chip"
          aria-pressed={!category}
          onClick={() => update("category", "")}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className="chip"
            aria-pressed={category === c}
            onClick={() => update("category", category === c ? "" : c)}
          >
            {c}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-neel-900"
              checked={verified}
              onChange={(e) => update("verified", e.target.checked ? "1" : "")}
            />
            Verified suppliers only
          </label>
          <select
            className="input !h-9 !w-auto !text-[14px]"
            value={sort}
            onChange={(e) =>
              update("sort", e.target.value === "new" ? "" : e.target.value)
            }
            aria-label="Sort"
          >
            <option value="new">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      {!loading && !error && (
        <p className="num mt-5 text-[14px] text-muted">
          {products.length} products
        </p>
      )}

      <div className="mt-4">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="panel aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon={PackageSearch}
              title="No products match"
              action={
                <Link to="/post-requirement" className="btn btn-primary">
                  Post a requirement instead
                </Link>
              }
            >
              Try a shorter search, or tell suppliers exactly what you need and
              let them quote.
            </EmptyState>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
