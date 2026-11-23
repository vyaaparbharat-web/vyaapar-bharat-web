// Animated market street in the hero background: shops slide by, trucks and tempos drive across.
// Pure SVG + CSS (see "Market street" in index.css). No images, no libraries.

const BLUE = "#003297";
const NAVY = "#001a5c";
const ORANGE = "#f07c14";
const LIGHT = "#e2e9f8";

// ---------- goods shown in shop windows ----------
function Shoes() {
  return (
    <g fill={ORANGE}>
      <path d="M6 30 h22 q4 0 4 -4 q0 -3 -4 -4 l-7 -2 l-4 -6 h-6 q-5 0 -5 6 z" />
      <path
        d="M38 30 h22 q4 0 4 -4 q0 -3 -4 -4 l-7 -2 l-4 -6 h-6 q-5 0 -5 6 z"
        fill={BLUE}
      />
      <rect x="6" y="29" width="26" height="3" rx="1.5" fill={NAVY} />
      <rect x="38" y="29" width="26" height="3" rx="1.5" fill={NAVY} />
    </g>
  );
}
function Clothes() {
  const shirt = (x, c) => (
    <path
      transform={`translate(${x} 6)`}
      fill={c}
      d="M5 0 h5 q1.5 3 4 3 q2.5 0 4 -3 h5 l5 6 l-4 4 l-2 -2 v16 h-16 v-16 l-2 2 l-4 -4 z"
    />
  );
  return (
    <g>
      <rect x="2" y="4" width="68" height="2" rx="1" fill={NAVY} />
      {shirt(2, ORANGE)}
      {shirt(24, BLUE)}
      {shirt(46, "#8fa6dd")}
    </g>
  );
}
function Tyres() {
  const tyre = (cx) => (
    <g key={cx}>
      <circle cx={cx} cy="19" r="13" fill={NAVY} />
      <circle cx={cx} cy="19" r="6" fill="#c4d1f0" />
      <circle cx={cx} cy="19" r="2.5" fill={NAVY} />
    </g>
  );
  return <g>{[16, 46].map(tyre)}</g>;
}
function Hardware() {
  return (
    <g>
      <rect x="4" y="8" width="62" height="5" rx="2.5" fill="#8fa6dd" />
      <rect x="4" y="16" width="62" height="5" rx="2.5" fill={BLUE} />
      <rect x="4" y="24" width="62" height="5" rx="2.5" fill="#8fa6dd" />
      <circle
        cx="56"
        cy="10"
        r="5"
        fill="none"
        stroke={ORANGE}
        strokeWidth="3"
      />
    </g>
  );
}
function Fabric() {
  const roll = (x, c) => (
    <g key={x}>
      <rect x={x} y="6" width="14" height="26" rx="3" fill={c} />
      <ellipse cx={x + 7} cy="6" rx="7" ry="3" fill="#fff" opacity=".6" />
    </g>
  );
  return (
    <g>
      {[
        [4, ORANGE],
        [22, BLUE],
        [40, "#f5a55c"],
        [56, "#8fa6dd"],
      ].map(([x, c]) => roll(x, c))}
    </g>
  );
}
function Boxes() {
  return (
    <g>
      <rect x="4" y="14" width="22" height="18" fill="#d9a066" />
      <rect x="28" y="8" width="22" height="24" fill="#c98b52" />
      <rect x="52" y="18" width="14" height="14" fill="#d9a066" />
      <path d="M4 20 h22 M28 15 h22" stroke="#9a6532" strokeWidth="1.5" />
    </g>
  );
}

const SHOPS = [
  { en: "Joota Ghar", hi: "जूता घर", goods: Shoes, awning: [BLUE, "#fff"] },
  {
    en: "Kapda Bazaar",
    hi: "कपड़ा बाज़ार",
    goods: Clothes,
    awning: [ORANGE, "#fff"],
  },
  {
    en: "Tyre House",
    hi: "टायर हाउस",
    goods: Tyres,
    awning: [NAVY, "#c4d1f0"],
  },
  {
    en: "Hardware Store",
    hi: "हार्डवेयर",
    goods: Hardware,
    awning: [ORANGE, NAVY],
  },
  { en: "Hosiery Outlet", hi: "होज़री", goods: Fabric, awning: [BLUE, ORANGE] },
  {
    en: "Wholesale Mart",
    hi: "थोक बाज़ार",
    goods: Boxes,
    awning: [NAVY, ORANGE],
  },
];

function Shop({ shop, x }) {
  const Goods = shop.goods;
  const [a, b] = shop.awning;
  return (
    <g transform={`translate(${x} 0)`}>
      {/* building */}
      <rect
        x="0"
        y="22"
        width="190"
        height="118"
        fill="#fff"
        stroke={LIGHT}
        strokeWidth="2"
      />
      <rect x="0" y="22" width="190" height="8" fill={LIGHT} />
      {/* signboard */}
      <rect x="14" y="34" width="162" height="24" rx="4" fill={NAVY} />
      <text
        x="95"
        y="51"
        textAnchor="middle"
        fontSize="12.5"
        fontWeight="700"
        fill="#fff"
        fontFamily="Instrument Sans, sans-serif"
      >
        {shop.en}
      </text>
      {/* striped awning */}
      {Array.from({ length: 10 }).map((_, i) => (
        <path
          key={i}
          d={`M${i * 19} 62 h19 v12 q-9.5 7 -19 0 z`}
          fill={i % 2 ? b : a}
        />
      ))}
      {/* window with goods */}
      <rect
        x="14"
        y="84"
        width="98"
        height="46"
        rx="3"
        fill="#f0f4fc"
        stroke={LIGHT}
        strokeWidth="2"
      />
      <g transform="translate(28 92)">
        <Goods />
      </g>
      {/* door */}
      <rect x="126" y="84" width="48" height="56" rx="2" fill="#c4d1f0" />
      <circle cx="166" cy="114" r="2.5" fill={NAVY} />
      <text
        x="150"
        y="98"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={NAVY}
        fontFamily="Mukta, sans-serif"
      >
        {shop.hi}
      </text>
    </g>
  );
}

// One set of shops; rendered twice side by side so the loop is seamless
function ShopRow() {
  const gap = 230;
  return (
    <svg
      viewBox={`0 0 ${SHOPS.length * gap} 140`}
      width={SHOPS.length * gap}
      height="140"
      className="block shrink-0"
      aria-hidden
    >
      {SHOPS.map((s, i) => (
        <Shop key={s.en} shop={s} x={i * gap + 20} />
      ))}
      {/* street lamps between shops */}
      {SHOPS.map((_, i) => (
        <g key={i} transform={`translate(${i * gap + 2} 0)`}>
          <rect x="6" y="40" width="3" height="100" fill="#c3cbdc" />
          <circle cx="7.5" cy="40" r="5" fill={ORANGE} opacity=".85" />
        </g>
      ))}
    </svg>
  );
}

function Wheel({ cx, cy, r = 9 }) {
  return (
    <g className="ms-wheel">
      <circle cx={cx} cy={cy} r={r} fill="#141a2e" />
      <circle cx={cx} cy={cy} r={r * 0.45} fill="#c3cbdc" />
      <path
        d={`M${cx - r * 0.45} ${cy} h${r * 0.9} M${cx} ${cy - r * 0.45} v${r * 0.9}`}
        stroke="#586078"
        strokeWidth="1.5"
      />
    </g>
  );
}

function Truck() {
  return (
    <svg
      viewBox="0 0 200 84"
      width="200"
      height="84"
      aria-hidden
      className="ms-bob"
    >
      {/* container */}
      <rect x="2" y="6" width="132" height="58" rx="4" fill={BLUE} />
      <rect x="2" y="48" width="132" height="6" fill={ORANGE} />
      <text
        x="68"
        y="32"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="#fff"
        fontFamily="Bricolage Grotesque, sans-serif"
      >
        VYAPAAR BHARAT
      </text>
      <text
        x="68"
        y="44"
        textAnchor="middle"
        fontSize="8.5"
        fill="#c4d1f0"
        fontFamily="Mukta, sans-serif"
      >
        प्रचार करो व्यापार करो
      </text>
      {/* cab */}
      <path d="M138 22 h30 l22 20 v22 h-52 z" fill={ORANGE} />
      <path d="M144 27 h21 l15 14 h-36 z" fill="#e2e9f8" />
      <rect x="186" y="52" width="8" height="5" rx="1" fill="#ffd9a8" />
      <rect x="2" y="64" width="190" height="6" fill="#141a2e" />
      <Wheel cx={30} cy={72} />
      <Wheel cx={56} cy={72} />
      <Wheel cx={166} cy={72} />
    </svg>
  );
}

function Tempo() {
  return (
    <svg
      viewBox="0 0 130 70"
      width="130"
      height="70"
      aria-hidden
      className="ms-bob ms-bob-fast"
    >
      <rect x="2" y="12" width="78" height="40" rx="3" fill={ORANGE} />
      <rect
        x="10"
        y="20"
        width="62"
        height="5"
        rx="2"
        fill="#fff"
        opacity=".5"
      />
      <rect
        x="10"
        y="30"
        width="44"
        height="5"
        rx="2"
        fill="#fff"
        opacity=".5"
      />
      <path d="M84 20 h18 l20 18 v14 h-38 z" fill={BLUE} />
      <path d="M89 25 h11 l14 12 h-25 z" fill="#e2e9f8" />
      <rect x="2" y="52" width="122" height="5" fill="#141a2e" />
      <Wheel cx={24} cy={58} r={8} />
      <Wheel cx={104} cy={58} r={8} />
    </svg>
  );
}

function Van() {
  return (
    <svg
      viewBox="0 0 120 64"
      width="120"
      height="64"
      aria-hidden
      className="ms-bob"
    >
      <path
        d="M4 14 h76 l26 18 v18 h-102 z"
        fill="#fff"
        stroke={BLUE}
        strokeWidth="3"
      />
      <path d="M82 18 l20 14 h-20 z" fill="#c4d1f0" />
      <rect x="10" y="26" width="58" height="6" rx="3" fill={ORANGE} />
      <rect
        x="10"
        y="36"
        width="40"
        height="4"
        rx="2"
        fill={BLUE}
        opacity=".35"
      />
      <Wheel cx={26} cy={52} r={8} />
      <Wheel cx={88} cy={52} r={8} />
    </svg>
  );
}

// Sits in the background of the hero (absolute, behind the text). Never catches clicks.
export default function MarketStreet({ className = "" }) {
  return (
    <div
      className={`market-street pointer-events-none absolute inset-x-0 bottom-0 h-[230px] overflow-hidden sm:h-[250px] ${className}`}
      aria-hidden
    >
      {/* shops (slow, behind) */}
      <div className="absolute inset-x-0 top-0 flex w-max ms-shops">
        <ShopRow />
        <ShopRow />
      </div>

      {/* pavement + road */}
      <div className="absolute inset-x-0 top-[140px] h-3 bg-[#dde3ee]" />
      <div className="absolute inset-x-0 bottom-0 top-[152px] bg-[#2a3150]">
        <div className="ms-lane absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2" />
      </div>

      {/* far lane: right to left */}
      <div
        className="ms-vehicle ms-rtl"
        style={{ bottom: 52, "--dur": "17s", "--delay": "-4s" }}
      >
        <div className="-scale-x-100">
          <Tempo />
        </div>
      </div>
      <div
        className="ms-vehicle ms-rtl"
        style={{ bottom: 52, "--dur": "17s", "--delay": "-12.5s" }}
      >
        <div className="-scale-x-100">
          <Van />
        </div>
      </div>

      {/* soft white fade on top so the street melts into the hero */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white via-white/70 to-transparent" />

      {/* near lane: left to right */}
      <div
        className="ms-vehicle ms-ltr"
        style={{ bottom: 6, "--dur": "13s", "--delay": "-2s" }}
      >
        <Truck />
      </div>
      <div
        className="ms-vehicle ms-ltr"
        style={{ bottom: 8, "--dur": "13s", "--delay": "-8.5s" }}
      >
        <Tempo />
      </div>
    </div>
  );
}
