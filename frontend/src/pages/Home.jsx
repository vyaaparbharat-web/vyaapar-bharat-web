import Hero from "../components/Hero";
import SponsoredBanners from "../components/SponsoredBanners";
import Categories from "../components/Categories";
import PopularProducts from "../components/PopularProducts";
import FeaturedSuppliers from "../components/FeaturedSuppliers";
import TradeNetwork from "../components/TradeNetwork";
import HowItWorks from "../components/HowItWorks";
import PostRequirementCTA from "../components/PostRequirementCTA";

export default function Home() {
  return (
    <main>
      <Hero />
      <Categories />
      <SponsoredBanners />
      <PopularProducts />
      <FeaturedSuppliers />

      {/* 3D trade network – right below the suppliers section */}
      <div className="mt-16">
        <TradeNetwork />
      </div>

      <HowItWorks />
      <PostRequirementCTA />
    </main>
  );
}
