import { Github, Instagram, Linkedin } from 'lucide-react';

export default function Card3D() {
  return (
    <div className="card">
      <div className="image-container">
        <img src="https://atharva7887.s3.us-east-1.amazonaws.com/images/me.jpg" alt="Atharva" className="card-image" />
      </div>
      
      <p className="heading">Atharva</p>
      <p>A Computer Engineer</p>
      
      <div className="social-icons">
        <a
          href="https://github.com/Atharva7887"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <Github size={20} />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <Instagram size={20} />
        </a>
        <a
          href="https://www.linkedin.com/in/atharvashirke18"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <Linkedin size={20} />
        </a>
      </div>
    </div>
  );
}