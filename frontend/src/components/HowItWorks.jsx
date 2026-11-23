const BUYER = [
  { title: "Post your requirement", text: "Product, quantity, delivery city and budget. Takes about two minutes." },
  { title: "Receive quotes", text: "Suppliers who deal in it send price, quantity and delivery time." },
  { title: "Compare and accept", text: "Accept the best quote. The others are declined for you automatically." },
];
const SUPPLIER = [
  { title: "Create your company profile", text: "Add your products, service areas and photos." },
  { title: "Find buyer requirements", text: "See what buyers in your trade need right now." },
  { title: "Send quotes, win orders", text: "Track every quote and see when a buyer accepts." },
];

function Steps({ title, steps, dark }) {
  return (
    <div className={`rounded-[20px] p-7 sm:p-9 ${dark ? "bg-neel-900 text-white" : "panel"}`}>
      <h3 className={`text-[22px] font-bold ${dark ? "text-white" : ""}`}>{title}</h3>
      <ol className="mt-6 space-y-6">
        {steps.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[40px_1fr] gap-4">
            <span
              className={`num grid h-10 w-10 place-items-center rounded-full font-display text-[17px] font-bold ${
                dark ? "bg-haldi-500 text-ink" : "bg-neel-50 text-neel-800"
              }`}
            >
              {i + 1}
            </span>
            <div>
              <div className="font-semibold">{s.title}</div>
              <p className={`mt-0.5 text-[14.5px] ${dark ? "text-white/65" : "text-muted"}`}>{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="container-page pt-20">
      <h2 className="text-[28px] font-bold">How it works</h2>
      <div className="mt-6 mb-6  grid gap-4 lg:grid-cols-2">
        <Steps title="If you're buying" steps={BUYER} />
        <Steps title="If you're selling" steps={SUPPLIER} dark />
      </div>
    </section>
  );
}
