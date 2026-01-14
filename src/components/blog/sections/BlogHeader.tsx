import SlideInSection from '../animations/SlideInSection';
import SearchBar from '../SearchBar';

interface BlogHeaderProps {
  searchQuery: string;
  onQueryChange: (query: string) => void;
}

export default function BlogHeader({ searchQuery, onQueryChange }: BlogHeaderProps) {
  return (
    <div className="mb-12">
      <SlideInSection delay={0.2}>
        <h1 className="text-4xl font-bold font-playfair mb-4 text-center">
          Latest Blog Posts
        </h1>
      </SlideInSection>
      
      <SlideInSection delay={0.4}>
        <p className="text-xl text-gray-300 text-center mb-8">
          Exploring ideas, sharing knowledge, and documenting the journey
        </p>
      </SlideInSection>

      <SlideInSection delay={0.6}>
        <SearchBar query={searchQuery} onQueryChange={onQueryChange} />
      </SlideInSection>
    </div>
  );
}