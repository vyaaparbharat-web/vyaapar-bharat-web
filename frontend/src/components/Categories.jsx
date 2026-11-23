import { Link } from "react-router-dom";
import truckImg from "../assets/truck.avif";
import hosieryImg from "../assets/Hoisery.avif";
import tyreImg from "../assets/tyre.avif";
import transportImg from "../assets/transport.avif";
import clothesImg from "../assets/clothes.avif";
import garageImg from "../assets/garage.avif";
import electricalImg from "../assets/electrical.avif";
import fittingsImg from "../assets/fittings.avif";
import interiorImg from "../assets/interior.avif";

const CATEGORIES = [
  { name: "Transport", hi: "ट्रांसपोर्ट", image: transportImg },
  { name: "Trucks", hi: "ट्रक", image: truckImg },
  { name: "Tyres", hi: "टायर", image: tyreImg },
  { name: "Garage & repair", q: "Garage", hi: "गैराज", image: garageImg },
  { name: "Electricals", q: "Electrical", hi: "बिजली का सामान", image: electricalImg },
  { name: "Pipe fittings", q: "Fittings", hi: "फिटिंग्स", image: fittingsImg },
  { name: "Hosiery", hi: "होज़री", image: hosieryImg },
  { name: "Clothes", hi: "कपड़े", image: clothesImg },
  { name: "Interior", hi: "इंटीरियर", image: interiorImg },
];

export default function Categories() {
  return (
    <section className="container-page pt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold">Shop by trade</h2>
          <p className="mt-1 text-muted">The industries most of our buyers and suppliers work in.</p>
        </div>
        <Link to="/products" className="link hidden text-[14.5px] sm:inline">
          All products
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
        {CATEGORIES.map((c) => (
          <Link
            key={c.name}
            to={`/products?q=${encodeURIComponent(c.q || c.name)}`}
            className="group relative overflow-hidden rounded-[14px] bg-neel-950 lg:aspect-[3/4]"
          >
            <img src={c.image} alt="" loading="lazy" className="aspect-[4/3] h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100 lg:aspect-auto" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neel-950/90 to-transparent p-3 pt-10">
              <div className="font-display text-[15px] font-semibold leading-tight text-white">{c.name}</div>
              <div lang="hi" className="deva text-[12.5px] text-white/70">
                {c.hi}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
