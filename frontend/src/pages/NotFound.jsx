import { Link } from "react-router-dom";
import { useSeo } from "../lib/seo";

export default function NotFound() {
  useSeo({ title: "Page not found", noindex: true });
  return (
    <main className="container-page py-24 text-center">
      <p className="num font-display text-[72px] font-extrabold text-neel-900">404</p>
      <h1 className="mt-2 text-[26px] font-bold">This page doesn't exist</h1>
      <p className="mt-2 text-muted">The link may be old, or the item was removed.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="btn btn-dark">
          Go to home
        </Link>
        <Link to="/products" className="btn btn-outline">
          Browse products
        </Link>
      </div>
    </main>
  );
}