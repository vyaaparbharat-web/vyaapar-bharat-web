import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { useApi } from "../lib/useApi";
import { date } from "../lib/format";
import { INSIGHT_CATEGORIES } from "../lib/constants";
import { EmptyState, ErrorState, Img, PageLoader } from "../components/ui";

export default function Insights() {
  const { data, loading, error, reload } = useApi("/api/insights");
  const [cat, setCat] = useState("all");
  const all = useMemo(() => data?.insights || [], [data]);
  const list = cat === "all" ? all : all.filter((i) => i.category_id === cat);
  const [lead, ...rest] = list;

  return (
    <main className="container-page py-10">
      <h1 className="text-[34px] font-bold">Insights</h1>
      <p className="mt-1 max-w-2xl text-muted">Market updates, sourcing guides and practical tips for Indian businesses.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        <button className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>
          All
        </button>
        {INSIGHT_CATEGORIES.map((c) => (
          <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : loading ? (
          <PageLoader />
        ) : !lead ? (
          <div className="panel">
            <EmptyState icon={Newspaper} title="No articles here yet">
              Check back soon, or pick another topic.
            </EmptyState>
          </div>
        ) : (
          <>
            <Link to={`/insights/${lead.id}`} className="group panel grid overflow-hidden md:grid-cols-[1.3fr_1fr]">
              <Img src={lead.image_url} alt="" fallbackLabel={lead.category} className="aspect-[16/9] w-full md:aspect-auto md:h-full" />
              <div className="flex flex-col justify-center p-7">
                <div className="text-[13px] text-muted">
                  {lead.category}, {date(lead.created_at)}
                </div>
                <h2 className="mt-2 text-[26px] font-bold group-hover:text-neel-700">{lead.title}</h2>
                <p className="mt-3 line-clamp-4 text-muted">{lead.excerpt}</p>
                <span className="link mt-5 text-[14.5px]">Read article</span>
              </div>
            </Link>
            {rest.length > 0 && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((i) => (
                  <Link key={i.id} to={`/insights/${i.id}`} className="group panel flex flex-col overflow-hidden">
                    <Img src={i.image_url} alt="" fallbackLabel={i.category} className="aspect-[16/9] w-full" />
                    <div className="p-5">
                      <div className="text-[12.5px] text-muted">
                        {i.category}, {date(i.created_at)}
                      </div>
                      <h3 className="mt-1.5 font-sans text-[17px] font-semibold leading-snug tracking-normal group-hover:text-neel-700">{i.title}</h3>
                      <p className="mt-2 line-clamp-3 text-[14px] text-muted">{i.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
