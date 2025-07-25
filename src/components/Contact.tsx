import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Download } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { ContactBackground } from './backgrounds/ContactBackground';
import FadeInSection from './animations/FadeInSection';

type FormData = {
  name: string;
  email: string;
  message: string;
};

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    emailjs
      .send(
        'service_atharva',
        'template_6nc60jn',
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
        },
        'W1Ma7_c5aDjfy0Roo'
      )
      .finally(() => {
        setIsSubmitting(false);
      });
      .then(
        (result) => {
          console.log(result.text);
          setStatus('Message sent successfully!');
          setFormData({ name: '', email: '', message: '' });
        },
        (error) => {
          console.log(error.text);
          setStatus('Failed to send the message. Please try again.');
        }
      );
  };

  const handleDownloadCV = () => {
    window.open(
      'https://drive.google.com/file/d/1P9j5x6qnG5g7NCNM7ZNqf2di71ZJn0hd/view?usp=drive_link',
      '_blank'
    );
  };

  return (
    <section id="contact" className="relative min-h-screen">
      <ContactBackground />
      <div className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeInSection delay={0.2}>
          <div className="text-center mb-20">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold text-purple-400 tracking-wider uppercase">Get In Touch</span>
            </div>
            <h2 className="text-5xl sm:text-7xl font-bold font-playfair mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Let's Work Together
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-6"></div>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Ready to bring your ideas to life? Let's discuss your project and create something amazing together.
            </p>
            
            {/* Download CV Button */}
            <button
              onClick={handleDownloadCV}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
            >
              <Download size={20} className="group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Download Resume</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </FadeInSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <FadeInSection delay={0.4}>
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-white">Contact Information</h3>
                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                  I'm always excited to work on new projects and collaborate with amazing people. 
                  Feel free to reach out through any of the channels below.
                </p>
              </div>

              <div className="space-y-6">
                {/* Email */}
                <a
                  href="mailto:athshirke2002@gmail.com"
                  className="group flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                      Email
                    </p>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      athshirke2002@gmail.com
                    </p>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href="tel:+917887333939"
                  className="group flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-300">
                      Phone
                    </p>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      +91 7887333939
                    </p>
                  </div>
                </a>

                {/* Location */}
                <a
                  href="https://maps.app.goo.gl/ayiTJ7q28CsYpzow9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-emerald-400 group-hover:bg-clip-text transition-all duration-300">
                      Location
                    </p>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Pune, Maharashtra, India
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.6}>
            <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-800">
              <h3 className="text-2xl font-bold mb-6 text-white">Send a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-black/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-400"
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-black/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-white placeholder-gray-400"
                    placeholder="Your Email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-300">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-6 py-4 bg-black/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent h-40 resize-none transition-all duration-300 text-white placeholder-gray-400"
                    placeholder="Tell me about your project..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                      <span className="relative z-10">Send Message</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {status && (
                  <div className={`p-4 rounded-xl text-center font-medium ${
                    status.includes('successfully') 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {status}
                  </div>
                )}
              </form>
            </div>
          </FadeInSection>
        </div>
      </div>
    </section>
  );
}
