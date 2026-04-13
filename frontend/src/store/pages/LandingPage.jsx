import HeroSection from '../components/landing/HeroSection';
import FeaturedProductsSection from '../components/landing/FeaturedProductsSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import AboutSection from '../components/landing/AboutSection';
import SocialBanner from '../components/landing/SocialBanner';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="bg-dark-bg min-h-screen text-dark-text">
      <HeroSection />
      <FeaturedProductsSection />
      <BenefitsSection />
      <AboutSection />
      <SocialBanner />
      <Footer />
    </div>
  );
}
