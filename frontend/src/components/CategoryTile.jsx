import { Link } from "react-router-dom";
import { categoryImage, categoryPath } from "../lib/categories";

// Picture tile for a category (home page and /categories)
export default function CategoryTile({ category, showCount = false, tall = false }) {
  const img = categoryImage(category);
  return (
    <Link
      to={categoryPath(category)}
      className={`group relative block overflow-hidden rounded-[14px] bg-neel-950 ${tall ? "lg:aspect-[3/4]" : ""}`}
    >
      {img ? (
        <img
          src={img}
          alt=""
          loading="lazy"
          className={`aspect-[4/3] h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100 ${tall ? "lg:aspect-auto" : ""}`}
        />
      ) : (
        // No picture yet: big first letter on the brand blue
        <div className={`grid aspect-[4/3] h-full w-full place-items-center bg-gradient-to-br from-neel-800 to-neel-950 ${tall ? "lg:aspect-auto" : ""}`}>
          <span className="font-display text-[56px] font-bold text-white/15 transition-colors group-hover:text-haldi-500/40">{category.name.charAt(0)}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neel-950/95 via-neel-950/60 to-transparent p-3 pt-10">
        <div className="font-display text-[15px] font-semibold leading-tight text-white">{category.name}</div>
        {category.name_hi && (
          <div lang="hi" className="deva text-[12.5px] text-white/70">
            {category.name_hi}
          </div>
        )}
        {showCount && (
          <div className="num mt-1 text-[12px] text-haldi-500">
            {category.product_count ? `${category.product_count} ${category.product_count === 1 ? "product" : "products"}` : "No products yet"}
          </div>
        )}
      </div>
    </Link>
  );
}