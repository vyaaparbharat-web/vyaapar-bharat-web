import Hero from "../components/Hero";
import SponsoredBanners from "../components/SponsoredBanners";
import Categories from "../components/Categories";
import PopularProducts from "../components/PopularProducts";
import FeaturedSuppliers from "../components/FeaturedSuppliers";
import HowItWorks from "../components/HowItWorks";
import PostRequirementCTA from "../components/PostRequirementCTA";
import TradeNetwork from "../components/TradeNetwork";
import { useSeo } from "../lib/seo";

export default function Home() {
  useSeo({
    path: "/",
    description:
      "Post your requirement free and get quotes from verified suppliers across India. Transporters, hosiery and garment manufacturers, tyre dealers, auto parts, wholesalers and more.",
  });
  return (
    // -mb-20 cancels the footer's top margin: the last home section is dark and full-width, so it sits right on the footer
    <main className="-mb-20">
      <Hero />
      <Categories />
      <SponsoredBanners />
      <PopularProducts />
      <FeaturedSuppliers />
      <HowItWorks />
      <TradeNetwork />
      <PostRequirementCTA />
    </main>
  );
}
