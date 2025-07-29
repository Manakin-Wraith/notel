import React from 'react';
import Header from './Header.tsx';
import HeroSection from './HeroSection.tsx';
import FeatureShowcase from './FeatureShowcase.tsx';
import BenefitsSection from './BenefitsSection.tsx';
import CTASection from './CTASection.tsx';
import Footer from './Footer.tsx';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main>
        <HeroSection />
        <FeatureShowcase />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
