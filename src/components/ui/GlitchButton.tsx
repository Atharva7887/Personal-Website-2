import { ButtonHTMLAttributes } from 'react';
import '../../styles/components/glitch-button.css';

interface GlitchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
}

export default function GlitchButton({ text, ...props }: GlitchButtonProps) {
  return (
    <button className="glitch-button" {...props}>
      {text}
    </button>
  );
}