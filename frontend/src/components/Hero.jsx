import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Truck,
  Package,
  Shirt,
  Footprints,
  Wrench,
  IndianRupee,
  Store,
  Disc3,
} from "lucide-react";
import { useApi } from "../lib/useApi";
import { useAuth } from "../context/AuthContext";
import { ago, number } from "../lib/format";
import MarketStreet from "./MarketStreet";

const QUICK = [
  "Truck tyres",
  "GI wire",
  "Transport",
  "Hosiery",
  "LED lights",
  "Pipe fittings",
];

const VISIBLE = 5;

// Quantity shown as split-flap tiles, like a railway / mandi rate board
function FlapNumber({ value, delay = 0 }) {
  const text = number(value);
  return (
    <span className="flap-num" aria-label={text}>
      {text.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span
            key={i}
            className="flap"
            aria-hidden
            style={{ animationDelay: `${delay + i * 55}ms` }}
          >
            {ch}
          </span>
        ) : (
          <span key={i} className="flap-sep" aria-hidden>
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

// The "bhav board": live buyer requirements as a tilted 3D departure board
function RequirementBoard({ data, loading }) {
  const all = data?.requirements || [];
  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / VISIBLE));

  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 30, gy: 0 });
  const [desktop, setDesktop] = useState(false);
  const [calm] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  // 3D tilt only on large screens
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Flip to the next set of requirements every few seconds
  useEffect(() => {
    if (pages <= 1 || paused || calm) return undefined;
    const t = setInterval(() => setPage((p) => (p + 1) % pages), 5000);
    return () => clearInterval(t);
  }, [pages, paused, calm]);

  // Last set is topped up from the start, so the board is always full
  const rows =
    total > VISIBLE
      ? Array.from(
          { length: VISIBLE },
          (_, i) => all[(page * VISIBLE + i) % total],
        )
      : all;

  const onMove = (e) => {
    if (!desktop || calm) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({
      x: (0.5 - py) * 8,
      y: (px - 0.5) * 10,
      gx: px * 100,
      gy: py * 100,
    });
  };
  const onLeave = () => {
    setPaused(false);
    setTilt({ x: 0, y: 0, gx: 30, gy: 0 });
  };

  const use3d = desktop && !calm;
  const transform = use3d
    ? `rotateX(${5 + tilt.x}deg) rotateY(${-12 + tilt.y}deg)`
    : "none";

  return (
    <div
      className="relative [perspective:1600px]"
      onMouseMove={onMove}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={onLeave}
    >
      {/* warm glow under the board */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-[10%] right-[10%] h-24 rounded-[50%] bg-haldi-500/30 blur-3xl"
      />

      <div
        className="relative transition-transform duration-300 ease-out [transform-style:preserve-3d]"
        style={{ transform }}
      >
        {/* depth layers behind the board */}
        {use3d && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 rounded-[22px] bg-neel-700/50"
              style={{ transform: "translate3d(22px, 20px, -70px)" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 rounded-[22px] bg-neel-800/80"
              style={{ transform: "translate3d(11px, 10px, -35px)" }}
            />
          </>
        )}

        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-b from-neel-800 via-neel-900 to-neel-950 text-white shadow-[0_50px_90px_-30px_rgba(18,26,64,.8)] ring-1 ring-white/10">
          {/* moving light glare */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70 transition-[background] duration-300"
            style={{
              background: `radial-gradient(600px circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,.10), transparent 45%)`,
            }}
          />
          {/* faint board grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:100%_64px]"
          />

          <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <div className="font-display text-[19px] font-semibold tracking-tight">
                Buyers are asking for
              </div>
              <div lang="hi" className="deva text-[13.5px] text-white/55">
                आज की ज़रूरतें
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-[12.5px] font-semibold ring-1 ring-white/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5fd38d] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5fd38d]" />
              </span>
              LIVE <span className="num text-white/60">{total}</span>
            </span>
          </div>

          <ul className="relative min-h-[330px] divide-y divide-white/[.07]">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="px-6 py-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-white/10" />
                </li>
              ))}
            {!loading && total === 0 && (
              <li className="px-6 py-12 text-center text-[14px] text-white/60">
                No open requirements right now. Post the first one.
              </li>
            )}
            {rows.map((r, i) => (
              <li
                key={`${page}-${i}-${r.id}`}
                className="board-row"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <Link
                  to={`/requirements/${r.id}`}
                  className="group grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3.5 hover:bg-white/[.05]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[15.5px] font-semibold group-hover:text-haldi-500">
                      {r.title}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[12.5px] text-white/50">
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{" "}
                        {r.delivery_location}
                      </span>
                      <span className="shrink-0">{ago(r.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <FlapNumber value={r.quantity} delay={i * 90} />
                    <div className="mt-1 text-[11.5px] uppercase tracking-wider text-white/45">
                      {r.unit}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative flex items-center justify-between border-t border-white/10 px-6 py-4">
            <Link
              to="/requirements"
              className="text-[14px] font-semibold text-haldi-500 hover:text-haldi-100"
            >
              See all buyer requirements
            </Link>
            {pages > 1 && (
              <div className="flex gap-1.5" aria-label="Board pages">
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    aria-label={`Show set ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === page ? "w-6 bg-haldi-500" : "w-1.5 bg-white/30 hover:bg-white/60"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Live strip above the headline: cycles through the newest buyer requirements
function LiveTicker({ requirements }) {
  const [i, setI] = useState(0);
  const list = requirements.slice(0, 8);

  useEffect(() => {
    if (list.length < 2) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % list.length), 3800);
    return () => clearInterval(t);
  }, [list.length]);

  if (!list.length) return null;
  const r = list[i % list.length];
  const who = r.buyer_name ? `${r.buyer_name}` : "A buyer";

  return (
    <Link
      to={`/requirements/${r.id}`}
      className="group mb-7 inline-flex max-w-full items-center gap-3 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 text-[13.5px] shadow-[0_8px_24px_-12px_rgba(0,26,92,.35)] ring-1 ring-line backdrop-blur hover:ring-neel-200"
      aria-live="polite"
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-haldi-500 px-2.5 py-1 text-[12px] font-bold text-neel-950">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        New
      </span>
      <span key={r.id + i} className="ticker-in min-w-0 truncate text-muted">
        <span className="font-semibold text-ink">{who}</span>
        {r.delivery_location ? ` from ${r.delivery_location}` : ""} needs{" "}
        <span className="num font-semibold text-neel-700">
          {number(r.quantity)} {r.unit}
        </span>{" "}
        {r.title}
        <span className="text-subtle"> ({ago(r.created_at)})</span>
      </span>
      <span className="hidden shrink-0 text-neel-700 transition-transform group-hover:translate-x-0.5 sm:inline">
        →
      </span>
    </Link>
  );
}

// Trade icons floating in the hero background; they drift with the mouse (depth = how far)
const FLOATERS = [
  {
    Icon: Truck,
    x: "4%",
    y: "6%",
    size: 58,
    depth: 18,
    color: "text-neel-700",
    delay: "0s",
  },
  {
    Icon: Disc3,
    x: "44%",
    y: "5%",
    size: 46,
    depth: 26,
    color: "text-ink",
    delay: "-2s",
  },
  {
    Icon: Shirt,
    x: "58%",
    y: "3%",
    size: 52,
    depth: 14,
    color: "text-haldi-500",
    delay: "-4s",
    mobile: true,
  },
  {
    Icon: Package,
    x: "88%",
    y: "4%",
    size: 54,
    depth: 22,
    color: "text-haldi-600",
    delay: "-1s",
    mobile: true,
  },
  {
    Icon: Footprints,
    x: "93%",
    y: "40%",
    size: 44,
    depth: 30,
    color: "text-neel-700",
    delay: "-3s",
  },
  {
    Icon: IndianRupee,
    x: "47%",
    y: "36%",
    size: 42,
    depth: 34,
    color: "text-ok",
    delay: "-5s",
  },
  {
    Icon: Wrench,
    x: "50%",
    y: "58%",
    size: 40,
    depth: 20,
    color: "text-neel-600",
    delay: "-2.5s",
  },
  {
    Icon: Store,
    x: "1.5%",
    y: "46%",
    size: 44,
    depth: 16,
    color: "text-haldi-500",
    delay: "-3.5s",
  },
];

function FloatingGoods() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      {/* soft dot grid that fades out towards the bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(#cdd6e8_1.2px,transparent_1.2px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_10%,#000_30%,transparent_75%)]" />
      {/* brand-colour glows */}
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-neel-100 opacity-70 blur-3xl" />
      <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-haldi-100 opacity-80 blur-3xl" />

      {FLOATERS.map(({ Icon, x, y, size, depth, color, delay, mobile }, i) => (
        <div
          key={i}
          className={`floater-parallax absolute hidden ${mobile ? "lg:block" : "xl:block"}`}
          style={{ left: x, top: y, "--depth": depth }}
        >
          <div
            className="floater grid place-items-center rounded-2xl bg-white/90 shadow-[0_14px_30px_-14px_rgba(0,26,92,.45)] ring-1 ring-line"
            style={{ width: size, height: size, animationDelay: delay }}
          >
            <Icon
              className={color}
              style={{ width: size * 0.46, height: size * 0.46 }}
              strokeWidth={2.2}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const HEADLINE = ["Post what you need.", "Suppliers come to you."];

// Headline: every word flips up in 3D, one after another, on page load
function Headline() {
  let n = 0;
  return (
    <h1
      className="h3d max-w-[15ch] text-[40px] font-extrabold leading-[1.04] sm:text-[56px] lg:text-[64px]"
      aria-label={HEADLINE.join(" ")}
    >
      {HEADLINE.map((line, li) => (
        <span
          key={li}
          className={`block ${li === 1 ? "h3d-blue" : ""}`}
          aria-hidden
        >
          {line.split(" ").map((word, wi) => (
            <span key={wi}>
              <span
                className="h3d-word"
                style={{ animationDelay: `${120 + n++ * 85}ms` }}
              >
                {word}
              </span>{" "}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

export default function Hero() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { isSupplier } = useAuth();
  const { data, loading } = useApi("/api/requirements?status=active");
  const sectionRef = useRef(null);

  // Mouse parallax for the floating icons (CSS variables, no re-render)
  const onMove = (e) => {
    const el = sectionRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const r = el.getBoundingClientRect();
    el.style.setProperty(
      "--mx",
      ((e.clientX - r.left) / r.width - 0.5).toFixed(3),
    );
    el.style.setProperty(
      "--my",
      ((e.clientY - r.top) / r.height - 0.5).toFixed(3),
    );
  };

  const search = (e) => {
    e.preventDefault();
    navigate(
      q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products",
    );
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMove}
      className="relative overflow-hidden border-b border-line bg-white"
    >
      <FloatingGoods />

      <div className="container-page relative z-10 grid gap-12 pb-44 pt-12 sm:pb-48 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:pb-40 lg:pt-20">
        <div className="min-w-0">
          <LiveTicker requirements={data?.requirements || []} />
          <Headline />
          <p
            lang="hi"
            className="h3d-fade deva mt-4 text-[20px] font-medium text-haldi-600 sm:text-[22px]"
          >
            ज़रूरत बताइए, सही दाम पाइए।
          </p>
          <p className="mt-4 max-w-[52ch] text-[16.5px] text-muted">
            Manufacturers, wholesalers and transporters from Punjab, Himachal,
            Haryana and beyond send you quotes. Compare price, delivery time and
            terms in one place.
          </p>

          <form
            onSubmit={search}
            className="mt-8 flex max-w-xl items-center gap-2 rounded-[14px] border border-line-strong bg-white p-1.5 focus-within:border-neel-600 focus-within:ring-3 focus-within:ring-neel-100"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-subtle" />
            <label htmlFor="hero-search" className="sr-only">
              Search products and suppliers
            </label>
            <input
              id="hero-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tyres, wire, transport…"
              className="h-11 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-subtle"
            />
            <button className="btn btn-dark h-11">Search</button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {QUICK.map((t) => (
              <Link
                key={t}
                to={`/products?q=${encodeURIComponent(t)}`}
                className="chip"
              >
                {t}
              </Link>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            {isSupplier ? (
              <Link to="/requirements" className="btn btn-primary btn-lg">
                Find buyers for your products
              </Link>
            ) : (
              <Link to="/post-requirement" className="btn btn-primary btn-lg">
                Post a requirement, it's free
              </Link>
            )}
            <Link to="/suppliers" className="btn btn-outline btn-lg">
              Browse suppliers
            </Link>
          </div>
        </div>

        <RequirementBoard data={data} loading={loading} />
      </div>

      {/* Animated market street in the background (behind text and board) */}
      <MarketStreet className="z-0 opacity-70" />
    </section>
  );
}
