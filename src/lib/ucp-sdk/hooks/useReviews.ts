import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "@/supabaseClient";

export interface Review {
  id: string;
  reviewer_name: string;
  reviewer_avatar?: string | null;
  rating?: number | null;
  title?: string | null;
  content?: string | null;
  images?: string[] | null;
  image_url?: string | null;
  video_url?: string | null;
  review_type?: "text_media" | "video" | string;
  is_published: boolean;
}

const EMPTY = { name: "", rating: 5, title: "", content: "", images: [] as string[], video_url: "" };

interface Options {
  portfolioId?: string;
  isPreview?: boolean;
}

/** Reviews list plus the visitor submission flow (text with photos, or video). Submissions await owner approval. */
export function useReviews({ portfolioId, isPreview }: Options) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [step, setStep] = useState<"select_type" | "form">("select_type");
  const [reviewType, setReviewType] = useState<"text_media" | "video">("text_media");
  const [draft, setDraft] = useState(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolioId) {
      setLoading(false);
      return;
    }
    let active = true;
    let query = supabase.from("pro_site_reviews").select("*").eq("portfolio_id", portfolioId).order("created_at", { ascending: false });
    if (!isPreview) query = query.eq("is_published", true);
    query.then(({ data, error: err }) => {
      if (!active) return;
      if (!err && data) setReviews(data as Review[]);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [portfolioId, isPreview]);

  const upload = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `site-reviews/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error: err } = await supabase.storage.from("portfolio-assets").upload(path, file);
    if (err) return null;
    return supabase.storage.from("portfolio-assets").getPublicUrl(path).data.publicUrl;
  };

  const uploadMedia = async (e: ChangeEvent<HTMLInputElement>, kind: "image" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    if (kind === "video") {
      const url = await upload(files[0]);
      if (url) setDraft((d) => ({ ...d, video_url: url }));
      else setError("Upload failed. Please try again.");
    } else {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await upload(file);
        if (url) urls.push(url);
      }
      setDraft((d) => ({ ...d, images: [...d.images, ...urls] }));
      if (urls.length < files.length) setError("Some uploads failed.");
    }
    setUploading(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isPreview) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccess(true);
      }, 800);
      return;
    }
    if (!portfolioId) return;
    setIsSubmitting(true);
    setError(null);
    const { error: err } = await supabase.from("pro_site_reviews").insert({
      portfolio_id: portfolioId,
      reviewer_name: draft.name,
      rating: draft.rating,
      title: draft.title,
      content: draft.content,
      images: draft.images,
      video_url: draft.video_url,
      review_type: reviewType,
      is_published: false,
    });
    setIsSubmitting(false);
    if (err) setError("Failed to submit review.");
    else setSuccess(true);
  };

  const openForm = useCallback(() => {
    setIsFormOpen(true);
    setStep("select_type");
    setSuccess(false);
    setError(null);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setDraft(EMPTY);
    setSuccess(false);
  }, []);

  // The builder shows unpublished reviews so owners can preview the layout.
  const displayed = useMemo(() => (isPreview ? reviews : reviews.filter((r) => r.is_published)), [reviews, isPreview]);
  const textReviews = useMemo(() => displayed.filter((r) => r.review_type !== "video"), [displayed]);
  const videoReviews = useMemo(() => displayed.filter((r) => r.review_type === "video"), [displayed]);

  const average = displayed.length
    ? displayed.reduce((sum, r) => sum + (r.rating || 5), 0) / displayed.length
    : 0;

  return {
    loading,
    reviews: displayed,
    textReviews,
    videoReviews,
    average,
    // submission form
    isFormOpen,
    openForm,
    closeForm,
    step,
    setStep,
    reviewType,
    setReviewType,
    draft,
    setDraft,
    uploadMedia,
    uploading,
    submit,
    isSubmitting,
    success,
    error,
  };
}
