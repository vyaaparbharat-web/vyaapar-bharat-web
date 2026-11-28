// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
// import { useApi } from "../lib/useApi";
// import { assetUrl } from "../lib/api";

// // One slide: clickable when the admin gave it a link
// function Slide({ banner, active, eager }) {
//   const img = (
//     <img
//       src={assetUrl(banner.image_url)}
//       alt={banner.title}
//       className="aspect-[2.7/1] w-full object-cover"
//       loading={eager ? "eager" : "lazy"}
//     />
//   );
//   const cls = "block w-full shrink-0";
//   const tabIndex = active ? 0 : -1;

//   if (!banner.link_url) return <div className={cls} aria-hidden={!active}>{img}</div>;
//   if (banner.link_url.startsWith("/")) {
//     return (
//       <Link to={banner.link_url} className={cls} aria-hidden={!active} tabIndex={tabIndex}>
//         {img}
//       </Link>
//     );
//   }
//   return (
//     <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className={cls} aria-hidden={!active} tabIndex={tabIndex}>
//       {img}
//     </a>
//   );
// }

// // Featured member businesses (their own ad banners). Managed in Admin → Banners.
// export default function SponsoredBanners() {
//   const { data } = useApi("/api/banners");
//   const banners = data?.banners || [];
//   const count = banners.length;
//   const [index, setIndex] = useState(0);
//   const [playing, setPlaying] = useState(() => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

//   useEffect(() => {
//     if (!playing || count < 2) return undefined;
//     const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
//     return () => clearInterval(t);
//   }, [playing, count]);

//   if (!count) return null;

//   const current = index % count; // stays valid if the list changes
//   const go = (d) => setIndex((i) => (i + d + count) % count);

//   return (
//     <section className="container-page pt-14" aria-roledescription="carousel" aria-label="Featured businesses">
//       <div className="mb-4 flex items-end justify-between gap-4">
//         <h2 className="text-[22px] font-bold">Featured on Vyapaar Bharat</h2>
//         {count > 1 && (
//           <div className="flex items-center gap-1">
//             <button className="btn btn-ghost btn-sm !px-2" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
//               {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
//             </button>
//             <button className="btn btn-outline btn-sm !px-2" onClick={() => go(-1)} aria-label="Previous">
//               <ChevronLeft className="h-4 w-4" />
//             </button>
//             <button className="btn btn-outline btn-sm !px-2" onClick={() => go(1)} aria-label="Next">
//               <ChevronRight className="h-4 w-4" />
//             </button>
//           </div>
//         )}
//       </div>
//       <div className="relative overflow-hidden rounded-[16px] border border-line bg-white">
//         <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
//           {banners.map((b, i) => (
//             <Slide key={b.id} banner={b} active={i === current} eager={i === 0} />
//           ))}
//         </div>
//       </div>
//       <div className="mt-3 flex items-center gap-2" role="tablist">
//         {count > 1 &&
//           banners.map((b, i) => (
//             <button
//               key={b.id}
//               role="tab"
//               aria-selected={i === current}
//               aria-label={b.title}
//               onClick={() => setIndex(i)}
//               className={`h-1.5 rounded-full transition-all ${i === current ? "w-8 bg-neel-900" : "w-3 bg-line-strong hover:bg-subtle"}`}
//             />
//           ))}
//         <span className="ml-auto text-[13px] text-muted">{banners[current].title}</span>
//       </div>
//     </section>
//   );
// }


import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useApi } from "../lib/useApi";
import { assetUrl } from "../lib/api";

// One slide: clickable when the admin gave it a link
function Slide({ banner, active, eager }) {
  const src = assetUrl(banner.image_url);
  // The whole banner is always visible (object-contain). A blurred copy of the same image fills any empty space,
  // so banners of any shape look finished. Taller frame on phones so text on the banner stays readable.
  const img = (
    <span className="relative block aspect-[2/1] w-full overflow-hidden bg-neel-950 sm:aspect-[2.2/1] lg:aspect-[2.7/1]">
      <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" loading={eager ? "eager" : "lazy"} />
      <img src={src} alt={banner.title} className="relative h-full w-full object-contain" loading={eager ? "eager" : "lazy"} />
    </span>
  );
  const cls = "block w-full shrink-0";
  const tabIndex = active ? 0 : -1;

  if (!banner.link_url) return <div className={cls} aria-hidden={!active}>{img}</div>;
  if (banner.link_url.startsWith("/")) {
    return (
      <Link to={banner.link_url} className={cls} aria-hidden={!active} tabIndex={tabIndex}>
        {img}
      </Link>
    );
  }
  return (
    <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className={cls} aria-hidden={!active} tabIndex={tabIndex}>
      {img}
    </a>
  );
}

// Featured member businesses (their own ad banners). Managed in Admin → Banners.
export default function SponsoredBanners() {
  const { data } = useApi("/api/banners");
  const banners = data?.banners || [];
  const count = banners.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (!playing || count < 2) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(t);
  }, [playing, count]);

  if (!count) return null;

  const current = index % count; // stays valid if the list changes
  const go = (d) => setIndex((i) => (i + d + count) % count);

  return (
    <section className="container-page pt-14" aria-roledescription="carousel" aria-label="Featured businesses">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-[22px] font-bold">Featured on Vyapaar Bharat</h2>
        {count > 1 && (
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-sm !px-2" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button className="btn btn-outline btn-sm !px-2" onClick={() => go(-1)} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="btn btn-outline btn-sm !px-2" onClick={() => go(1)} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="relative -mx-5 overflow-hidden border-y border-line bg-white sm:mx-0 sm:rounded-[16px] sm:border">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${current * 100}%)` }}>
          {banners.map((b, i) => (
            <Slide key={b.id} banner={b} active={i === current} eager={i === 0} />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2" role="tablist">
        {count > 1 &&
          banners.map((b, i) => (
            <button
              key={b.id}
              role="tab"
              aria-selected={i === current}
              aria-label={b.title}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-8 bg-neel-900" : "w-3 bg-line-strong hover:bg-subtle"}`}
            />
          ))}
        <span className="ml-auto truncate pl-3 text-right text-[13px] text-muted">{banners[current].title}</span>
      </div>
    </section>
  );
}