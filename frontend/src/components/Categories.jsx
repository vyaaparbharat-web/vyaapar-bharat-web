import { Link } from "react-router-dom";
import { useApi } from "../lib/useApi";
import CategoryTile from "./CategoryTile";

// Home page "Shop by trade": the first 9 categories (admins control the order)
export default function Categories() {
  const { data, loading } = useApi("/api/categories");
  const categories = (data?.categories || []).slice(0, 9);

  if (!loading && !categories.length) return null;

  return (
    <section className="container-page pt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold">Shop by trade</h2>
          <p className="mt-1 text-muted">The industries most of our buyers and suppliers work in.</p>
        </div>
        <Link to="/categories" className="link text-[14.5px]">
          All categories
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
        {loading
          ? Array.from({ length: 9 }, (_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-[14px] bg-line lg:aspect-[3/4]" />)
          : categories.map((c) => <CategoryTile key={c.id} category={c} tall />)}
      </div>
    </section>
  );
}