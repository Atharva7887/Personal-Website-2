import { Github, Instagram, Linkedin } from "lucide-react";

export default function Card3D() {
  return (
    <div className="group relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
      <div className="card relative bg-black rounded-2xl overflow-hidden">
        <div className="image-container relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
          <img
            src="https://raw.githubusercontent.com/Atharva7887/Personal-Website-2/main/src/components/Images/me.jpg"
            alt="Atharva Shirke"
            className="card-image w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
          <div className="space-y-4">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                Atharva Shirke
              </h3>
              <p className="text-gray-300 text-lg">Computer Engineer & Developer</p>
            </div>
            
            <div className="flex gap-4">
              <a
                href="https://github.com/Atharva7887"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:rotate-12"
                aria-label="GitHub"
              >
                <Github size={20} className="text-white" />
              </a>
              <a
                href="https://instagram.com/a_t_h_a_r_v_a_1"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:rotate-12"
                aria-label="Instagram"
              >
                <Instagram size={20} className="text-white" />
              </a>
              <a
                href="https://www.linkedin.com/in/atharvashirke18"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-110 hover:rotate-12"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} className="text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-[2px]">
            <div className="h-full w-full rounded-2xl bg-black"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
        <img
          src="https://raw.githubusercontent.com/Atharva7887/Personal-Website-2/main/src/components/Images/me.jpg"
          alt="My Image is not visible because I have got n bill from AWS :("
          className="card-image"
        />
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
