import React, { useState, useEffect, useRef } from 'react';

import { Users, ArrowRight } from 'lucide-react';

import { Link } from 'react-router-dom';



// --- Data (Remains similar but tailored for carousel display) ---

interface Member {

  id: number;

  name: string;

  role: string;

  specialty: string; // Brief specialty for the carousel card

  image: string;

  accent: string; // For subtle highlights

}



const members: Member[] = [

  {

    id: 5,

    name: 'Abd Eljabar Bazzi',

    role: 'Cinematographer',

    specialty: 'Video Editing & VFX',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/457507784_500820326017618_7102724725175186626_n.jpg',

    accent: 'from-yellow-500 to-amber-500',

  },

  {

    id: 2,

    name: 'Ahmedtaha Abarrahou',

    role: 'Fullstack Developer',

    specialty: 'Web Development & Networking',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/496768521_18073677304893125_968731744148343907_n.jpg',

    accent: 'from-green-500 to-cyan-500',

  },

  {

    id: 9,

    name: 'Mustapha Nassoh', // Corrected typo

    role: 'Operations Manager',

    specialty: 'Photography & Logistics',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/502749732_18462993526073959_2326641292068939243_n.jpg',

    accent: 'from-indigo-500 to-purple-500',

  },

  

  {

    id: 3,

    name: 'Nabil El Bachiri',

    role: 'Revenue Manager',

    specialty: 'Asset Management & Logistics',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/503314148_18274044961282089_7110481306095049342_n.jpg',

    accent: 'from-red-500 to-orange-500',

  },

  {

    id: 8,

    name: 'Ayoub Sbaihi',

    role: 'Production Manager',

    specialty: 'Directing & Voice Acting',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/501451766_18016166447717339_1194100904261373844_n.jpg',

    accent: 'from-orange-500 to-red-500',

  },
  


  {

    id: 4,

    name: 'Mariam Mouzoul',

    role: 'Visual ART Director',

    specialty: 'AI Graphics & Motion Design',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/471996946_625250583496182_117283758802591691_n.jpg',

    accent: 'from-pink-500 to-rose-500',

  },

  {

    id: 12,

    name: 'Nassira Belgadi', // Corrected typo

    role: 'Human Resources Manager',

    specialty: 'Management & Recruitment',

    image: '',

    accent: 'from-pink-500 to-red-500',

  },

  {

    id: 1,

    name: 'Hamza Kadiri Elmaana',

    role: 'Project Developement',

    specialty: 'Marketing & Innovation',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/DSCF5573.JPG',

    accent: 'from-blue-500 to-purple-500',

  },

  {

    id: 6,

    name: 'Abderrazak Trajja',

    role: 'Communication & Relations Manager',

    specialty: 'Voice Acting & Audio Production',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/488085357_1017235940348722_2197642891228150759_n.jpg',

    accent: 'from-teal-500 to-green-500',

  },

  


  {

    id: 7,

    name: 'Patrick Simbaya',

    role: 'Front-End Developer',

    specialty: 'WordPress & UI/UX',

    image: 'https://d2ah09ed4k10ng.cloudfront.net/495801964_17949411053964094_6402716471549929582_n.jpg',

    accent: 'from-indigo-500 to-purple-500',

  },

  
  
  {

    id: 10,

    name: 'Ahmed SQALLI HOUSSAINI', // Corrected typo

    role: 'Data Analyst',

    specialty: 'Software Engineer, Backend/API Developer, Data Analyst',

    image: '',

    accent: 'from-blue-500 to-purple-500',

  },

  {

    id: 11,

    name: 'Anas Kabour', // Corrected typo

    role: 'Branding Specialist',

    specialty: 'Graphic Design & Brand Strategy',

    image: '',

    accent: 'from-red-500 to-yellow-500',

  },


  {

    id: 13,

    name: 'Tariq', // Corrected typo

    role: 'UCP Academy Coordinator',

    specialty: 'Non-profit & Educational Programs',

    image: '',

    accent: 'from-green-500 to-blue-500',

  },

  {

    id: 14,

    name: 'Keshida', // Corrected typo

    role: 'Development Partner',

    specialty: 'Framer & No-Code Solutions',

    image: '',

    accent: 'from-red-500 to-yellow-500',

  },

  {

    id: 15,

    name: 'Mouad Bouissel', // Corrected typo

    role: 'Development Partner',

    specialty: 'Framer & Full-Stack Development',

    image: '',

    accent: 'from-red-500 to-slate-500',

  },

];



// --- Main MembersSection Component ---

const MembersSection: React.FC = () => {

  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);



  // Auto-scroll logic (optional, can be removed if manual navigation is preferred)

  useEffect(() => {

    const interval = setInterval(() => {

      setCurrentIndex((prevIndex) => (prevIndex + 1) % members.length);

    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);

  }, []);



  // Scroll to current item when index changes

  useEffect(() => {

    if (carouselRef.current) {

      const carousel = carouselRef.current;

      const item = carousel.children[currentIndex] as HTMLElement;

      if(item) {

        const carouselCenter = carousel.offsetWidth / 2;

        const itemCenter = item.offsetLeft + item.offsetWidth / 2;

        carousel.scrollTo({

          left: itemCenter - carouselCenter,

          behavior: 'smooth',

        });

      }

    }

  }, [currentIndex]);



  return (

    <section className="bg-slate-900 text-white py-20 overflow-hidden relative">

      {/* Background Gradients for depth */}

      <div className="absolute inset-0 z-0 opacity-20">

        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>

        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>

      </div>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="text-center mb-16">

          <div className="inline-block bg-slate-800/50 rounded-full p-5 border border-slate-700 mb-6">

            <Users size={40} className="text-purple-400" />

          </div>

          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-white mb-4">

            Meet Our Creative Team

          </h2>

          <p className="text-lg text-slate-400 max-w-3xl mx-auto">

            The passionate professionals driving our innovative solutions. Get to know the faces behind our success.

          </p>

        </div>



        {/* Carousel Container */}

        <div className="relative">

          <div

            ref={carouselRef}

            className="flex space-x-4 md:space-x-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"

          >

            {members.map((member, index) => (

              <div

                key={member.id}

                className={`flex-shrink-0 w-[85%] sm:w-[45%] md:w-[30%] lg:w-[28%] snap-center

                  rounded-2xl overflow-hidden transform transition-all duration-500 ease-in-out

                  ${index === currentIndex ? 'scale-100 shadow-purple-500/30 shadow-xl' : 'scale-90 opacity-70'}

                `}

                onClick={() => setCurrentIndex(index)}

              >

                {/* --- CARD HEIGHT INCREASED --- */}

                <div className="relative w-full h-[500px] bg-slate-800 rounded-2xl border border-slate-700">

                  {/* Background Image */}

                  <img

                    src={member.image}

                    alt={member.name}

                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"

                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/600x800/1e293b/ffffff?text=UCP'; }}

                  />

                  {/* Gradient Overlay for text readability */}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent rounded-2xl flex flex-col justify-end p-6">

                    <h3 className="text-2xl font-bold text-white mb-1">{member.name}</h3>

                    <p className={`text-sm font-medium bg-gradient-to-r ${member.accent} bg-clip-text text-transparent mb-1`}>{member.role}</p>

                    <p className="text-xs text-slate-400 opacity-80">{member.specialty}</p>

                  </div>

                </div>

              </div>

            ))}

          </div>



          {/* Navigation Dots */}

          <div className="flex justify-center mt-12 gap-3">

            {members.map((_, index) => (

              <button

                key={index}

                className={`w-3 h-3 rounded-full transition-all duration-300

                  ${index === currentIndex ? 'bg-purple-500 w-5' : 'bg-slate-600 hover:bg-slate-500'}`}

                onClick={() => setCurrentIndex(index)}

                aria-label={`Go to slide ${index + 1}`}

              />

            ))}

          </div>

        </div>



        
       

      </div>

     

      {/* Custom styles for animations (can be moved to global CSS if preferred) */}

      <style>{`

        @keyframes blob {

          0%, 100% { transform: translate(0px, 0px) scale(1); }

          33% { transform: translate(30px, -50px) scale(1.1); }

          66% { transform: translate(-20px, 40px) scale(0.9); }

        }

        .animate-blob {

          animation: blob 7s infinite cubic-bezier(0.6, 0.01, 0.2, 1);

        }

        .animation-delay-2000 {

          animation-delay: 2s;

        }

        .scrollbar-hide {

          -ms-overflow-style: none; /* IE and Edge */

          scrollbar-width: none; /* Firefox */

        }

        .scrollbar-hide::-webkit-scrollbar {

          display: none; /* Chrome, Safari, Opera */

        }

      `}</style>

    </section>

  );

};



export default MembersSection;