import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Zap, Globe, BookOpen, Sparkles, ArrowRight, 
  CheckCircle2, MessageSquare, CreditCard, Search, Mic, Users, Play, ScrollText, Heart
} from 'lucide-react';
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MembersSection from '../components/MembersSection'; 
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// --- SWIPER IMPORTS ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/pagination';

// --- 1. HOW IT WORKS (3D SWIPER) ---
const HowItWorksSection = () => {
  const steps = [
    {
      id: 1,
      title: "Browse Talent",
      desc: "Explore our curated marketplace. Filter by voice style, language, accent, or price range.",
      icon: Search,
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "Listen & Review",
      desc: "Play demos instantly. Check portfolios, reviews, and previous work to find your perfect match.",
      icon: Play,
      color: "bg-purple-500"
    },
    {
      id: 3,
      title: "Chat Directly",
      desc: "No middle-man. Message the talent, discuss requirements, and negotiate custom quotes.",
      icon: MessageSquare,
      color: "bg-pink-500"
    },
    {
      id: 4,
      title: "Secure Escrow",
      desc: "Fund the project securely. Money is only released to the talent when you approve the final delivery.",
      icon: ShieldCheck,
      color: "bg-green-500"
    },
    {
      id: 5,
      title: "Receive Files",
      desc: "Get high-quality files delivered directly to your dashboard. Need a revision? Just ask.",
      icon: Zap,
      color: "bg-yellow-500"
    }
  ];

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
       <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
       
       <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-slate-400 text-lg">Your path to professional production in 5 simple steps.</p>
          </div>

          <div className="flex justify-center">
            {/* SWIPER CARDS EFFECT */}
            <div className="w-full max-w-sm md:max-w-md h-[420px]">
              <Swiper
                effect={'cards'}
                grabCursor={true}
                modules={[EffectCards, Autoplay]}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                className="w-full h-full"
              >
                {steps.map((step, index) => (
                  <SwiperSlide key={step.id} className="rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
                     <div className="h-full flex flex-col p-8">
                        <div className="flex justify-between items-start mb-8">
                           <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg text-white`}>
                              <step.icon size={32} />
                           </div>
                           <span className="text-6xl font-black text-white/5">0{index + 1}</span>
                        </div>
                        
                        <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
                        <p className="text-slate-400 text-lg leading-relaxed">{step.desc}</p>

                        <div className="mt-auto pt-6 border-t border-white/5">
                           <div className="flex items-center gap-2 text-sm text-white/50">
                              <CheckCircle2 size={16} className={step.color.replace('bg-', 'text-')} />
                              Step {index + 1} of {steps.length}
                           </div>
                        </div>
                     </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
       </div>
    </section>
  );
};

// --- 2. P2P BENEFITS (BENTO GRID STYLE) ---
const BenefitsSection = () => {
  return (
    <section className="py-24 bg-background relative">
       <div className="container mx-auto px-4 max-w-7xl">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               
               {/* Main Feature */}
               <div className="md:col-span-2 bg-gradient-to-br from-primary/10 to-purple-500/5 rounded-3xl p-8 md:p-12 border border-primary/20 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] transition-all duration-1000 group-hover:bg-primary/20" />
                   <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-bold mb-6">
                          <Sparkles size={14} /> REVOLUTIONARY
                      </div>
                      <h3 className="text-3xl md:text-5xl font-bold mb-6">Direct P2P Connection</h3>
                      <p className="text-xl text-muted-foreground max-w-lg mb-8">
                          Stop paying agency fees. We connect you directly with the talent. 
                          You define the terms, you set the budget, you own the relationship.
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <li className="flex items-center gap-2 text-foreground font-medium"><CheckCircle2 className="text-green-500" /> No Middleman</li>
                          <li className="flex items-center gap-2 text-foreground font-medium"><CheckCircle2 className="text-green-500" /> Faster Communication</li>
                          <li className="flex items-center gap-2 text-foreground font-medium"><CheckCircle2 className="text-green-500" /> Transparent Pricing</li>
                          <li className="flex items-center gap-2 text-foreground font-medium"><CheckCircle2 className="text-green-500" /> 0% Commission</li>
                      </ul>
                   </div>
               </div>

               {/* Vertical Feature */}
               <div className="md:col-span-1 bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col justify-between hover:border-green-500/50 transition-colors">
                   <div>
                       <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-6">
                           <ShieldCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
                       </div>
                       <h3 className="text-2xl font-bold mb-4">Safe Escrow</h3>
                       <p className="text-muted-foreground">
                           We hold your payment safely. The talent only gets paid when you approve the work. 100% Risk-Free.
                       </p>
                   </div>
                   <div className="mt-8 bg-muted/50 rounded-xl p-4">
                       <div className="flex items-center justify-between text-sm mb-2">
                           <span>Payment Status</span>
                           <span className="text-green-500 font-bold">Secured</span>
                       </div>
                       <div className="h-2 w-full bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
                           <div className="h-full bg-green-500 w-[80%]"></div>
                       </div>
                   </div>
               </div>

               {/* Bottom Feature 1 */}
               <div className="bg-card rounded-3xl p-8 border border-border shadow-sm hover:border-blue-500/50 transition-colors">
                   <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                       <Globe className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                   </div>
                   <h3 className="text-xl font-bold mb-2">Global & Local</h3>
                   <p className="text-muted-foreground text-sm">
                       From Moroccan Darija to International English. Find the voice that speaks to your audience.
                   </p>
               </div>

               {/* Bottom Feature 2 */}
               <div className="md:col-span-2 bg-slate-900 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden flex items-center">
                   <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-purple-600/20 to-transparent" />
                   <div className="relative z-10 max-w-lg">
                       <h3 className="text-2xl md:text-3xl font-bold mb-4">Built for Creatives, By Creatives.</h3>
                       <p className="text-slate-300 mb-6">
                           We understand the hustle. That's why we built tools like the 
                           <span className="text-white font-bold"> Portfolio Builder</span> and 
                           <span className="text-white font-bold"> Instant Quote</span> calculator.
                       </p>
                       <Button variant="secondary" className="rounded-full" asChild>
                           <Link to="/actor-signup">Start Your Career</Link>
                       </Button>
                   </div>
               </div>

           </div>
       </div>
    </section>
  );
};

// --- 3. LEARN SECTION (Unchanged from previous, just ensuring it's included) ---
const LearnSection = () => (
    <section className="relative py-32 overflow-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 opacity-40">
            <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" 
                alt="Learning" 
                className="w-full h-full object-cover filter grayscale mix-blend-multiply"
            />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent" />

        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-bold tracking-widest uppercase mb-6 animate-pulse">
                    <BookOpen className="w-3 h-3" /> UCP Academy
                </div>
                <h2 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                    Learn. Create. <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Dominate.</span>
                </h2>
                <p className="text-xl text-slate-300 mb-8 max-w-lg leading-relaxed">
                    Join thousands of students learning Voice Over, Video Editing, and Scriptwriting from industry experts.
                </p>
                
                <div className="flex flex-wrap gap-4">
                     <Button size="lg" className="bg-white text-black hover:bg-neutral-200 text-lg h-14 px-8 rounded-full shadow-xl shadow-yellow-500/10" asChild>
                        <a href="https://www.ucpmaroc.com" target="_blank" rel="noopener noreferrer">
                            Coming Soon <ArrowRight className="ml-2 w-5 h-5" />
                        </a>
                    </Button>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-400 px-4">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500"/> Certified</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500"/> Expert Led</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
// --- 1. THE VINTAGE WHITE PAPER COMPONENT ---
const WhitePaperModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400 transition-all font-serif italic">
          <ScrollText className="mr-2 h-5 w-5" /> Read Our Vision
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#fdfbf7] text-black border-none shadow-2xl p-0 overflow-hidden">
        {/* Vintage Paper Texture styling */}
        <div className="relative p-8 md:p-12 max-h-[80vh] overflow-y-auto font-serif leading-relaxed">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
                <div className="text-center mb-8">
                    <p className="text-sm text-neutral-500 uppercase tracking-widest mb-2">The White Paper</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">United Creative People</h2>
                    <div className="h-1 w-20 bg-black mx-auto mt-4" />
                </div>

                <p className="text-center font-semibold text-lg">
                    "In the name of Allah, the Merciful, the All-Knowing."
                </p>

                <p>
                    <strong>UCPMAROC</strong> was born in Morocco with a singular purpose: to heal the rift between Education and Opportunity.
                </p>

                <p>
                    We watched as talented youth competed in a "race to the bottom" on global platforms, their skills undervalued and their efforts lost to high commissions and impersonal algorithms. We knew there had to be a better way.
                </p>

                <p>
                    Our philosophy is simple: <strong>Learn, Earn, Return.</strong>
                </p>

                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Learn:</strong> Through our Academy, we pass down knowledge.</li>
                    <li><strong>Earn:</strong> Through this Platform, we provide dignified work without the middleman.</li>
                    <li><strong>Return:</strong> As a Community, we give back, working collectively as one body.</li>
                </ul>

                <p>
                    This is not just a marketplace. It is an ecosystem designed to protect the Talent and serve the Client with honesty (Amana). 
                </p>
                
                <p>
                    We invite you to join us—not just as a user, but as a member of this movement.
                </p>

                <div className="mt-8 pt-8 border-t border-neutral-300 flex justify-between items-end">
                    <div>
                        <p className="font-bold text-lg font-signature">God Bless</p>
                        <p className="text-sm text-neutral-500">From UCPMAROC Family</p>
                    </div>
                    <div className="text-right">
                         <img src="/path-to-stamp.png" alt="" className="w-16 h-16 opacity-20 hidden" /> 
                         {/* Placeholder for a stamp image if you have one */}
                         <span className="text-xs text-neutral-400">Est. Morocco</span>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- 2. HERO SECTION ---
const HeroSection = () => {
    return (
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden pt-20 ">
         {/* Abstract Background */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay pointer-events-none"></div>
         
         {/* Animated Blobs */}
         <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
         <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />

         <div className="relative z-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default shadow-lg">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-foreground/80">Learn. Earn. Return.</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-[1.05]">
               United Creative <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">People.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-light">
               An ecosystem born in Morocco to connect top talent directly with clients. 
               No commissions. No middlemen. Just pure, protected collaboration.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               {/* The White Paper Trigger */}
               <WhitePaperModal />
            </div>
         </div>
      </section>
    );
};


// --- 4. THE TRINITY (ECOSYSTEM) ---
const EcosystemSection = () => {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-7xl relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Our Ecosystem</h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        We are building more than just a freelance site. We are building a future.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* 1. LEARN */}
                    <div className="group relative p-8 rounded-3xl border border-white/10 bg-slate-900 overflow-hidden hover:border-yellow-500/50 transition-colors duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-[50px] transition-all group-hover:bg-yellow-500/20" />
                        <BookOpen className="w-12 h-12 text-yellow-400 mb-6" />
                        <h3 className="text-3xl font-black text-white mb-4">LEARN</h3>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Access world-class training in Voice Over, Video Editing, and Scriptwriting through our dedicated Academy.
                        </p>
                        <Button variant="link" className="text-yellow-400 p-0 text-lg group-hover:translate-x-2 transition-transform" asChild>
                            <a href="https://www.ucpmaroc.com" target="_blank" rel="noopener noreferrer">
                                Coming Soon <ArrowRight className="ml-2 w-5 h-5" />
                            </a>
                        </Button>
                    </div>

                    {/* 2. EARN */}
                    <div className="group relative p-8 rounded-3xl border border-white/10 bg-slate-900 overflow-hidden hover:border-blue-500/50 transition-colors duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] transition-all group-hover:bg-blue-500/20" />
                        <CreditCard className="w-12 h-12 text-blue-400 mb-6" />
                        <h3 className="text-3xl font-black text-white mb-4">EARN</h3>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Showcase your portfolio, get booked directly by clients, and keep 100% of your earnings. No hidden fees.
                        </p>
                        <Button variant="link" className="text-blue-400 p-0 text-lg group-hover:translate-x-2 transition-transform" asChild>
                            <Link to="/market">
                                Find Work / Talent <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                        </Button>
                    </div>

                    {/* 3. RETURN */}
                    <div className="group relative p-8 rounded-3xl border border-white/10 bg-slate-900 overflow-hidden hover:border-green-500/50 transition-colors duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] transition-all group-hover:bg-green-500/20" />
                        <Users className="w-12 h-12 text-green-400 mb-6" />
                        <h3 className="text-3xl font-black text-white mb-4">RETURN</h3>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Join a community that supports each other. We work collectively to solve problems and create opportunity.
                        </p>
                        <Button variant="link" className="text-green-400 p-0 text-lg group-hover:translate-x-2 transition-transform" asChild>
                            <a href="#community">
                                Join Community <ArrowRight className="ml-2 w-5 h-5" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- 5. COMMUNITY & JOIN SECTION ---
const CommunitySection = () => {
    return (
        <section id="community" className="py-32 px-4 bg-neutral-950 relative overflow-hidden text-center">
             {/* Background */}
             <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none" />
             
             <div className="max-w-4xl mx-auto relative z-10">
                <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-full border border-white/10 mb-8">
                    <Heart className="w-6 h-6 text-red-500 fill-current animate-pulse" />
                </div>
                
                <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight text-white">
                    Be Part of the Movement.
                </h2>
                
                <p className="text-xl text-slate-300 mb-12 leading-relaxed">
                    We have a growing community of 40+ Talents and 20+ Agency Leaders working together. 
                    If you have a skill and a passion to grow, we want you with us.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
                    <Button size="lg" className="h-16 text-lg rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-green-900/20" asChild>
                        <a href="https://docs.google.com/forms/d/e/1FAIpQLScXW7SF4E8JHPlZaF8gPRQ8gbsOfkB4_s--L46e5SY09qP_Gw/viewform?usp=header" target="_blank" rel="noreferrer">
                            <MessageSquare className="mr-2 w-5 h-5" /> Apply to Join (WhatsApp)
                        </a>
                    </Button>
                     <Button size="lg" variant="outline" className="h-16 text-lg rounded-xl border-white/10 hover:bg-white/5 text-foreground" asChild>
                        <Link to="/contact">
                            Contact Us
                        </Link>
                    </Button>
                </div>
                
                <div className="mt-12 flex justify-center gap-8 opacity-60">
                    <a href="https://instagram.com/ucpmaroc" target="_blank" rel="noreferrer" className="hover:text-purple-400 hover:scale-110 transition-all">@ucpmaroc</a>
                    <a href="https://instagram.com/ucpacademy" target="_blank" rel="noreferrer" className="hover:text-yellow-400 hover:scale-110 transition-all">@ucpacademy</a>
                </div>
             </div>
        </section>
    );
};

// --- MAIN PAGE ---
const HomePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 1. Cinematic Hero with White Paper */}
      <HeroSection />

      {/* 3. The Three Pillars (Learn, Earn, Return) */}
      <EcosystemSection />

      
            {/* --- TEAM CAROUSEL --- */}
      <MembersSection />


      {/* --- HERO --- */}
      <section className="relative h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden">
         {/* Abstract Background */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay pointer-events-none"></div>
         
         {/* Animated Blobs */}
         <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
         <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />

         <div className="relative z-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 hover:bg-white/10 transition-colors cursor-default shadow-lg">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-foreground/80">The #1 Creative Marketplace in Morocco</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[1.05]">
               Creativity <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-blue-400">Unleashed.</span>
            </h1>
            
            <p className="text-xl md:text-3xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-light">
               Connect directly with top-tier Voice Actors, Scriptwriters, and Video Editors. <strong className="text-foreground font-medium">No commissions. Just pure talent.</strong>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Button size="lg" className="h-16 px-10 text-xl rounded-full shadow-2xl shadow-primary/30 hover:scale-105 transition-transform" asChild>
                  <Link to="/market">Browse Talent</Link>
               </Button>
               <Button size="lg" variant="outline" className="h-16 px-10 text-xl rounded-full bg-transparent border-2 hover:bg-white/5 hover:text-white" asChild>
                  <Link to="/actor-signup">Join as Talent</Link>
               </Button>
            </div>
         </div>
      </section>


      {/* --- NEW: BENEFITS BENTO GRID --- */}
      <BenefitsSection />

      {/* --- NEW: HOW IT WORKS (3D SLIDER) --- */}
      <HowItWorksSection />



      {/* --- FINAL CTA --- */}
      <section className="py-40 px-4 text-center bg-background relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
         <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tight">Ready to Create?</h2>
            <p className="text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
               Find the perfect voice, script, or edit for your next big idea today.
            </p>
               <Button size="lg" className="h-16 px-10 text-xl rounded-full shadow-2xl shadow-primary/30 hover:scale-105 transition-transform" asChild>
                  <Link to="/market">Explore the Marketplace <ArrowRight className="ml-3 w-8 h-8" /></Link>
            </Button>
         </div>
      </section>

            {/* --- ACADEMY --- */}
      <LearnSection />



      {/* 5. Join the Community */}
      <CommunitySection />

    </div>
  );
};

export default HomePage;