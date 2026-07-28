import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Star, Trash2, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteFilter from "@/components/dashboard/SiteFilter";
import { cn } from "@/lib/utils";

export default function ProductReviewsPage() {
  const { actorData, selectedSiteId, setSelectedSiteId } = useOutletContext<ActorDashboardContextType>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved">("pending");

  useEffect(() => {
    const fetchReviews = async () => {
      if (!actorData?.id) return;
      setLoading(true);

      const { data: mySites } = await supabase
        .from("portfolios")
        .select("id, site_name, public_slug")
        .eq("actor_id", actorData.id);
      
      if (mySites) setSites(mySites);

      if (!mySites || mySites.length === 0) {
        setLoading(false);
        return;
      }

      // We use !inner to ensure we only get reviews for products owned by this actor
      const { data, error } = await supabase
        .from("pro_product_reviews")
        .select(`
          *,
          pro_products!inner(id, title, portfolio_id, actor_id),
          pro_customers!inner(id, name, email)
        `)
        .eq("pro_products.actor_id", actorData.id)
        .order("created_at", { ascending: false });

      if (data && !error) setReviews(data);
      setLoading(false);
    };

    fetchReviews();
  }, [actorData?.id]);

  const togglePublish = async (id: string, current: boolean) => {
    const { error } = await supabase.from("pro_product_reviews").update({ is_published: !current }).eq("id", id);
    if (!error) {
      setReviews(reviews.map((r) => (r.id === id ? { ...r, is_published: !current } : r)));
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    const { error } = await supabase.from("pro_product_reviews").delete().eq("id", id);
    if (!error) {
      setReviews(reviews.filter((r) => r.id !== id));
    }
  };

  const filteredReviews = reviews.filter(r => selectedSiteId === "all" || r.pro_products?.portfolio_id === selectedSiteId);
  const pending = filteredReviews.filter((r) => !r.is_published);
  const approved = filteredReviews.filter((r) => r.is_published);
  const display = tab === "pending" ? pending : approved;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Reviews</h1>
          <p className="text-muted-foreground mt-1">Manage and approve customer reviews for your products.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-muted/50 p-1 rounded-lg border">
            <button className={cn("px-4 text-xs font-semibold py-2 rounded-md transition-all", tab === "pending" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => setTab("pending")}>
              Pending ({pending.length})
            </button>
            <button className={cn("px-4 text-xs font-semibold py-2 rounded-md transition-all", tab === "approved" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => setTab("approved")}>
              Approved ({approved.length})
            </button>
          </div>
          <SiteFilter
            sites={sites}
            selectedSiteId={selectedSiteId}
            onChange={setSelectedSiteId}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : display.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-xl bg-muted/10">
          <Star className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No {tab} reviews found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {tab === "pending" ? "You have caught up with all your reviews!" : "You haven't approved any reviews yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
          {display.map((review) => {
            return (
              <Card key={review.id} className="rounded-2xl shadow-sm border-border overflow-hidden flex flex-col hover:border-primary/30 transition-colors">
                <CardContent className="p-5 flex-grow flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                          {(review.pro_customers?.name || "C")[0].toUpperCase()}
                        </div>
                        {review.pro_customers?.name || "Customer"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} className={cn("fill-current", i < review.rating ? "text-amber-500" : "text-muted")} />)}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-xl border">
                    <p className="text-sm font-medium italic text-foreground/90">"{review.content}"</p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                       <MessageSquare size={14} className="text-primary"/> 
                       <span className="text-xs font-bold truncate" title={review.pro_products?.title}>{review.pro_products?.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant={review.is_published ? "outline" : "default"} className={cn("flex-1 h-9 font-bold", !review.is_published && "bg-green-500 hover:bg-green-600 text-white")} onClick={() => togglePublish(review.id, review.is_published)}>
                        {review.is_published ? <><XCircle size={16} className="mr-2"/> Hide Review</> : <><CheckCircle2 size={16} className="mr-2"/> Approve</>}
                      </Button>
                      <Button size="icon" variant="outline" className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 border-destructive/20" onClick={() => deleteReview(review.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}