import React from 'react';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin, ChevronUp, ExternalLink, Globe, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Data (Moved outside component for clarity) ---

const socialLinks = [
  { icon: Linkedin, href: "https://www.linkedin.com/in/hamza-ea/", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/ucpmaroc", label: "Instagram" },
  { icon: Facebook, href: "https://facebook.com/ucpmaroc", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com/ucpmaroc", label: "Twitter" },
];

const services = [
  { text: "Digital Marketing", href: "/digital-marketing" },
  { text: "Web Development", href: "/software-development" },
  { text: "Videography", href: "/cinema-portfolio" },
  { text: "Voice Over", href: "/voiceover" },
];

const legalLinks = [
  { text: "Privacy Policy", href: "/privacy-policy" },
  { text: "Terms of Service", href: "/terms-of-service" },
  { text: "Contact Us", href: "/contact" },
];

// --- Reusable Sub-components ---

const FooterLink = ({ href, text }: { href: string, text: string }) => (
  <li>
    <Link to={href} className="text-muted-foreground hover:text-purple-400 hover:translate-x-1 transition-all duration-300 block">
      {text}
    </Link>
  </li>
);

const ContactInfo = ({ icon: Icon, text }: { icon: React.ElementType, text: string }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
    <span className="text-muted-foreground">{text}</span>
  </div>
);

// --- Main Footer Component ---

const Footer = () => {
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // --- NEW: Function to clear the Google Translate cookie ---
  const handleResetTranslation = () => {
    // This sets the cookie's expiration date to the past, deleting it
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
    // Reload the page to see the change
    window.location.reload();
  };
  // --- END NEW Function ---

  return (
    <footer className="dark relative bg-zinc-950 text-zinc-300 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Company Info Column */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <img 
              src="https://pub-c6d2173b02a643659ef133753f7ee574.r2.dev/identity/ucp%20logo%20t%20b%20(7).png" 
              alt="UCPMAROC Logo" 
              className="h-10 w-auto mb-4"
            />
            <p className="text-muted-foreground leading-relaxed text-sm max-w-xs">
              Your partner in digital growth. We leverage AI-powered strategies to deliver exceptional ROI for businesses of all sizes.
            </p>
            <div className="flex space-x-2 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2 bg-white/5 rounded-full hover:bg-purple-600/20 text-zinc-400 hover:text-purple-400 transition-colors"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Services Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-50">Services</h3>
            <ul className="space-y-2">
              {services.map(link => <FooterLink key={link.text} {...link} />)}
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-50">Company</h3>
            <ul className="space-y-2">
              {legalLinks.map(link => <FooterLink key={link.text} {...link} />)}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-50">Contact Us</h3>
            <div className="space-y-3">
              <ContactInfo icon={Phone} text="+1 (209) 442-6729" />
              <ContactInfo icon={Mail} text="Support@ucpmaroc.com" />
              <ContactInfo icon={MapPin} text="30 N Gould St Ste R Sheridan, WY 82801, US" />
            </div>
          </div>
        </div>

{/* --- MODIFIED: Google Translate Widget --- */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-zinc-50 flex items-center gap-2">
                <Globe size={20} /> Translate
             </h3>
             {/* NEW: Reset Button */}
             <button 
                onClick={handleResetTranslation} 
                className="text-xs text-muted-foreground hover:text-accent-foreground inline-flex items-center gap-1 transition-colors"
             >
                <RefreshCw size={14} /> Reset to English
             </button>
          </div>
          {/* This is the original, hidden widget */}
          <div id="google_translate_element"></div>
        </div>
        {/* --- END Google Translate Widget --- */}
        
        {/* Bottom Section */}
        <div className="  pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} UCPMAROC (Operated by HYROSY LLC). All rights reserved.
          </p>
          <span className="text-slate-500 text-sm">Made with ❤️ for digital growth</span>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-purple-600 hover:bg-purple-500 rounded-full shadow-lg shadow-purple-500/25 flex items-center justify-center transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 z-50"
          aria-label="Back to top"
        >
          <ChevronUp size={24} className="text-white" />
        </button>
      )}
    </footer>
  );
};

export default Footer;
