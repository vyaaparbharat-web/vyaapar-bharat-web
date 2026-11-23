import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    text: "For buyers and new suppliers getting started.",
    cta: { to: "/login?mode=register", label: "Create free account" },
    features: ["Browse products and suppliers", "Post up to 3 requirements", "Receive supplier quotes", "Basic supplier discovery"],
  },
  {
    name: "Business",
    price: "₹999",
    period: "per month",
    text: "For suppliers who quote every week and buyers who source often.",
    cta: { to: "/login?mode=register&role=supplier", label: "Start with Business" },
    featured: true,
    features: ["Everything in Free", "Unlimited requirements", "Priority quote visibility", "Advanced supplier discovery", "Supplier comparison", "Business profile", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "for larger teams",
    text: "Multi-branch businesses and procurement teams.",
    cta: { href: "mailto:info@vyapaarbharat.com?subject=Enterprise%20plan", label: "Talk to us" },
    features: ["Everything in Business", "Dedicated account support", "Custom sourcing assistance", "Advanced business insights", "Multi-user access"],
  },
];

export default function Pricing() {
  return (
    <main className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-[36px] font-bold sm:text-[44px]">Simple plans</h1>
        <p className="mt-2 text-[17px] text-muted">Start free. Upgrade when Vyapaar Bharat is bringing you real orders.</p>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => (
          <section key={p.name} className={`flex flex-col rounded-[20px] p-7 ${p.featured ? "bg-neel-900 text-white" : "panel"}`}>
            <h2 className={`text-[22px] font-bold ${p.featured ? "text-white" : ""}`}>{p.name}</h2>
            <p className={`mt-1 text-[14.5px] ${p.featured ? "text-white/70" : "text-muted"}`}>{p.text}</p>
            <div className="mt-6">
              <span className={`num font-display text-[44px] font-extrabold ${p.featured ? "text-haldi-500" : ""}`}>{p.price}</span>
              <span className={`ml-2 text-[14px] ${p.featured ? "text-white/60" : "text-muted"}`}>{p.period}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-[14.5px]">
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "text-haldi-500" : "text-ok"}`} /> {f}
                </li>
              ))}
            </ul>
            {p.cta.href ? (
              <a href={p.cta.href} className="btn btn-outline btn-lg mt-8">
                {p.cta.label}
              </a>
            ) : (
              <Link to={p.cta.to} className={`btn btn-lg mt-8 ${p.featured ? "btn-primary" : "btn-outline"}`}>
                {p.cta.label}
              </Link>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
