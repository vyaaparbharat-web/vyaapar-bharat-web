import { Link, useParams } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { date } from "../lib/format";
import { ErrorState, Img, PageLoader } from "../components/ui";
import { breadcrumbs, clip, SITE_URL, useSeo } from "../lib/seo";

export default function InsightDetails() {
  const { id } = useParams();
  const { data, loading, error, reload } = useApi(`/api/insights/${id}`);
  const others = useApi("/api/insights");
  const art = data?.insight;
  useSeo(
    art && {
      title: art.title,
      description: art.excerpt,
      path: `/insights/${art.id}`,
      image: art.image_url,
      type: "article",
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            headline: art.title,
            description: clip(art.excerpt),
            image: art.image_url ? [`${SITE_URL}${art.image_url}`] : undefined,
            datePublished: art.created_at,
            dateModified: art.updated_at || art.created_at,
            publisher: { "@id": `${SITE_URL}/#org` },
            mainEntityOfPage: `${SITE_URL}/insights/${art.id}`,
          },
          breadcrumbs([
            ["Insights", "/insights"],
            [art.title, `/insights/${art.id}`],
          ]),
        ],
      },
    },
  );

  if (loading) return <PageLoader />;
  if (error)
    return (
      <main className="container-page py-10">
        <ErrorState error={error} onRetry={error.status === 404 ? null : reload} />
      </main>
    );

  const i = data.insight;
  const more = (others.data?.insights || []).filter((x) => x.id !== i.id).slice(0, 3);

  return (
    <main className="container-page py-10">
      <article className="mx-auto max-w-[720px]">
        <Link to="/insights" className="text-[14px] font-medium text-muted hover:text-ink">
          ← Insights
        </Link>
        <div className="mt-6 text-[14px] text-muted">
          {i.category}, {date(i.created_at)}
        </div>
        <h1 className="mt-2 text-[34px] font-bold sm:text-[42px]">{i.title}</h1>
        <p className="mt-4 text-[18px] leading-relaxed text-muted">{i.excerpt}</p>
        {i.image_url && <Img src={i.image_url} alt="" className="mt-8 aspect-[16/9] w-full rounded-[16px]" />}
        <div className="mt-8 whitespace-pre-line text-[17px] leading-[1.75]">{i.content}</div>
      </article>

      {more.length > 0 && (
        <section className="mx-auto mt-16 max-w-[720px] border-t border-line pt-8">
          <h2 className="text-[20px] font-bold">Keep reading</h2>
          <ul className="mt-4 divide-y divide-line">
            {more.map((m) => (
              <li key={m.id}>
                <Link to={`/insights/${m.id}`} className="block py-4 hover:text-neel-700">
                  <div className="text-[12.5px] text-muted">{m.category}</div>
                  <div className="font-semibold">{m.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}