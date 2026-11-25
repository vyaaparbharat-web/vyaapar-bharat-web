import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, PackageSearch, Search } from "lucide-react";
import { useApi } from "../lib/useApi";
import { categoryImage } from "../lib/categories";
import ProductCard from "../components/ProductCard";
import { EmptyState, ErrorState, PageLoader } from "../components/ui";

export default function CategoryDetails() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useApi(`/api/categories/${slug}`);
  const category = data?.category;
  const products = useApi(category ? `/api/products?category=${encodeURIComponent(category.name)}` : null);
  const [q, setQ] = useState("");

  const all = useMemo(() => products.data?.products || [], [products.data]);
  const supplierCount = useMemo(() => new Set(all.map((p) => p.supplier_id)).size, [all]);
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter((p) => [p.name, p.subcategory, p.description, p.supplier_name, p.supplier_location].some((v) => v && String(v).toLowerCase().includes(term)));
  }, [all, q]);

  if (loading) return <PageLoader />;
  if (error)
    return (
      <main className="container-page py-16">
        <ErrorState error={error} onRetry={reload} />
      </main>
    );

  const img = categoryImage(category);
  const postLink = `/post-requirement?category=${encodeURIComponent(category.name)}`;

  return (
    <main>
      <section className="bg-neel-950 text-white">
        <div className="container-page grid items-center gap-8 py-10 lg:grid-cols-[1fr_420px] lg:py-14">
          <div>
            <nav className="flex items-center gap-1 text-[13px] text-white/55" aria-label="Breadcrumb">
              <Link to="/categories" className="hover:text-white">
                Categories
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-white/80">{category.name}</span>
            </nav>
            <h1 className="mt-3 text-[34px] font-bold leading-tight text-white sm:text-[44px]">{category.name}</h1>
            {category.name_hi && (
              <p lang="hi" className="deva mt-1 text-[20px] text-haldi-500">
                {category.name_hi}
              </p>
            )}
            {category.description && <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-white/75">{category.description}</p>}

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <dt className="text-[13px] text-white/55">Products</dt>
                <dd className="num font-display text-[26px] font-bold">{category.product_count}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-white/55">Suppliers</dt>
                <dd className="num font-display text-[26px] font-bold">{products.loading ? "…" : supplierCount}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-white/55">Open requirements</dt>
                <dd className="num font-display text-[26px] font-bold">{category.requirement_count}</dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap gap-2">
              <Link to={postLink} className="btn btn-primary btn-lg">
                Post a requirement
              </Link>
              {category.requirement_count > 0 && (
                <Link to={`/requirements?category=${encodeURIComponent(category.name)}`} className="btn btn-lg border border-white/25 text-white hover:bg-white/10">
                  See buyer requirements
                </Link>
              )}
            </div>
          </div>
          {img && <img src={img} alt="" className="hidden aspect-[4/3] w-full rounded-[16px] object-cover lg:block" />}
        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[24px] font-bold">Products in {category.name}</h2>
          {all.length > 6 && (
            <label className="relative w-full sm:w-[320px]">
              <span className="sr-only">Search in this category</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
              <input className="input pl-10" placeholder="Search in this category" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          )}
        </div>

        <div className="mt-6">
          {products.error ? (
            <ErrorState error={products.error} onRetry={products.reload} />
          ) : products.loading ? (
            <PageLoader />
          ) : list.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={all.length ? "No products match that search" : "No products in this category yet"}
              action={
                <Link to={postLink} className="btn btn-primary">
                  Post a requirement
                </Link>
              }
            >
              {all.length ? "Try another word." : "Post what you need and suppliers in this trade will send you quotes."}
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}