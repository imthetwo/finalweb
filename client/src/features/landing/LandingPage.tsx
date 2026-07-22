import HeroSection from "./components/HeroSection";
import ShopByCategory from "./components/ShopByCategory";
import FeaturedProducts from "./components/FeaturedProducts";
import CustomLabPromo from "./components/CustomLabPromo";
import TrackOrderPromo from "./components/TrackOrderPromo";
import BrandFeatures from "./components/BrandFeatures";
import NewsletterSection from "./components/NewsletterSection";
import { HERO_VIDEO_URL, HERO_POSTER_URL } from "@/lib/cloudinary";

export default function LandingPage() {
  return (
    <main>
      <HeroSection videoUrl={HERO_VIDEO_URL} posterUrl={HERO_POSTER_URL} />
      <BrandFeatures />
      <ShopByCategory />
      <FeaturedProducts />
      <CustomLabPromo />
      <TrackOrderPromo />
      <NewsletterSection />
    </main>
  );
}
