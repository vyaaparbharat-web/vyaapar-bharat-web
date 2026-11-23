import { Link } from "react-router-dom";
import SupplierCard from "./SupplierCard";
import { useApi } from "../lib/useApi";

export default function FeaturedSuppliers() {
  const { data, loading } = useApi("/api/suppliers");
  const suppliers = (data?.suppliers || []).slice(0, 6);
  if (!loading && suppliers.length === 0) return null;

  return (
    <section className="container-page pt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold">Suppliers you can trust</h2>
          <p className="mt-1 text-muted">Verified businesses are checked by our team before they get the badge.</p>
        </div>
        <Link to="/suppliers" className="link text-[14.5px]">
          All suppliers
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="panel h-64 animate-pulse" />)
          : suppliers.map((s) => <SupplierCard key={s.id} supplier={s} />)}
      </div>
    </section>
  );
}
