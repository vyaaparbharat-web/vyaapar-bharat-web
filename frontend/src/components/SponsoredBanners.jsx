import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import arRoadline from "../assets/ar roadline.png";
import quickTransport from "../assets/quick transport and solution.png";
import ramanTempo from "../assets/raman tempo.png";
import saiTyreHouse from "../assets/sai tyre hosue.png";
import sonuMotorGarage from "../assets/sonu motor garage.png";
import northIndiaHeavyTransport from "../assets/north india heavy transport.png";

const BANNERS = [
  { name: "AR Roadline", image: arRoadline },
  { name: "North India Heavy Transport", image: northIndiaHeavyTransport },
  { name: "Sai Tyre House", image: saiTyreHouse },
  { name: "Quick Transport & Solution", image: quickTransport },
  { name: "Sonu Motor Garage", image: sonuMotorGarage },
  { name: "Raman Tempo Service", image: ramanTempo },
];

// Featured member businesses (their own ad banners)
export default function SponsoredBanners() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, [playing]);

  const go = (d) => setIndex((i) => (i + d + BANNERS.length) % BANNERS.length);

  return (
    <section className="container-page pt-14" aria-roledescription="carousel" aria-label="Featured businesses">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-[22px] font-bold">Featured on Vyapaar Bharat</h2>
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
      </div>
      <div className="relative overflow-hidden rounded-[16px] border border-line bg-white">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {BANNERS.map((b, i) => (
            <img
              key={b.name}
              src={b.image}
              alt={`${b.name} advertisement`}
              className="aspect-[2.7/1] w-full shrink-0 object-cover"
              aria-hidden={i !== index}
              loading={i === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2" role="tablist">
        {BANNERS.map((b, i) => (
          <button
            key={b.name}
            role="tab"
            aria-selected={i === index}
            aria-label={b.name}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-neel-900" : "w-3 bg-line-strong hover:bg-subtle"}`}
          />
        ))}
        <span className="ml-auto text-[13px] text-muted">{BANNERS[index].name}</span>
      </div>
    </section>
  );
}
