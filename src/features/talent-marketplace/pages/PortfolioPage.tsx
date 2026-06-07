import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  Demo as DemoInterface, 
  VideoDemoCard, 
  ScriptDemoCard 
} from '@/components/DemoCards';
import { TalentCard } from '@/features/talent-marketplace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import DemoPlayerRow from '@/components/DemoPlayerRow'; 
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import { Mic, Video, FileText, Users, SearchX } from 'lucide-react';

interface Actor {
  slug: string;
  HeadshotURL: string | null;
  ActorName: string;
  bio: string | null;
  service_scriptwriting: boolean;
  service_videoediting: boolean;
  service_voiceover: boolean;
}

interface CurrentTrack {
  url: string;
  actor: {
    ActorName: string;
    HeadshotURL: string;
  }
}

const PortfolioPage: React.FC = () => {
  const [allDemos, setAllDemos] = useState<DemoInterface[]>([]);
  const [filteredDemos, setFilteredDemos] = useState<DemoInterface[]>([]);
  const [allActors, setAllActors] = useState<Actor[]>([]);
  
  const [currentFilter, setCurrentFilter] = useState<'all' | 'audio' | 'video' | 'script'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [userLikes, setUserLikes] = useState<string[]>([]);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      
      // Fetch Demos
      const { data: demoData, error: demoError } = await supabase.rpc('get_all_demos');
      
      // Fetch Actors
      const { data: actorData, error: actorError } = await supabase
        .from('actors')
        .select(`
          slug, HeadshotURL, ActorName, bio, service_scriptwriting, service_videoediting, service_voiceover, IsActive
        `)
        .eq('IsActive', true);

      if (demoError || actorError) {
        console.error("Error fetching data:", demoError, actorError);
        setError("Could not load content. Please try again later.");
      } else {
        // 1. Process Actors
        const actors = actorData.map((actor: any) => ({
          ...actor,
          service_voiceover: actor.service_voiceover ?? true 
        })) as Actor[];
        
        const activeActors = actors.filter(actor => 
            actor.service_voiceover || actor.service_scriptwriting || actor.service_videoediting
        );
        setAllActors(activeActors);

        // 2. Filter Demos
        const validDemos = (demoData as DemoInterface[]).filter(demo => {
            const actor = actors.find(a => a.slug === demo.actor_slug); 
            if (!actor) return false; 

            if (demo.demo_type === 'audio' && !actor.service_voiceover) return false;
            if (demo.demo_type === 'video' && !actor.service_videoediting) return false;
            if (demo.demo_type === 'script' && !actor.service_scriptwriting) return false;
            return true;
        });

        // 3. Fetch and Merge Like Counts
        const demoUrls = validDemos.map(d => d.demo_url).filter(Boolean) as string[];
        let likesByURL: { [url: string]: number } = {};
        
        if (demoUrls.length > 0) {
            const { data: allLikesData } = await supabase
                .from('demo_likes')
                .select('demo_url')
                .in('demo_url', demoUrls);
            
            if (allLikesData) {
                likesByURL = allLikesData.reduce((acc: any, like: any) => {
                    acc[like.demo_url] = (acc[like.demo_url] || 0) + 1;
                    return acc;
                }, {});
            }
        }

        const demosWithLikes = validDemos.map(d => ({
            ...d,
            likes: d.demo_url ? (likesByURL[d.demo_url] || 0) : 0
        }));
        
        setAllDemos(demosWithLikes);
        
        // Initialize filteredDemos immediately
        if (currentFilter !== 'all') {
             setFilteredDemos(demosWithLikes.filter(demo => demo.demo_type === currentFilter));
        } else {
            // Use empty array for 'all' tab if that's the intended behavior (shows actors, not demos)
            setFilteredDemos([]);
        }

        // 4. Fetch User Likes
        const { data: { user } } = await supabase.auth.getUser();
        if (user && demoUrls.length > 0) {
            const { data: userLikesData } = await supabase
                .from('demo_likes')
                .select('demo_url')
                .eq('user_id', user.id)
                .in('demo_url', demoUrls);
                
            if (userLikesData) {
                setUserLikes(userLikesData.map(l => l.demo_url));
            }
        }
      }
      setIsLoading(false);
    };

    fetchAllData();
  }, []);

  // Filter Effect
  useEffect(() => {
    if (currentFilter === 'all') {
      setFilteredDemos([]); 
    } else {
      setFilteredDemos(allDemos.filter(demo => demo.demo_type === currentFilter));
    }
  }, [currentFilter, allDemos]);


  // --- Audio Player Handlers ---
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
    if (isPlaying) audioRef.current?.play().catch(console.error);
    else audioRef.current?.pause();
  }, [isPlaying, currentTrack]);

  const handlePlayClick = (demo: any) => { 
    if (!demo.demo_url) return;

    const actorName = demo.actors?.ActorName || demo.actor_name;
    const headshot = demo.actors?.HeadshotURL || demo.actor_headshot;

    const newTrack = {
        url: demo.demo_url,
        actor: { ActorName: actorName, HeadshotURL: headshot }
    };

    if (currentTrack?.url === newTrack.url) {
        setIsPlaying(!isPlaying);
    } else {
        setCurrentTrack(newTrack);
        setIsPlaying(true);
    }
  };

  const handleToggleLike = async (demo: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; 

      const demoUrl = demo.demo_url;
      const isLiked = userLikes.includes(demoUrl);
      
      // 1. Optimistic UI Update
      if (isLiked) {
          setUserLikes(prev => prev.filter(u => u !== demoUrl));
          const updateDemos = (demos: DemoInterface[]) => demos.map(d => 
            d.demo_url === demoUrl ? { ...d, likes: (d.likes || 1) - 1 } : d
          );
          setAllDemos(prev => updateDemos(prev));
          setFilteredDemos(prev => updateDemos(prev));
      } else {
          setUserLikes(prev => [...prev, demoUrl]);
          const updateDemos = (demos: DemoInterface[]) => demos.map(d => 
            d.demo_url === demoUrl ? { ...d, likes: (d.likes || 0) + 1 } : d
          );
          setAllDemos(prev => updateDemos(prev));
          setFilteredDemos(prev => updateDemos(prev));
      }

      // 2. Database Call
      if (isLiked) {
          await supabase.from('demo_likes').delete().match({ user_id: user.id, demo_url: demoUrl });
      } else {
          const actorId = demo.actors?.id || demo.actor_id;
          await supabase.from('demo_likes').insert({ user_id: user.id, actor_id: actorId, demo_url: demoUrl });
      }
  };


  const renderOtherDemoCard = (demo: DemoInterface) => {
    switch (demo.demo_type) {
      case 'video':
        return <VideoDemoCard key={demo.demo_id} demo={demo} />;
      case 'script':
        return <ScriptDemoCard key={demo.demo_id} demo={demo} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32"> 
      
      <audio ref={audioRef} src={currentTrack?.url || ''} />

      {/* --- HERO SECTION with Gradient --- */}
      <div className="relative pt-28 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-primary/10 blur-[100px] rounded-full -z-10 opacity-50" />
        
        <div className="container max-w-7xl mx-auto px-4 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
            Our Talent & <span className="text-primary">Demos</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse our marketplace by talent, or listen to the latest demos for audio, video, and scripts.
          </p>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 mt-8">
        <Tabs 
          value={currentFilter} 
          onValueChange={(value) => setCurrentFilter(value as any)} 
          className="w-full"
        >
          {/* --- TABS LIST: Grid on mobile (2x2), Flex on Desktop --- */}
          <div className="flex justify-center mb-10">
            <TabsList className="grid grid-cols-2 w-full max-w-[600px] h-auto p-1 gap-1 sm:grid-cols-4 sm:h-12 bg-muted/50 rounded-xl">
              <TabsTrigger value="all" className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg">
                <Users size={16} /> All Talent
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg">
                <Mic size={16} /> Audio
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg">
                <Video size={16} /> Video
              </TabsTrigger>
              <TabsTrigger value="script" className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg">
                <FileText size={16} /> Scripts
              </TabsTrigger>
            </TabsList>
          </div>

          {isLoading ? (
            /* --- Loading Skeletons --- */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in-50">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="max-w-xl mx-auto">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* --- ALL TALENT TAB --- */}
              <TabsContent value="all" className="mt-0 focus-visible:outline-none animate-in slide-in-from-bottom-2 duration-500">
                {allActors.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allActors.map(actor => (
                      <TalentCard key={actor.slug} actor={actor} />
                    ))}
                  </div>
                ) : (
                  <EmptyState type="Talent" />
                )}
              </TabsContent>

              {/* --- AUDIO TAB --- */}
              <TabsContent value="audio" className="mt-0 focus-visible:outline-none animate-in slide-in-from-bottom-2 duration-500">
                <div className="max-w-4xl mx-auto space-y-4"> 
                  {filteredDemos.length > 0 ? (
                    filteredDemos.map(demo => {
                      const rowDemo = {
                          id: demo.demo_id,
                          title: demo.demo_title,
                          demo_url: demo.demo_url || '',
                          likes: demo.likes || 0, 
                          actors: {
                              id: demo.actor_id,
                              ActorName: demo.actor_name,
                              slug: demo.actor_slug,
                              HeadshotURL: demo.actor_headshot
                          }
                      };

                      return (
                          <DemoPlayerRow
                              key={demo.demo_id}
                              demo={rowDemo}
                              onPlayClick={() => handlePlayClick(demo)}
                              isCurrentlyPlaying={isPlaying && currentTrack?.url === demo.demo_url}
                              isLiked={userLikes.includes(demo.demo_url || '')}
                              onToggleLike={() => handleToggleLike(demo)}
                          />
                      );
                    })
                  ) : (
                    <EmptyState type="Audio Demos" />
                  )}
                </div>
              </TabsContent>

              {/* --- VIDEO TAB --- */}
              <TabsContent value="video" className="mt-0 focus-visible:outline-none animate-in slide-in-from-bottom-2 duration-500">
                {filteredDemos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDemos.map(renderOtherDemoCard)}
                    </div>
                ) : (
                    <EmptyState type="Video Demos" />
                )}
              </TabsContent>

              {/* --- SCRIPT TAB --- */}
              <TabsContent value="script" className="mt-0 focus-visible:outline-none animate-in slide-in-from-bottom-2 duration-500">
                {filteredDemos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDemos.map(renderOtherDemoCard)}
                    </div>
                ) : (
                    <EmptyState type="Script Demos" />
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <GlobalAudioPlayer
        audioRef={audioRef}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => {
            if (currentTrack) setIsPlaying(!isPlaying);
        }}
        duration={duration}
        currentTime={currentTime}
      />
    </div>
  );
};

// --- Helper Component for Empty States ---
const EmptyState = ({ type }: { type: string }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4 border-2 border-dashed border-muted rounded-2xl bg-muted/10">
        <div className="p-4 rounded-full bg-muted/50">
            <SearchX className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
            <h3 className="text-lg font-semibold">No {type} Found</h3>
            <p className="text-muted-foreground max-w-sm">
                We couldn't find any items matching this category at the moment. Please check back later.
            </p>
        </div>
    </div>
);

export default PortfolioPage;