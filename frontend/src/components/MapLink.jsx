import { MapPin } from "lucide-react";
import { mapsUrl } from "../lib/maps";

// Shows the company's city with a pin and opens Google Maps in a new tab.
// Inside a card that is already a link, pass `nested` so we don't put a link inside a link.
export default function MapLink({ company, label, nested = false, className = "", iconClassName = "h-3.5 w-3.5" }) {
  const url = mapsUrl(company);
  const text = label ?? company?.location ?? company?.supplier_location;
  if (!text) return null;

  const content = (
    <>
      <MapPin className={`${iconClassName} shrink-0`} aria-hidden="true" />
      <span className="truncate">{text}</span>
    </>
  );
  const cls = `inline-flex min-w-0 items-center gap-1 ${url ? "underline-offset-2 hover:text-neel-700 hover:underline" : ""} ${className}`;

  if (!url) return <span className={cls}>{content}</span>;

  if (nested) {
    const open = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url, "_blank", "noopener,noreferrer");
    };
    return (
      <span
        role="link"
        tabIndex={0}
        title="Open in Google Maps"
        className={`${cls} cursor-pointer`}
        onClick={open}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && open(e)}
      >
        {content}
      </span>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title="Open in Google Maps" className={cls}>
      {content}
    </a>
  );
}