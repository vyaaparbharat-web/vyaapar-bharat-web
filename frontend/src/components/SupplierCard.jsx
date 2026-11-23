import { Link } from "react-router-dom";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { Img } from "./ui";

export default function SupplierCard({ supplier }) {
  return (
    <Link to={`/suppliers/${supplier.id}`} className="group panel flex flex-col overflow-hidden transition-colors hover:border-line-strong">
      <Img
        src={supplier.image_url || supplier.gallery_images?.[0]}
        alt={supplier.name}
        fallbackLabel={supplier.name}
        fit="contain"
        className="aspect-[16/10] w-full border-b border-line"
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-sans text-[16px] font-semibold leading-snug tracking-normal group-hover:text-neel-700">{supplier.name}</h3>
          {supplier.verified && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok-bg px-2 py-0.5 text-[12px] font-semibold text-ok">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
        <div className="mt-1 text-[13.5px] text-muted">{[supplier.business_type, supplier.industry].filter(Boolean).join(", ") || "Business"}</div>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-[13px] text-muted">
          {supplier.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {supplier.location}
            </span>
          )}
          {supplier.rating ? (
            <span className="num inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-haldi-500 text-haldi-500" /> {Number(supplier.rating).toFixed(1)}
            </span>
          ) : null}
          {supplier.years_in_business ? <span className="num">{supplier.years_in_business} yrs in business</span> : null}
        </div>
      </div>
    </Link>
  );
}