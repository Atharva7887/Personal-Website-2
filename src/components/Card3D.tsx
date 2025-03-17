import { Github, Instagram, Linkedin } from "lucide-react";
import myImage from "./Images/me.jpg"; // Import the image

export default function Card3D() {
  return (
    <div className="card">
      <div className="image-container">
        <img src={myImage} alt="My Image 1" className="card-image" />
      </div>
    </div>
  );
}

      
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
          href="https://instagram.com/a_t_h_a_r_v_a_1"
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
