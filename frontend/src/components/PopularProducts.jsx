import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { useApi } from "../lib/useApi";

export default function PopularProducts() {
  const { data, loading } = useApi("/api/products");
  const products = (data?.products || []).slice(0, 8);
  if (!loading && products.length === 0) return null;

  return (
    <section className="container-page pt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold">New on the marketplace</h2>
          <p className="mt-1 text-muted">Recently listed products with supplier prices.</p>
        </div>
        <Link to="/products" className="link text-[14.5px]">
          See all
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="panel aspect-[3/4] animate-pulse" />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
