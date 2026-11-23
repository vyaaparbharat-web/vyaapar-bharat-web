import { Link } from "react-router-dom";
import { BadgeCheck, MapPin } from "lucide-react";
import { Img } from "./ui";
import { money, number } from "../lib/format";

export default function ProductCard({ product }) {
  const price = money(product.price);
  return (
    <Link to={`/products/${product.id}`} className="group panel flex flex-col overflow-hidden transition-colors hover:border-line-strong">
      <Img src={product.image_url} alt={product.name} fallbackLabel={product.category || product.name} className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[12.5px] text-muted">{product.category || "General"}</div>
        <h3 className="mt-1 line-clamp-2 font-sans text-[15.5px] font-semibold leading-snug tracking-normal group-hover:text-neel-700">{product.name}</h3>
        <div className="mt-2.5">
          {price ? (
            <span className="num text-[17px] font-bold">
              {price}
              {product.price_unit && <span className="text-[13px] font-medium text-muted"> / {product.price_unit}</span>}
            </span>
          ) : (
            <span className="text-[14px] font-semibold text-neel-700">Ask for price</span>
          )}
          {product.moq ? (
            <div className="num mt-0.5 text-[12.5px] text-muted">
              Min. order {number(product.moq)} {product.moq_unit || ""}
            </div>
          ) : null}
        </div>
        <div className="mt-auto border-t border-line pt-3 text-[13px]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{product.supplier_name || "Supplier"}</span>
            {product.supplier_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-ok" aria-label="Verified supplier" />}
          </div>
          {product.supplier_location && (
            <div className="mt-0.5 flex items-center gap-1 text-muted">
              <MapPin className="h-3.5 w-3.5" /> {product.supplier_location}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
