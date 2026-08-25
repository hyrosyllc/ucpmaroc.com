import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/supabaseClient";
import { Star, ChevronLeft, ChevronRight, MessageSquareQuote, X, Loader2, Send, CheckCircle2, Pencil, Image as ImageIcon, Video, UploadCloud, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineEdit } from "../../components/dashboard/InlineEdit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Reviews: React.FC<any> = ({ data, settings = {}, id, isPreview, portfolioId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const textCarouselRef = useRef<HTMLDivElement>(null);
  const videoCarouselRef = useRef<HTMLDivElement>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reviewStep, setReviewStep] = useState<"select_type" | "form">("select_type");
  const [reviewType, setReviewType] = useState<"text_media" | "video">("text_media");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, title: '', content: '', images: [] as string[], video_url: '' });
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [flippedReview, setFlippedReview] = useState<any | null>(null);
  const [activeFlippedImg, setActiveFlippedImg] = useState(0);
  const variant = settings.variant || data.variant || "grid";
  const showTextReviews = data.showTextReviews !== false;
  const showVideoReviews = data.showVideoReviews !== false;

  useEffect(() => {
    const fetchReviews = async () => {
      if (!portfolioId && !isPreview) {
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from("pro_site_reviews")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("created_at", { ascending: false });
        
      if (!isPreview) {
        query = query.eq("is_published", true);
      }
      
      const { data: fetchedReviews, error } = await query;

      if (!error && fetchedReviews) {
        setReviews(fetchedReviews);
      }
      
      setLoading(false);
    };

    fetchReviews();
  }, [portfolioId, isPreview]);

  const scrollCarousel = (direction: "left" | "right", ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const amount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    
    if (type === 'video') {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `site-reviews/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('portfolio-assets').upload(filePath, file);
      if (!error) {
        const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(filePath);
        setNewReview({ ...newReview, video_url: data.publicUrl });
      }
    } else {
      const newImages = [...newReview.images];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `site-reviews/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error } = await supabase.storage.from('portfolio-assets').upload(filePath, file);
        if (!error) {
          const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(filePath);
          newImages.push(data.publicUrl);
        }
      }
      setNewReview({ ...newReview, images: newImages });
    }
    setUploadingMedia(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setFormSuccess(true);
      }, 800);
      return;
    }
    if (!portfolioId) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('pro_site_reviews').insert({
      portfolio_id: portfolioId,
      reviewer_name: newReview.name,
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      images: newReview.images,
      video_url: newReview.video_url,
      review_type: reviewType,
      is_published: false
    });
    setIsSubmitting(false);
    if (!error) {
      setFormSuccess(true);
    } else {
      alert('Failed to submit review.');
    }
  };

  const approvedReviews = reviews.filter(r => r.is_published);
  const displayReviews = isPreview ? reviews : approvedReviews; // In preview, show all so they can see layout
  
  const textReviews = displayReviews.filter(r => r.review_type !== 'video');
  const videoReviews = displayReviews.filter(r => r.review_type === 'video');

  const TextReviewCard = ({ review }: { review: any }) => {
    const displayImages = review.images && review.images.length > 0 ? review.images : (review.image_url ? [review.image_url] : []);
    const [activeImg, setActiveImg] = useState(0);

    // --- MASONRY VARIANT (Preserve Original Layout) ---
    if (variant === "masonry") {
      return (
        <div className="relative border border-border p-8 rounded-[2.5rem] flex flex-col h-full shadow-lg group transition-all duration-500 hover:scale-[1.02] overflow-hidden min-h-[300px] bg-card hover:bg-card/60 hover:border-border/50">
          <MessageSquareQuote className="absolute top-8 right-8 w-12 h-12 text-foreground/5 group-hover:text-primary/10 transition-colors duration-500" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex gap-1.5 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className={cn("fill-current", i < (review.rating || 5) ? "text-amber-500" : "text-muted-foreground/30")} />
              ))}
            </div>
            
            {review.title && <h4 className="text-xl font-bold mb-3 tracking-tight text-foreground">{review.title}</h4>}
            
            <p className={cn("leading-relaxed flex-grow text-base italic text-muted-foreground", displayImages.length > 0 ? "mb-6" : "mb-8")}>
              "{review.content}"
            </p>
            
            {displayImages.length > 0 && (
              <div className="mb-6 space-y-3">
                <div className="relative w-full rounded-2xl overflow-hidden border border-border/50 bg-muted flex items-center justify-center group/carousel">
                  <img src={displayImages[activeImg]} className="w-full h-auto max-h-[400px] object-cover transition-transform duration-700 group-hover/carousel:scale-105" alt="Review" />
                  {displayImages.length > 1 && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setActiveImg((prev) => (prev - 1 + displayImages.length) % displayImages.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full backdrop-blur-md transition-all opacity-0 group-hover/carousel:opacity-100 shadow-md"><ChevronLeft size={18} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setActiveImg((prev) => (prev + 1) % displayImages.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full backdrop-blur-md transition-all opacity-0 group-hover/carousel:opacity-100 shadow-md"><ChevronRight size={18} /></button>
                    </>
                  )}
                </div>
                {displayImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {displayImages.map((img: string, i: number) => (
                      <button key={i} onClick={() => setActiveImg(i)} className={cn("w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all", activeImg === i ? "border-primary scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100")}>
                        <img src={img} className="w-full h-full object-cover" alt="thumb" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 mt-auto pt-5 border-t border-border/50">
              {review.reviewer_avatar && (
                <img src={review.reviewer_avatar} alt={review.reviewer_name} className="w-8 h-8 rounded-full object-cover ring-1 ring-border/50 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground/80 flex items-center gap-1.5 truncate">
                  {review.reviewer_name}
                  <CheckCircle2 size={14} className="text-green-500 fill-green-500/20" />
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --- GRID & CAROUSEL (FRONT CARD UX) ---
    return (
      <div className="relative w-full h-full">
        <div className="relative border border-border p-8 rounded-[2.5rem] flex flex-col h-full shadow-lg transition-all duration-500 hover:scale-[1.02] bg-card hover:bg-card/60 hover:border-border/50">
              <MessageSquareQuote className="absolute top-8 right-8 w-12 h-12 text-foreground/5 group-hover:text-primary/10 transition-colors duration-500" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex gap-1.5 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className={cn("fill-current", i < (review.rating || 5) ? "text-amber-500" : "text-muted-foreground/30")} />
                  ))}
                </div>
                
                {review.title && <h4 className="text-xl font-bold mb-3 tracking-tight text-foreground line-clamp-1">{review.title}</h4>}
                
                <p className="leading-relaxed flex-grow text-base italic text-muted-foreground mb-4 line-clamp-6">
                  "{review.content}"
                </p>
                
                <div className="flex items-center gap-3 mt-auto pt-5 border-t border-border/50 relative">
                  {review.reviewer_avatar && (
                    <img src={review.reviewer_avatar} alt={review.reviewer_name} className="w-8 h-8 rounded-full object-cover ring-1 ring-border/50 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 pr-16">
                    <p className="text-sm font-bold text-foreground/80 flex items-center gap-1.5 truncate">
                      {review.reviewer_name}
                      <CheckCircle2 size={14} className="text-green-500 fill-green-500/20 shrink-0" />
                    </p>
                  </div>

                  {/* 🚀 SHUFFLED DECK OF CARDS (THUMBNAILS) */}
                  {displayImages.length > 0 && (
                    <div 
                      className="absolute right-0 bottom-0 w-16 h-16 cursor-pointer group/deck"
                      onClick={() => {
                        setFlippedReview(review);
                        setActiveFlippedImg(0);
                      }}
                      title="View attached photos"
                    >
                      {displayImages.slice(0, 3).map((img: string, i: number) => {
                        const rotations = ["rotate-0", "rotate-6", "-rotate-6"];
                        const zIndexes = ["z-30", "z-20", "z-10"];
                        const offsets = ["right-0 bottom-0", "right-1.5 bottom-1.5", "right-3 bottom-3"];
                        const hoverEffects = ["group-hover/deck:-translate-y-2 group-hover/deck:-translate-x-2 group-hover/deck:-rotate-6", "group-hover/deck:-translate-y-1 group-hover/deck:translate-x-1 group-hover/deck:rotate-12", ""];
                        
                        return (
                          <img 
                            key={i} 
                            src={img} 
                            className={cn(
                              "absolute w-12 h-12 rounded-xl border-2 border-background object-cover shadow-md transition-all duration-300", 
                              rotations[i], zIndexes[i], offsets[i], hoverEffects[i]
                            )} 
                            alt="thumb" 
                          />
                        );
                      })}
                      {displayImages.length > 3 && (
                        <div className="absolute z-40 -right-2 -top-2 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm ring-2 ring-background">
                          +{displayImages.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
    );
  };

  const VideoReviewCard = ({ review }: { review: any }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };

    return (
      <div className="relative aspect-[9/16] rounded-[2.5rem] overflow-hidden bg-muted group shadow-xl border border-border cursor-pointer" onClick={togglePlay}>
        {review.video_url ? (
          <video 
            ref={videoRef}
            src={review.video_url} 
            className="w-full h-full object-cover" 
            playsInline 
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Video size={48} opacity={0.2} /></div>
        )}
        
        {review.video_url && (
          <div className={cn("absolute inset-0 flex items-center justify-center bg-background/20 group-hover:bg-background/40 transition-all z-20", isPlaying ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100")}>
            <div className="w-16 h-16 rounded-full bg-foreground/20 backdrop-blur-md flex items-center justify-center border border-border/50 text-foreground shadow-2xl group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 fill-foreground ml-1" />
            </div>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/90 via-background/30 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-8 left-6 right-6 flex flex-col z-20 pointer-events-none text-left">
          <h4 className="text-xl font-bold text-foreground truncate drop-shadow-md flex items-center gap-2">
             {review.reviewer_name}
             <CheckCircle2 size={16} className="text-blue-500 fill-background" />
          </h4>
          {review.content && (
            <p className="text-sm text-foreground/90 line-clamp-3 mt-2 leading-relaxed drop-shadow-md">
              "{review.content}"
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderLayout = (items: any[], type: 'text' | 'video') => {
    const ref = type === 'text' ? textCarouselRef : videoCarouselRef;
    const Card = type === 'text' ? TextReviewCard : VideoReviewCard;
    
    if (variant === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((r) => <Card key={r.id} review={r} />)}
        </div>
      );
    }
    
    if (variant === "masonry") {
      return (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 md:gap-8 space-y-6 md:space-y-8">
          {items.map((r) => <div key={r.id} className="break-inside-avoid"><Card review={r} /></div>)}
        </div>
      );
    }

    return (
      <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-background/50 hover:bg-background/80 text-foreground rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-border hidden md:flex backdrop-blur-md shadow-2xl hover:scale-105"
          onClick={() => scrollCarousel("left", ref)}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-background/50 hover:bg-background/80 text-foreground rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-border hidden md:flex backdrop-blur-md shadow-2xl hover:scale-105"
          onClick={() => scrollCarousel("right", ref)}
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        <div
          ref={ref}
          className="flex overflow-x-auto py-8 gap-6 md:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
          {items.map((r) => (
            <div key={r.id} className="snap-center shrink-0 w-[85vw] sm:w-[400px]">
              <Card review={r} />
            </div>
          ))}
        </div>
        
        <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-background to-transparent pointer-events-none md:block hidden z-10" />
        <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-background to-transparent pointer-events-none md:block hidden z-10" />
      </div>
    );
  };

  return (
    <section className="relative py-24 md:py-32 bg-background overflow-hidden text-foreground" id="reviews">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6">
          <InlineEdit
            tagName="h2"
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-foreground block"
            text={data.title || "Client Love"}
            sectionId={id}
            fieldKey="title"
            isPreview={isPreview}
          />
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
          <InlineEdit
            tagName="p"
            className="text-lg md:text-xl text-muted-foreground font-medium block"
            text={data.subheadline || "See what our customers have to say."}
            sectionId={id}
            fieldKey="subheadline"
            isPreview={isPreview}
          />
          <div className="pt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => { setReviewStep('select_type'); setIsFormOpen(true); }} size="lg" className="rounded-full font-bold bg-foreground text-background hover:bg-foreground/90">
              <Pencil className="w-4 h-4 mr-2" /> Leave a Review
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-primary">
            <div className="animate-pulse font-medium tracking-widest uppercase text-sm">Loading reviews...</div>
          </div>
        ) : displayReviews.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl bg-card/30 text-muted-foreground flex flex-col items-center justify-center">
            <MessageSquareQuote className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-bold text-lg text-foreground tracking-wide">No reviews yet.</p>
            <p className="text-sm opacity-70 mt-2 max-w-sm mx-auto">Reviews left by your customers will automatically appear here once approved in your dashboard.</p>
          </div>
        ) : (
          <>
          {showTextReviews && textReviews.length > 0 && (
            <div className={cn(showVideoReviews && videoReviews.length > 0 ? "mb-16 md:mb-24" : "")}>
              {renderLayout(textReviews, 'text')}
            </div>
          )}
          
          {showVideoReviews && videoReviews.length > 0 && (
            <div>
              {textReviews.length > 0 && (
                <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16 space-y-4">
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Video Testimonials</h3>
                  <div className="h-1 w-16 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
                </div>
              )}
              {renderLayout(videoReviews, 'video')}
            </div>
          )}
          </>
        )}
      </div>
    {/* 🚀 Flipped Image Gallery Modal */}
      {flippedReview && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 md:p-12">
          <style>{`
            @keyframes popup-flip {
              0% { transform: perspective(1500px) rotateY(-90deg) scale(0.8); opacity: 0; }
              100% { transform: perspective(1500px) rotateY(0deg) scale(1); opacity: 1; }
            }
            .animate-popup-flip {
              animation: popup-flip 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.15) forwards;
            }
          `}</style>
          <div className="absolute inset-0 bg-background/90 backdrop-blur-md cursor-pointer animate-in fade-in duration-500" onClick={() => setFlippedReview(null)} />
          
          <div className="relative w-full max-w-md md:max-w-lg h-[80vh] min-h-[500px] max-h-[800px] shadow-2xl bg-card rounded-[2.5rem] border border-border overflow-hidden group/carousel animate-popup-flip">
            {(() => {
               const displayImages = flippedReview.images && flippedReview.images.length > 0 ? flippedReview.images : (flippedReview.image_url ? [flippedReview.image_url] : []);
               return (
                 <>
                   <img src={displayImages[activeFlippedImg]} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 cursor-pointer group-hover/carousel:scale-105" alt="Review" onClick={() => window.open(displayImages[activeFlippedImg], '_blank')} />
                   
                   <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent pointer-events-none" />
                   <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/90 via-background/40 to-transparent pointer-events-none" />

                   <div className="absolute top-0 inset-x-0 flex justify-between items-center p-6 z-10">
                     <button onClick={() => setFlippedReview(null)} className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors bg-background/40 hover:bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border/50 shadow-lg">
                       <RotateCcw size={16} /> Return
                     </button>
                     <span className="text-[10px] font-bold text-foreground uppercase tracking-widest bg-background/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-lg">
                       {activeFlippedImg + 1} / {displayImages.length} Photos
                     </span>
                   </div>
                   
                   {displayImages.length > 1 && (
                     <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2 overflow-x-auto px-6 z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                       {displayImages.map((img: string, i: number) => (
                         <button key={i} onClick={() => setActiveFlippedImg(i)} className={cn("w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all shadow-xl", activeFlippedImg === i ? "border-primary scale-110 shadow-primary/30" : "border-border/50 opacity-60 hover:opacity-100")}>
                           <img src={img} className="w-full h-full object-cover" alt="thumb" />
                         </button>
                       ))}
                     </div>
                   )}

                   {displayImages.length > 1 && (
                     <>
                       <button onClick={(e) => { e.stopPropagation(); setActiveFlippedImg((prev) => (prev - 1 + displayImages.length) % displayImages.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/80 text-foreground p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover/carousel:opacity-100 shadow-xl border border-border/50"><ChevronLeft size={20} /></button>
                       <button onClick={(e) => { e.stopPropagation(); setActiveFlippedImg((prev) => (prev + 1) % displayImages.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/40 hover:bg-background/80 text-foreground p-3 rounded-full backdrop-blur-md transition-all opacity-0 group-hover/carousel:opacity-100 shadow-xl border border-border/50"><ChevronRight size={20} /></button>
                     </>
                   )}
                 </>
               );
            })()}
          </div>
        </div>,
        document.body
      )}
      {/* LEAVE A REVIEW MODAL */}
      {isFormOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer animate-in fade-in" onClick={() => !isSubmitting && setIsFormOpen(false)} />
          <div className="relative bg-background border border-border rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-full hover:bg-foreground/10" onClick={() => setIsFormOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
            
            {formSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/50">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Thank You!</h3>
                <p className="text-muted-foreground mb-8 leading-relaxed">Your review has been submitted successfully. It is currently pending approval and will appear on the site shortly.</p>
                <Button onClick={() => { setIsFormOpen(false); setFormSuccess(false); setNewReview({name: '', rating: 5, title: '', content: '', images: [], video_url: ''}); setReviewStep('select_type'); }} className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 font-bold h-12">
                  Close
                </Button>
              </div>
            ) : reviewStep === "select_type" ? (
              <div className="animate-in slide-in-from-left-4 duration-300">
                <h3 className="text-2xl font-bold text-foreground mb-2 text-center">How would you like to review us?</h3>
                <p className="text-sm text-muted-foreground mb-8 text-center">Choose the format that works best for you.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => { setReviewType('video'); setReviewStep('form'); }} className="p-6 border border-border bg-card/50 rounded-2xl flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group shadow-sm">
                     <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Video size={32} />
                     </div>
                     <div className="text-center">
                       <h4 className="font-bold text-foreground">Video Testimonial</h4>
                       <p className="text-xs text-muted-foreground mt-1">Record a quick vertical video (TikTok/Reel style)</p>
                     </div>
                  </button>
                  <button onClick={() => { setReviewType('text_media'); setReviewStep('form'); }} className="p-6 border border-border bg-card/50 rounded-2xl flex flex-col items-center gap-4 hover:border-primary hover:bg-primary/5 transition-all group shadow-sm">
                     <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquareQuote size={32} />
                     </div>
                     <div className="text-center">
                       <h4 className="font-bold text-foreground">Text & Photos</h4>
                       <p className="text-xs text-muted-foreground mt-1">Write a review and optionally attach some photos</p>
                     </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <Button variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground hover:text-foreground" onClick={() => setReviewStep('select_type')}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {reviewType === 'video' ? 'Submit Video Review' : 'Write a Review'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {reviewType === 'video' ? 'Upload your vertical video testimonial below.' : 'Share your experience with us.'}
                </p>
                
                <form onSubmit={handleReviewSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Rating</Label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(num => (
                        <Star key={num} size={28} className={cn("cursor-pointer transition-all hover:scale-110", newReview.rating >= num ? "text-amber-500 fill-amber-500" : "text-muted-foreground/50")} onClick={() => setNewReview({...newReview, rating: num})} />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Your Name <span className="text-primary">*</span></Label>
                    <Input placeholder="e.g. Jane Doe" required value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} className="bg-foreground/5 border-border text-foreground h-12 rounded-xl" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Review Title <span className="text-primary">*</span></Label>
                    <Input placeholder="e.g. Incredible Experience!" required value={newReview.title} onChange={e => setNewReview({...newReview, title: e.target.value})} className="bg-foreground/5 border-border text-foreground h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Your Review <span className="text-primary">*</span></Label>
                    <Textarea placeholder="Tell us what you thought..." required value={newReview.content} onChange={e => setNewReview({...newReview, content: e.target.value})} className="bg-foreground/5 border-border text-foreground resize-none rounded-xl p-4" rows={4} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
                      {reviewType === 'video' ? 'Upload Video *' : 'Feedback Photos (Optional)'}
                    </Label>
                    
                    <div className="space-y-3">
                      <Button type="button" variant="outline" className="bg-card/50 border-dashed border-border text-foreground h-16 rounded-xl w-full relative overflow-hidden hover:bg-foreground/5" disabled={uploadingMedia}>
                        {uploadingMedia ? <Loader2 className="animate-spin w-5 h-5 mr-2 text-primary" /> : reviewType === 'video' ? <Video className="w-5 h-5 mr-2 text-primary" /> : <UploadCloud className="w-5 h-5 mr-2 text-primary" />}
                        <span className="font-bold">{reviewType === 'video' ? (newReview.video_url ? 'Replace Video' : 'Select Vertical Video') : 'Upload Images'}</span>
                        <input type="file" multiple={reviewType === 'text_media'} accept={reviewType === 'video' ? "video/mp4,video/webm,video/quicktime" : "image/*"} onChange={(e) => handleMediaUpload(e, reviewType)} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </Button>
                      
                      {/* Media Previews */}
                      {reviewType === 'video' && newReview.video_url && (
                        <div className="w-full aspect-[9/16] max-h-[250px] rounded-xl overflow-hidden border border-border bg-black">
                          <video src={newReview.video_url} className="w-full h-full object-contain" controls />
                        </div>
                      )}
                      
                      {reviewType === 'text_media' && newReview.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                          {newReview.images.map((img, idx) => (
                            <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0 relative group">
                              <img src={img} alt="Uploaded" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => setNewReview({...newReview, images: newReview.images.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isSubmitting || (reviewType === 'video' && !newReview.video_url)} className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-lg mt-4 shadow-sm">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 w-5 h-5"/> : <Send className="mr-2 w-5 h-5" />}
                    {reviewType === 'video' ? 'Submit Video' : 'Submit Review'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Reviews;