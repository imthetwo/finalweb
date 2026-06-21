import HeroSection from "./components/HeroSection";
import ShopByCategory from "./components/ShopByCategory";
import FeaturedProducts from "./components/FeaturedProducts";
import CustomLabPromo from "./components/CustomLabPromo";
import BrandFeatures from "./components/BrandFeatures";
import NewsletterSection from "./components/NewsletterSection";

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <BrandFeatures />
      <ShopByCategory />
      <FeaturedProducts />
      <CustomLabPromo />
      <NewsletterSection />
    </main>
  );
}
