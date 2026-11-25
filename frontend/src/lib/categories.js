import { assetUrl } from "./api";
import { useApi } from "./useApi";
import { REQUIREMENT_CATEGORIES } from "./constants";
import truckImg from "../assets/truck.avif";
import hosieryImg from "../assets/Hoisery.avif";
import tyreImg from "../assets/tyre.avif";
import transportImg from "../assets/transport.avif";
import garageImg from "../assets/garage.avif";
import electricalImg from "../assets/electrical.avif";
import fittingsImg from "../assets/fittings.avif";
import interiorImg from "../assets/interior.avif";
import clothesImg from "../assets/clothes.avif";

// Built-in pictures for the default categories, used until an admin uploads one
const BUILT_IN = {
  "transport-and-logistics": transportImg,
  "automobile-and-parts": garageImg,
  tyres: tyreImg,
  electrical: electricalImg,
  "hardware-and-fittings": fittingsImg,
  "textiles-and-hosiery": hosieryImg,
  "interior-and-furniture": interiorImg,
  "machinery-and-tools": truckImg,
  clothes: clothesImg,
};

export const categoryImage = (c) => (c?.image_url ? assetUrl(c.image_url) : BUILT_IN[c?.slug] || null);

export const categoryPath = (c) => `/categories/${c.slug}`;

// Category names for dropdowns. Falls back to the built-in list while loading or if the API fails.
export function useCategoryNames() {
  const { data } = useApi("/api/categories");
  const names = data?.categories?.map((c) => c.name);
  return names?.length ? names : REQUIREMENT_CATEGORIES;
}