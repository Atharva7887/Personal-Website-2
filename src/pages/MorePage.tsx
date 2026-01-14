import { useState } from 'react';
import CertificationsSection from '../components/more-page/sections/CertificationsSection';
import LanguagesSection from '../components/more-page/sections/LanguagesSection';
import ActivitiesSection from '../components/more-page/sections/ActivitiesSection';
import EducationSection from '../components/more-page/sections/EducationSection';
import MorePageFooter from '../components/more-page/MorePageFooter';
import LoadingScreen from '../components/LoadingScreen';

export default function MorePage() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />}
      <div className="min-h-screen gradient-bg">
        {/* Navigation */}
        <nav className="bg-black/20 backdrop-blur-md fixed w-full z-50 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a
                href="index.html"
                className="text-xl font-bold hover:text-purple-400 transition-colors"
              >
                Atharva Shirke
              </a>
              <div className="flex space-x-8">
                <a
                  href="index.html"
                  className="hover:text-purple-400 transition-colors"
                >
                  Home
                </a>
                <a
                  href="index2.html"
                  className="hover:text-purple-400 transition-colors"
                >
                  Blog
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <EducationSection />
          <CertificationsSection />
          <LanguagesSection />
          <ActivitiesSection />
        </main>

        <MorePageFooter />
      </div>
    </>
  );
}