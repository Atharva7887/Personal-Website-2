import { ReactNode } from 'react';
import '../../styles/components/glowing-text.css';

interface GlowingTextProps {
  children: ReactNode;
  intensity?: 'normal' | 'strong' | 'low';
  color?: string;
  className?: string;
}

export default function GlowingText({ 
  children, 
  intensity = 'low',
  color = 'rgb(43, 223, 255)',
  className = ''
}: GlowingTextProps) {
  return (
    <span 
      className={`glowing-text ${intensity} ${className}`}
      style={{ '--glow-color': color } as React.CSSProperties}
    >
      {children}
    </span>
  );
}