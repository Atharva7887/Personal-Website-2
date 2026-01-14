import { useEffect, useState } from 'react';
import '../styles/loading-screen.css';

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

export default function LoadingScreen({
  onLoadingComplete,
}: LoadingScreenProps) {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHidden(true);
      onLoadingComplete?.();
    }, 700); // 0.7 seconds

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  if (isHidden) return null;

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    </div>
  );
}
