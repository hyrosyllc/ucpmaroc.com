import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../supabaseClient";
import { Star, ChevronLeft, ChevronRight, MessageSquareQuote, X, Loader2, Send, CheckCircle2, Pencil, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineEdit } from "../../components/dashboard/InlineEdit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Reviews: React.FC<any> = ({ data, settings = {}, id, isPreview, portfolioId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, title: '', content: '', image_url: '' });
  const [uploadingImage, setUploadingImage] = useState(false);

  const variant = settings.variant || data.variant || "grid";

  useEffect(() => {
    const fetchReviews = async () => {
      if (!portfolioId && !isPreview) {
        setLoading(false);
        return;
      }
      
      // If we don't have a portfolioId but we're in preview, just show dummy data right away
      if (!portfolioId && isPreview) {
        setReviews(getDummyData());
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

      if (!error && fetchedReviews && fetchedReviews.length > 0) {
        setReviews(fetchedReviews);
      } else if (isPreview) {
        // Fallback to dummy data in builder so users can see the layout
        setReviews(getDummyData());
      }
      
      setLoading(false);
    };

    fetchReviews();
  }, [portfolioId, isPreview]);

  const getDummyData = () => [
    { id: '1', reviewer_name: 'Alex D.', rating: 5, title: 'Absolutely phenomenal', content: 'The attention to detail is stunning. Highly recommended!', created_at: new Date().toISOString() },
    { id: '2', reviewer_name: 'Sarah M.', rating: 4, title: 'Great quality', content: 'Fast shipping and great quality. Will definitely buy again.', created_at: new Date().toISOString() },
    { id: '3', reviewer_name: 'James L.', rating: 5, title: 'Best experience', content: 'The best experience I have had with an online store. 10/10.', created_at: new Date().toISOString() },
    { id: '4', reviewer_name: 'Emily R.', rating: 5, title: 'Superb', content: 'Every purchase feels special. Will be recommending to my friends.', created_at: new Date().toISOString() },
  ];

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const amount = carouselRef.current.clientWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    
    const fileExt = file.name.split('.').pop();
    const filePath = `site-reviews/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage.from('portfolio-assets').upload(filePath, file);
    if (!error) {
      const { data } = supabase.storage.from('portfolio-assets').getPublicUrl(filePath);
      setNewReview({ ...newReview, image_url: data.publicUrl });
    } else {
      alert("Failed to upload image. " + error.message);
    }
    setUploadingImage(false);
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
      image_url: newReview.image_url,
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
  const pendingReviews = reviews.filter(r => !r.is_published);
  const displayReviews = approvedReviews.length > 0 ? approvedReviews : (isPreview ? getDummyData() : []);

  const ReviewCard = ({ review }: { review: any }) => (
    <div className="bg-neutral-900/40 border border-black/10 p-8 rounded-[2.5rem] flex flex-col h-full shadow-lg relative group transition-all duration-500 hover:bg-neutral-900/60 hover:border-black/20 hover:scale-[1.02]">
      <MessageSquareQuote className="absolute top-8 right-8 w-12 h-12 text-white/5 group-hover:text-primary/10 transition-colors duration-500" />
      <div className="flex gap-1.5 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={18} className={cn("fill-current", i < review.rating ? "text-amber-500" : "text-neutral-800")} />
        ))}
      </div>
      {review.title && <h4 className="text-xl font-bold text-neutral-900 mb-3 tracking-tight">{review.title}</h4>}
      <p className={cn("text-neutral-600 leading-relaxed flex-grow text-base italic", review.image_url ? "mb-4" : "mb-8")}>
        "{review.content}"
      </p>
      {review.image_url && (
        <div className="w-full h-32 mb-6 rounded-xl overflow-hidden border border-black/10 shrink-0">
          <img src={review.image_url} alt="Feedback" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={() => window.open(review.image_url, '_blank')} />
        </div>
      )}
      <div className="flex items-center gap-4 mt-auto pt-6 border-t border-black/5">
        {review.reviewer_avatar ? (
          <img src={review.reviewer_avatar} alt={review.reviewer_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-black/10" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg ring-2 ring-primary/30">
            {review.reviewer_name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-base font-bold text-neutral-900">{review.reviewer_name}</p>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">Verified Buyer</p>
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative py-24 md:py-32 bg-white overflow-hidden text-neutral-900" id="reviews">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      
      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6">
          <InlineEdit
            tagName="h2"
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-neutral-900 block"
            text={data.title || "Client Love"}
            sectionId={id}
            fieldKey="title"
            isPreview={isPreview}
          />
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
          <InlineEdit
            tagName="p"
            className="text-lg md:text-xl text-neutral-600 font-medium block"
            text={data.subheadline || "See what our customers have to say."}
            sectionId={id}
            fieldKey="subheadline"
            isPreview={isPreview}
          />
          <div className="pt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={() => setIsFormOpen(true)} size="lg" className="rounded-full font-bold bg-white text-black hover:bg-neutral-200">
              <Pencil className="w-4 h-4 mr-2" /> Leave a Review
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-primary">
            <div className="animate-pulse font-medium tracking-widest uppercase text-sm">Loading reviews...</div>
          </div>
        ) : displayReviews.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-black/10 rounded-3xl bg-black/5 text-neutral-500 flex flex-col items-center justify-center">
            <MessageSquareQuote className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-medium tracking-wide">No reviews yet.</p>
            <p className="text-xs opacity-70 mt-2 max-w-sm mx-auto">They will automatically appear here once your customers leave reviews.</p>
          </div>
        ) : (
          <>
            {variant === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {displayReviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}
            
            {variant === "masonry" && (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 md:gap-8 space-y-6 md:space-y-8">
                {displayReviews.map((r) => <div key={r.id} className="break-inside-avoid"><ReviewCard review={r} /></div>)}
              </div>
            )}

            {variant === "carousel" && (
              <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/50 hover:bg-black/80 text-neutral-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-black/10 hidden md:flex backdrop-blur-md shadow-2xl hover:scale-105"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/50 hover:bg-black/80 text-neutral-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 border border-black/10 hidden md:flex backdrop-blur-md shadow-2xl hover:scale-105"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto pb-12 pt-4 gap-6 md:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                >
                  {displayReviews.map((r) => (
                    <div key={r.id} className="snap-center shrink-0 w-[85vw] sm:w-[400px]">
                      <ReviewCard review={r} />
                    </div>
                  ))}
                </div>
                
                <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-white to-transparent pointer-events-none md:block hidden z-10" />
                <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-white to-transparent pointer-events-none md:block hidden z-10" />
              </div>
            )}
          </>
        )}
      </div>

      {/* LEAVE A REVIEW MODAL */}
      {isFormOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer animate-in fade-in" onClick={() => !isSubmitting && setIsFormOpen(false)} />
          <div className="relative bg-white border border-black/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-black/5" onClick={() => setIsFormOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
            
            {formSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/50">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">Thank You!</h3>
                <p className="text-neutral-600 mb-8 leading-relaxed">Your review has been submitted successfully. It is currently pending approval and will appear on the site shortly.</p>
                <Button onClick={() => { setIsFormOpen(false); setFormSuccess(false); setNewReview({name: '', rating: 5, title: '', content: '', image_url: ''}); }} className="bg-white text-black hover:bg-neutral-200 rounded-full px-8 font-bold h-12">
                  Close
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">Leave a Review</h3>
                <p className="text-sm text-neutral-600 mb-6">Share your experience with us.</p>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-neutral-600 text-xs uppercase tracking-widest font-bold">Rating</Label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(num => (
                        <Star key={num} size={28} className={cn("cursor-pointer transition-all hover:scale-110", newReview.rating >= num ? "text-amber-500 fill-amber-500" : "text-neutral-600")} onClick={() => setNewReview({...newReview, rating: num})} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-neutral-600 text-xs uppercase tracking-widest font-bold">Your Name <span className="text-primary">*</span></Label>
                    <Input placeholder="e.g. Jane Doe" required value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} className="bg-black/5 border-black/10 text-neutral-900 h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-neutral-600 text-xs uppercase tracking-widest font-bold">Review Title <span className="text-primary">*</span></Label>
                    <Input placeholder="e.g. Incredible Experience!" required value={newReview.title} onChange={e => setNewReview({...newReview, title: e.target.value})} className="bg-black/5 border-black/10 text-neutral-900 h-12 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-neutral-600 text-xs uppercase tracking-widest font-bold">Your Review <span className="text-primary">*</span></Label>
                    <Textarea placeholder="Tell us what you thought..." required value={newReview.content} onChange={e => setNewReview({...newReview, content: e.target.value})} className="bg-black/5 border-black/10 text-neutral-900 resize-none rounded-xl p-4" rows={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-neutral-600 text-xs uppercase tracking-widest font-bold">Feedback Image (Optional)</Label>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" className="bg-black/5 border-black/10 text-neutral-900 h-12 rounded-xl w-full relative overflow-hidden hover:bg-black/5" disabled={uploadingImage}>
                        {uploadingImage ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                        {newReview.image_url ? 'Image Uploaded! (Click to replace)' : 'Upload Image'}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </Button>
                      {newReview.image_url && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-black/10 shrink-0">
                          <img src={newReview.image_url} alt="Uploaded" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-black hover:bg-primary/90 rounded-xl font-bold text-lg mt-2">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 w-5 h-5"/> : <Send className="mr-2 w-5 h-5" />}
                    Submit Review
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default Reviews;