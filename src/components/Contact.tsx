import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { ContactBackground } from './backgrounds/ContactBackground';
import GlitchButton from './ui/GlitchButton';

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
      'https://atharva7887.s3.us-east-1.amazonaws.com/Atharva+Resume.pdf',
      '_blank'
    );
  };

  return (
    <section id="contact" className="relative min-h-screen">
      <ContactBackground />
      <div className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Download CV Button */}
        <div className="flex justify-center mb-16">
          <GlitchButton 
            text="DOWNLOAD CV"
            onClick={handleDownloadCV} 
            data-text="DOWNLOAD CV"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold font-playfair mb-4">
              Contact Me
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Let's discuss your project
            </p>

            <div className="space-y-6">
              <a
                href="mailto:athshirke2002@gmail.com"
                className="flex items-center gap-4 group hover:scale-105 transition-transform"
              >
                <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-purple-400 transition-colors">
                    Email
                  </p>
                  <p className="text-gray-400 group-hover:text-gray-200 transition-colors">
                    athshirke2002@gmail.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+917887333939"
                className="flex items-center gap-4 group hover:scale-105 transition-transform"
              >
                <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-purple-400 transition-colors">
                    Phone
                  </p>
                  <p className="text-gray-400 group-hover:text-gray-200 transition-colors">
                    +91 7887333939
                  </p>
                </div>
              </a>

              <a
                    href="https://maps.app.goo.gl/ayiTJ7q28CsYpzow9"
                    className="text-gray-400 group-hover:text-gray-200 transition-colors"
              >
              <div className="flex items-center gap-4 group hover:scale-105 transition-transform">
                <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-purple-400 transition-colors">
                    Location
                  </p>
                  
                    Kohinoor Jeeva, Mahesh Society, Bibwewadi, Pune,
                    Maharashtra, India
                  
                </div>
              </div>
              </a>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-black/30 backdrop-blur-sm p-8 rounded-lg"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Your Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Your Email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
                placeholder="Your Message"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Send Message
            </button>

            {status && (
              <p className="text-center text-sm mt-4 text-white">{status}</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
