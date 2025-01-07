
import Navbar from '../components/navigation/Navbar';
import BlogList from '../components/blog/BlogList';
import BlogSidebar from '../components/blog/BlogSidebar';
import Footer from '../components/Footer';
import { BlogBackground } from '../components/backgrounds/BlogBackground';

export default function Blog() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="relative pt-24 pb-20">
        <BlogBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <BlogList />
            </div>
            <div className="lg:col-span-4">
              <BlogSidebar/>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}