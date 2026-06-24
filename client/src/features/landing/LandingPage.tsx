import HeroSection from "./components/HeroSection";
import ShopByCategory from "./components/ShopByCategory";
import FeaturedProducts from "./components/FeaturedProducts";
import CustomLabPromo from "./components/CustomLabPromo";
import BrandFeatures from "./components/BrandFeatures";
import NewsletterSection from "./components/NewsletterSection";
import { getSetting } from "@/lib/api/settings";

export default async function LandingPage() {
  const [videoUrl, posterUrl] = await Promise.all([
    getSetting("hero_video_url"),
    getSetting("hero_poster_url"),
  ]);

  return (
    <main>
      <HeroSection
        videoUrl={videoUrl ?? "/hero.mp4"}
        posterUrl={posterUrl ?? "/hero-poster.jpg"}
      />
      <BrandFeatures />
      <ShopByCategory />
      <FeaturedProducts />
      <CustomLabPromo />
      <NewsletterSection />
    </main>
  );
}
