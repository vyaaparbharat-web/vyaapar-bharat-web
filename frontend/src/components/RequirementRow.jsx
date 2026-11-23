import { Link } from "react-router-dom";
import { MapPin, MessageSquareQuote } from "lucide-react";
import { StatusBadge } from "./ui";
import { ago, budget, number } from "../lib/format";

// One requirement in a list. `action` lets the page add a button (e.g. "Send quote").
export default function RequirementRow({ requirement: r, action, showStatus = true }) {
  return (
    <article className="relative flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
          <span>{r.category}</span>
          <span aria-hidden>/</span>
          <span>{ago(r.created_at)}</span>
          {r.is_mine && <span className="rounded bg-haldi-100 px-1.5 font-semibold text-[#9a4200]">Yours</span>}
        </div>
        <h3 className="mt-1 font-sans text-[16.5px] font-semibold leading-snug tracking-normal">
          <Link to={`/requirements/${r.id}`} className="after:absolute after:inset-0 hover:text-neel-700">
            {r.title}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-muted">
          <span className="num font-semibold text-ink">
            {number(r.quantity)} {r.unit}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {r.delivery_location}
          </span>
          <span className="num">{budget(r.min_budget, r.max_budget)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        {showStatus && <StatusBadge status={r.status} />}
        <span className="num inline-flex items-center gap-1.5 text-[13px] text-muted">
          <MessageSquareQuote className="h-3.5 w-3.5" />
          {r.quote_count || 0} {r.quote_count === 1 ? "quote" : "quotes"}
        </span>
        {action && <div className="relative z-10">{action}</div>}
      </div>
    </article>
  );
}
