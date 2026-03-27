import HeroSection from "../components/home/HeroSection";
import HowItWorks from "../components/home/HowItWorks";
import PrizePoolBanner from "../components/home/PrizePoolBanner";
import FeaturedCharity from "../components/home/FeaturedCharity";
import TrustStrip from "../components/home/TrustStrip";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <TrustStrip />
      <HowItWorks />
      <PrizePoolBanner />
      <FeaturedCharity />
    </div>
  );
}