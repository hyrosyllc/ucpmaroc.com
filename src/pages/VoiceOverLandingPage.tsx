// src/pages/VoiceOverLandingPage.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, Heart, Users, Repeat, DollarSign, Play, Pause, RotateCcw, UserPlus, List, ArrowRight } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import { ActorCard, Actor } from '@/features/talent-marketplace';
import DemoPlayerRow, { Demo } from '@/components/DemoPlayerRow'; // --- ENHANCEMENT: Import new component
import QuotesCarousel from '@/components/QuotesCarousel';

// --- ENHANCEMENT: Import Shadcn components ---
import { buttonVariants } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// (Interface definitions are no longer needed here, as they are imported)
interface CurrentTrack {
  url: string;
  actor: {
    ActorName: string;
    HeadshotURL: string;
  }
}

// --- ENHANCEMENT: ActorCard component definition is REMOVED from here ---
// (It is now correctly imported from ../components/ActorCard)

// --- ENHANCEMENT: DemoPlayerRow component definition is REMOVED from here ---
// (It is now correctly imported from ../components/DemoPlayerRow)

// --- Main Page Component ---
const VoiceOverLandingPage = () => {
  // --- State for Data & Filtering ---
  const [actors, setActors] = useState<Actor[]>([]);
  const [filteredDemos, setFilteredDemos] = useState<Demo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [languageFilter, setLanguageFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [languages, setLanguages] = useState<string[]>([]);

  // --- Global Audio Player State ---
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const navigate = useNavigate();
  const genderOptions = ["Male", "Female"];
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'actors' | 'demos'>('actors');

  // --- Hardcoded Filter Options ---
  const languageOptions = ["Arabic", "English", "French", "Spanish"];
  const styleOptions = ["Warm", "Deep", "Conversational", "Corporate"];

  // --- Data Fetching Effect (Handles both views) ---
  useEffect(() => {
    const performSearch = async () => {
      const hasFilters = languageFilter !== 'all' || genderFilter !== 'all' || styleFilter !== 'all';
      setIsLoading(true);

      setActors([]);
      setFilteredDemos([]);

      if (viewMode === 'actors') {
        // --- ACTOR SEARCH LOGIC ---
      let actorQuery = supabase
          .from('actors')
          .select(`*, actor_followers(count), demo_likes(count)`)
          .eq('IsActive', true) // Admin check
          .eq('service_voiceover', true); // <-- ADD THIS: Actor's own toggle check

        if (languageFilter !== 'all') actorQuery = actorQuery.eq('Language', languageFilter);
        if (genderFilter !== 'all') actorQuery = actorQuery.eq('Gender', genderFilter);
        if (styleFilter !== 'all') actorQuery = actorQuery.like('Tags', `%${styleFilter}%`);

        const { data, error } = await actorQuery.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching actors:', error);
        } else {
          const typedData = data as Actor[] || [];
          setActors(typedData);
          if (!hasFilters) {
            const uniqueLanguages = [...new Set(typedData.map(actor => actor.Language))].filter(Boolean);
            setLanguages(uniqueLanguages);
          }
        }
      } else {
        // --- DEMO SEARCH LOGIC ---
        let demoQuery = supabase.from('demos').select('*, actors!inner(id, ActorName, slug, HeadshotURL, Gender)');
        
        if (languageFilter !== 'all') demoQuery = demoQuery.eq('language', languageFilter);
        if (styleFilter !== 'all') demoQuery = demoQuery.eq('style_tag', styleFilter);
        if (genderFilter !== 'all') demoQuery = demoQuery.eq('actors.Gender', genderFilter);

        const { data: demosResult, error: demosFetchError } = await demoQuery.order('created_at', { ascending: false });

        if (demosFetchError) {
          console.error("Error fetching filtered demos:", demosFetchError);
          setIsLoading(false);
          return;
        }

        const fetchedDemos = (demosResult as Demo[]) || [];
        const demoUrlsToCount = fetchedDemos.map(d => d.demo_url).filter(Boolean);

        // Fetch Likes
        let likesByURL: { [url: string]: number } = {};
        if (demoUrlsToCount.length > 0) {
          const { data: allLikesData, error: likesFetchError } = await supabase
            .from('demo_likes')
            .select('demo_url')
            .in('demo_url', demoUrlsToCount);
          if (likesFetchError) console.error("Error fetching demo likes:", likesFetchError);
          else {
            likesByURL = (allLikesData || []).reduce((acc, like) => {
              acc[like.demo_url] = (acc[like.demo_url] || 0) + 1;
              return acc;
            }, {} as { [url: string]: number });
          }
        }

        // Fetch User's Like Status
        let currentUserLikes: string[] = [];
        const { data: { user } } = await supabase.auth.getUser();
        if (user && demoUrlsToCount.length > 0) {
          const { data: userLikesResult, error: userLikesError } = await supabase
            .from('demo_likes')
            .select('demo_url')
            .eq('user_id', user.id)
            .in('demo_url', demoUrlsToCount);
          if (userLikesError) console.error("Error fetching user likes:", userLikesError);
          else if (userLikesResult) currentUserLikes = userLikesResult.map(l => l.demo_url);
        }
        setUserLikes(currentUserLikes);

        // Combine Demos with Like Counts
        const demosWithLikes = fetchedDemos.map(demo => ({
          ...demo,
          likes: likesByURL[demo.demo_url] || 0
        }));
        setFilteredDemos(demosWithLikes);
      }
      setIsLoading(false);
    };
    performSearch();
  }, [viewMode, languageFilter, genderFilter, styleFilter]);

  // --- Like/Unlike Logic ---
  const handleToggleLike = async (demo: Demo) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/client-auth');
      return;
    }

    const demoUrl = demo.demo_url;
    const isCurrentlyLiked = userLikes.includes(demoUrl);
    const actorId = demo.actors?.id;

    if (!actorId) {
      console.error("Cannot toggle like: Actor ID missing.");
      return;
    }

    if (isCurrentlyLiked) {
      // Unlike
      const { error } = await supabase.from('demo_likes').delete().match({ user_id: user.id, demo_url: demoUrl });
      if (error) {
        console.error("Error unliking demo:", error);
      } else {
        setUserLikes(prev => prev.filter(url => url !== demoUrl));
        setFilteredDemos(prevDemos => prevDemos.map(d =>
          d.demo_url === demoUrl ? { ...d, likes: (d.likes || 1) - 1 } : d
        ));
      }
    } else {
      // Like
      const { error } = await supabase.from('demo_likes').insert({ user_id: user.id, actor_id: actorId, demo_url: demoUrl });
      if (error) {
        console.error("Error liking demo:", error);
      } else {
        setUserLikes(prev => [...prev, demoUrl]);
        setFilteredDemos(prevDemos => prevDemos.map(d =>
          d.demo_url === demoUrl ? { ...d, likes: (d.likes || 0) + 1 } : d
        ));
      }
    }
  };

  // --- Audio Player Logic ---
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(console.error);
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrack]);

  const handlePlayPause = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSelectTrack = (item: Actor | Demo) => {
    const isActor = 'MainDemoURL' in item;
    const newTrackUrl = isActor ? item.MainDemoURL : item.demo_url;
    const actorInfo = isActor ? item : item.actors;

    if (currentTrack?.url === newTrackUrl) {
      handlePlayPause();
    } else {
      setCurrentTrack({ 
        url: newTrackUrl, 
        actor: { ActorName: actorInfo.ActorName, HeadshotURL: actorInfo.HeadshotURL } 
      });
      setIsPlaying(true);
    }
  };
  
  const handleResetFilters = () => {
    setLanguageFilter('all');
    setGenderFilter('all');
    setStyleFilter('all');
  };

  return (
    // --- ENHANCEMENT: Use simple 'bg-background' ---
    <div className="flex-grow pt-0 min-h-screen bg-background text-foreground ">
      
      {/* Hero Section */}
      {/* --- ENHANCEMENT: Removed blobs, using simple background and clean padding --- */}
      <section className="relative py-32 md:py-48 flex items-center justify-center text-center">
        <div className="relative z-10 px-4 max-w-6xl mx-auto">
          <div className="mb-8">
            {/*<div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6 shadow-lg">
              <Mic className="w-10 h-10 text-primary-foreground" />
            </div>
            
            {/* --- ENHANCEMENT: Simplified, high-contrast typography --- */}
            <h1 className="text-6xl md:text-8xl font-bold text-foreground mb-6 leading-tight">
              Connect Directly.
              <br />
              <span className="text-5xl md:text-7xl text-muted-foreground">Find Your Voice.</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              A platform connecting clients, creators, and professional voice actors.
              No middle-man, just pure talent.
            </p>
          </div>

          {/* --- ENHANCEMENT: Using Shadcn button variants for consistency --- */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a 
              href="#voices" 
              className={buttonVariants({ size: 'lg', className: "text-lg w-full sm:w-auto" })}
            >
              Browse Talent
              <ArrowRight size={20} className="ml-2" />
            </a>
            <Link 
              to="/actor-signup" 
              className={buttonVariants({ variant: 'secondary', size: 'lg', className: "text-lg w-full sm:w-auto" })}
            >
              <UserPlus size={20} className="mr-2" />
              Join the Roster
            </Link> 
          </div>
        </div>
      </section> 

      {/* --- ADD THIS NEW SECTION HERE --- */}
      <QuotesCarousel />
      {/* ------------------------------- */}



      {/* Join Section */}
      {/* --- ENHANCEMENT: Using 'bg-card/50' for a subtle contrast --- */}
      <section id="join" className="py-20 bg-card/50 border-y">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Join Our Platform</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Whether you're a voice actor looking to manage your own career or a client searching for the perfect voice, our platform empowers direct connection.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Talents */}
            <div className="bg-card p-8 rounded-lg border text-left transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
              <h3 className="text-2xl font-semibold text-foreground mb-3">For Talents</h3>
              <p className="text-muted-foreground mb-6">
                Showcase your portfolio, set your own rates, communicate directly with clients, and get paid directly.
              </p>
              <Link 
                to="/actor-signup" 
                className={buttonVariants({ variant: "link", className: "p-0 text-base text-primary" })}
              >
                Create Your Actor Profile <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
            {/* For Clients */}
            <div className="bg-card p-8 rounded-lg border text-left transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
              <h3 className="text-2xl font-semibold text-foreground mb-3">For Clients</h3>
              <p className="text-muted-foreground mb-6">
                Browse a diverse roster, filter by your needs, listen to demos, and collaborate directly with the talent you hire.
              </p>
              <Link 
                to="/client-auth" 
                className={buttonVariants({ variant: "link", className: "p-0 text-base text-primary" })}
              >
                Create a Client Account <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Finder Section */}
      <section id="voices" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Find Your <span className="text-primary">Voice</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Browse our roster or filter demos by language, gender, and style to find the perfect voice for your project.
            </p>
          </div>

          {/* View Mode Tabs (Already good) */}
          <div className="flex justify-center mb-8 gap-2 p-1 bg-card border rounded-lg max-w-xs mx-auto">
            <button
                onClick={() => setViewMode('actors')}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${
                    viewMode === 'actors' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                }`}
            >
                <Users size={16} /> Actors
            </button>
            <button
                onClick={() => setViewMode('demos')}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${
                    viewMode === 'demos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                }`}
            >
                <List size={16} /> Demos
            </button>
          </div>

          {/* --- ENHANCEMENT: Replaced filter buttons with Shadcn ToggleGroup --- */}
          <div className="flex flex-col gap-4 items-center justify-center mb-12">
            
            <ToggleGroup 
              type="single" 
              value={genderFilter} 
              onValueChange={(value) => setGenderFilter(value || 'all')}
              className="flex-wrap justify-center"
            >
              <ToggleGroupItem value="all" aria-label="All Genders">All Genders</ToggleGroupItem>
              {genderOptions.map(gen => (
                <ToggleGroupItem key={gen} value={gen} aria-label={gen}>{gen}</ToggleGroupItem>
              ))}
            </ToggleGroup>

            <ToggleGroup 
              type="single" 
              value={languageFilter} 
              onValueChange={(value) => setLanguageFilter(value || 'all')}
              className="flex-wrap justify-center"
            >
              <ToggleGroupItem value="all" aria-label="All Languages">All Languages</ToggleGroupItem>
              {languageOptions.map(lang => (
                <ToggleGroupItem key={lang} value={lang} aria-label={lang}>{lang}</ToggleGroupItem>
              ))}
            </ToggleGroup>
            
            <ToggleGroup 
              type="single" 
              value={styleFilter} 
              onValueChange={(value) => setStyleFilter(value || 'all')}
              className="flex-wrap justify-center"
            >
              <ToggleGroupItem value="all" aria-label="All Styles">All Styles</ToggleGroupItem>
              {styleOptions.map(style => (
                <ToggleGroupItem key={style} value={style} aria-label={style}>{style}</ToggleGroupItem>
              ))}
            </ToggleGroup>

            {(languageFilter !== 'all' || genderFilter !== 'all' || styleFilter !== 'all') && (
              <button 
                onClick={handleResetFilters} 
                className={buttonVariants({ variant: "ghost", className: "text-muted-foreground" })}
              >
                <RotateCcw size={16} className="mr-2" />
                Reset All Filters
              </button>
            )}
          </div>
          {/* --- END ENHANCEMENT --- */}

          {/* Results Grid / List */}
          <div>
            {isLoading ? (
              <p className="text-muted-foreground text-center">Loading...</p>
            ) : viewMode === 'actors' ? (
              // Actor Grid View
              actors.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {actors.map(actor => (
                    actor.slug && <ActorCard key={actor.id} actor={actor} onPlayClick={handleSelectTrack} isCurrentlyPlaying={isPlaying && currentTrack?.url === actor.MainDemoURL} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No actors found for your search criteria.</p>
              )
            ) : (
              // Demo List View
              <div className="max-w-3xl mx-auto space-y-4">
                {filteredDemos.length > 0 ? (
                  filteredDemos.map(demo => (
                    <DemoPlayerRow
                      key={demo.id}
                      demo={demo}
                      onPlayClick={handleSelectTrack}
                      isLiked={userLikes.includes(demo.demo_url)}
                      onToggleLike={handleToggleLike}
                      isCurrentlyPlaying={isPlaying && currentTrack?.url === demo.demo_url}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No demos found for your search criteria.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Support Section */}
      {/* --- ENHANCEMENT: Cleaned up styling, using bg-card/50 --- */}
      <section className="py-20 bg-card/50 border-t">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Support Our Platform</h2>
          <p className="text-lg text-muted-foreground mb-8">
            We're committed to keeping this platform free and commission-free.
            If you find this service valuable, please consider a donation to help us cover server costs and development.
          </p>
          {/* --- ENHANCEMENT: Using standard primary button --- */}
          <a
            href="https://donate.stripe.com/bJebIT61a9Lx2ax7OBebu08"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: 'lg', className: "text-lg bg-primary hover:bg-primary/90" })}
          >
            <Heart size={20} className="mr-2" />
            Donate to Keep Us Free
          </a>
        </div>
      </section>

      {/* Global Audio Player */}
      <GlobalAudioPlayer
        audioRef={audioRef}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        duration={duration}
        currentTime={currentTime}
      />
      <audio ref={audioRef} src={currentTrack?.url || ''} />
    </div>
  );
};

export default VoiceOverLandingPage;