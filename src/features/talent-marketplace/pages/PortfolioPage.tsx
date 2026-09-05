import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { 
  Demo as DemoInterface, 
  VideoDemoCard, 
  ScriptDemoCard 
} from '@/components/DemoCards';
import { ServiceOfferCard, TalentCard } from '@/features/talent-marketplace';
import { getMarketplaceAllowedServiceIds, getMarketplaceServiceDefinitions, loadMarketplaceAllowedServiceIds } from '@/features/talent-marketplace/serviceCatalog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import DemoPlayerRow from '@/components/DemoPlayerRow'; 
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import { Mic, Video, FileText, Users, SearchX, Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Actor {
  slug: string;
  HeadshotURL: string | null;
  ActorName: string;
  bio: string | null;
  [key: string]: any;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('all');

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
          slug, HeadshotURL, ActorName, bio, service_scriptwriting, service_videoediting, service_voiceover, IsActive, actor_services(service_id, enabled)
        `)
        .eq('IsActive', true);

      if (demoError || actorError) {
        console.error("Error fetching data:", demoError, actorError);
        setError("Could not load content. Please try again later.");
      } else {
        await loadMarketplaceAllowedServiceIds();
        const allowedServiceIds = getMarketplaceAllowedServiceIds();
        // 1. Process Actors
        const actors = actorData.map((actor: any) => ({
          ...actor
        })) as Actor[];
        
        const activeActors = actors.filter((actor) =>
          getMarketplaceServiceDefinitions(actor).some((service) => service.enabled)
        );
        setAllActors(activeActors);

        // 2. Filter Demos
        const validDemos = (demoData as DemoInterface[]).filter(demo => {
            const actor = actors.find(a => a.slug === demo.actor_slug); 
            if (!actor) return false; 

            const hasService = (serviceId: string) => {
                return actor.actor_services?.some((s: any) => s.service_id === serviceId && s.enabled) ?? false;
            };

            if (demo.demo_type === 'audio' && (!allowedServiceIds.includes('voice_over') || !hasService('voice_over'))) return false;
            if (demo.demo_type === 'video' && (!allowedServiceIds.includes('video_editing') || !hasService('video_editing'))) return false;
            if (demo.demo_type === 'script' && (!allowedServiceIds.includes('scriptwriting') || !hasService('scriptwriting'))) return false;
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

  const serviceCategories = useMemo(() => {
    const services = allActors.flatMap((actor) => getMarketplaceServiceDefinitions(actor).filter((service) => service.enabled));
    return Array.from(new Map(services.map((service) => [service.id, service])).values());
  }, [allActors]);

  const visibleActors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allActors.filter((actor) => {
      const services = getMarketplaceServiceDefinitions(actor).filter((service) => service.enabled);
      const matchesCategory = selectedServiceId === 'all' || services.some((service) => service.id === selectedServiceId);
      const matchesSearch = !term || actor.ActorName.toLowerCase().includes(term) || actor.bio?.toLowerCase().includes(term) || services.some((service) => `${service.label} ${service.description}`.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [allActors, searchTerm, selectedServiceId]);

  const serviceOffers = useMemo(() => visibleActors.flatMap((actor) =>
    getMarketplaceServiceDefinitions(actor)
      .filter((service) => service.enabled && (selectedServiceId === 'all' || service.id === selectedServiceId))
      .map((service) => ({ actor, service }))
  ), [visibleActors, selectedServiceId]);


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

      <div className='border-b border-border bg-muted/30 pt-28'>
        <div className='container mx-auto max-w-7xl px-4 pb-10'>
          <div className='max-w-3xl space-y-3'>
            <p className='text-sm font-semibold uppercase tracking-[0.2em] text-primary'>UCP Marketplace</p>
            <h1 className='text-4xl font-black tracking-tight text-foreground md:text-6xl'>Find the right service for the job.</h1>
            <p className='text-lg text-muted-foreground'>Compare trusted local and digital professionals, then open an offer to request a quote.</p>
          </div>
          <div className='mt-8 flex max-w-3xl items-center gap-3 rounded-2xl border border-border bg-background p-2 shadow-sm'>
            <Search className='ml-3 h-5 w-5 text-muted-foreground' />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder='Search services, skills, or talent' className='border-0 shadow-none focus-visible:ring-0' />
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 mt-8">
        <div className='mb-8 flex items-start gap-3'>
          <SlidersHorizontal className='mt-2 h-5 w-5 shrink-0 text-muted-foreground' />
          <div className='flex flex-wrap gap-2'>
            <button onClick={() => setSelectedServiceId('all')} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selectedServiceId === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}>All services</button>
            {serviceCategories.map((service) => <button key={service.id} onClick={() => setSelectedServiceId(service.id)} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${selectedServiceId === service.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary'}`}>{service.label}</button>)}
          </div>
        </div>
        {!isLoading && !error && currentFilter === 'all' && (
          <section className='mb-14'>
            <div className='mb-5 flex items-end justify-between gap-4'>
              <div><p className='text-sm text-muted-foreground'>Showing {serviceOffers.length} offers</p><h2 className='text-2xl font-bold'>Services for you</h2></div>
              <span className='text-sm text-muted-foreground'>{visibleActors.length} professionals</span>
            </div>
            {serviceOffers.length > 0 ? <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>{serviceOffers.map(({ actor, service }) => <ServiceOfferCard key={`${actor.slug}-${service.id}`} actor={actor} service={service} />)}</div> : <EmptyState type='service offers' />}
          </section>
        )}
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
                    {visibleActors.map(actor => (
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