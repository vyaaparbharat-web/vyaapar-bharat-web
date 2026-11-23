import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "./Navbar";

const COLUMNS = [
  {
    title: "For buyers",
    links: [
      { to: "/post-requirement", label: "Post a requirement" },
      { to: "/products", label: "Browse products" },
      { to: "/suppliers", label: "Find suppliers" },
      { to: "/my-requirements", label: "My requirements" },
    ],
  },
  {
    title: "For suppliers",
    links: [
      { to: "/requirements", label: "Buyer requirements" },
      { to: "/login?mode=register&role=supplier", label: "List your business" },
      { to: "/my-quotes", label: "My quotes" },
      { to: "/pricing", label: "Plans" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/insights", label: "Insights" },
      { to: "/pricing", label: "Pricing" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-neel-950 text-white/80">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-white/60">
            Buyers post what they need. Verified suppliers from across India send quotes. You compare and close the deal.
          </p>
          <ul className="mt-6 space-y-2.5 text-[14px]">
            <li>
              <a href="mailto:info@vyapaarbharat.com" className="inline-flex items-center gap-2.5 hover:text-white">
                <Mail className="h-4 w-4 text-haldi-500" /> info@vyapaarbharat.com
              </a>
            </li>
            <li>
              <a href="tel:+916284975308" className="inline-flex items-center gap-2.5 hover:text-white">
                <Phone className="h-4 w-4 text-haldi-500" /> +91 62849 75308
              </a>
            </li>
            <li className="inline-flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-haldi-500" /> India
            </li>
          </ul>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="font-display text-[15px] font-semibold text-white">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-[14px]">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-white/65 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Vyapaar Bharat. All rights reserved.</span>
          <span lang="hi" className="deva">
            भारत का व्यापार, एक जगह
          </span>
        </div>
      </div>
    </footer>
  );
}
