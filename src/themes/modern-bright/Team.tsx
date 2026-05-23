import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Linkedin,
  Instagram,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { InlineEdit } from "../../components/dashboard/InlineEdit";

const Team: React.FC<any> = ({ data, settings = {}, id, isPreview }) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const members = data.members || [];
  const hasMembers = members.length > 0;
  const variant = settings.variant || data.variant || "grid";

  // Hide on live site if empty
  if (!hasMembers && !isPreview) return null;

  // --- SCROLL LOGIC (For Carousel) ---
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const amount = carouselRef.current.clientWidth * 0.8; // Scroll almost a full page
      carouselRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  // --- SUB-COMPONENT: MEMBER CARD ---
  const MemberCard = ({
    member,
    className,
    isFeatured = false,
  }: {
    member: any;
    className?: string;
    isFeatured?: boolean;
  }) => (
    <div
      className={cn(
        "group relative rounded-3xl overflow-hidden border border-black/10 bg-neutral-50 shadow-xl transition-all duration-700 hover:-translate-y-2 hover:shadow-2xl hover:border-black/20 hover:ring-1 hover:ring-black/10",
        className
      )}
    >
      {/* IMAGE LAYER */}
      <div className="absolute inset-0 bg-white">
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 ease-out filter grayscale-[50%] group-hover:grayscale-0 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-50">
            <Users className="w-16 h-16 text-white/10" />
          </div>
        )}
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
      </div>

      {/* CONTENT LAYER */}
      <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end z-10">
        <div className="transform transition-transform duration-500 translate-y-6 group-hover:translate-y-0">
          
          {/* Role / Label */}
          <p className="text-primary font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-3">
            {member.role || "Team Member"}
            <span className="w-12 h-px bg-primary/50 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
          </p>

          {/* Name */}
          <h3
            className={cn(
              "font-black text-neutral-900 mb-2 leading-tight tracking-tight",
              isFeatured ? "text-4xl md:text-5xl lg:text-6xl" : "text-2xl md:text-3xl"
            )}
          >
            {member.name || "Unnamed Member"}
          </h3>
        </div>

        {/* Bio & Socials (Reveal on Hover via Grid Trick) */}
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out">
          <div className="overflow-hidden">
            {member.bio && (
              <p
                className={cn(
                  "text-neutral-700 leading-relaxed mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100",
                  isFeatured ? "text-lg max-w-lg font-medium" : "text-sm"
                )}
              >
                {member.bio}
              </p>
            )}

            {/* Social Icons */}
            <div className="flex gap-3 mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200 translate-y-4 group-hover:translate-y-0">
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => isPreview && e.preventDefault()}
                  className="p-3 bg-black/5 backdrop-blur-md rounded-full hover:bg-primary hover:text-black transition-all hover:scale-110"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {member.instagram && (
                <a
                  href={member.instagram}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => isPreview && e.preventDefault()}
                  className="p-3 bg-black/5 backdrop-blur-md rounded-full hover:bg-primary hover:text-black transition-all hover:scale-110"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="relative py-24 md:py-32 px-6 bg-white overflow-hidden">
      {/* Background Texture & Glow */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container max-w-7xl mx-auto relative z-10">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-4">
            {data.label && (
              <span className="text-primary font-mono text-xs tracking-widest uppercase block">
                <InlineEdit
                  tagName="span"
                  text={data.label}
                  sectionId={id}
                  fieldKey="label"
                  isPreview={isPreview}
                />
              </span>
            )}
            <InlineEdit
              tagName="h2"
              className="text-4xl md:text-5xl lg:text-6xl font-black text-neutral-900 tracking-tight block leading-tight"
              text={data.title || "Meet Our Team"}
              sectionId={id}
              fieldKey="title"
              isPreview={isPreview}
            />
          </div>
          
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
          
          {/* 🚀 NEW: Subheadline */}
          <InlineEdit
            tagName="p"
            className="text-lg md:text-xl text-neutral-600 font-medium block"
            text={data.subheadline || "The creative minds behind the magic."}
            sectionId={id}
            fieldKey="subheadline"
            isPreview={isPreview}
          />
        </div>

        {/* 🚀 EMPTY STATE UX */}
        {!hasMembers && isPreview && (
          <div className="w-full py-24 border-2 border-dashed border-black/10 rounded-3xl flex flex-col items-center justify-center text-white/40 bg-black/5 backdrop-blur-sm">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium tracking-wide">No team members added yet.</p>
            <p className="text-xs mt-2 opacity-70">Hover over this section and click "Design" to build your team.</p>
          </div>
        )}

        {hasMembers && (
          <>
            {/* === VARIANT 1: GRID === */}
            {variant === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {members.map((member: any, i: number) => (
                  <MemberCard key={member.id || i} member={member} className="h-[450px] lg:h-[500px]" />
                ))}
              </div>
            )}

            {/* === VARIANT 2: SPOTLIGHT === */}
            {variant === "spotlight" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2">
                  <MemberCard member={members[0]} className="h-[500px] lg:h-[600px]" isFeatured={true} />
                </div>
                <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  {members.slice(1, 3).map((member: any, i: number) => (
                    <MemberCard key={member.id || i} member={member} className="h-[400px] lg:h-[284px]" />
                  ))}
                </div>
                {members.length > 3 && (
                  <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
                    {members.slice(3).map((member: any, i: number) => (
                      <MemberCard key={member.id || i} member={member} className="h-[400px]" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* === VARIANT 3: CAROUSEL === */}
            {variant === "carousel" && (
              <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
                {/* 🚀 FIXED: Native buttons to prevent jitter */}
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/50 hover:bg-black/80 text-neutral-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md hidden md:flex border border-black/10 shadow-2xl hover:scale-105"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/50 hover:bg-black/80 text-neutral-900 rounded-full h-14 w-14 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 backdrop-blur-md hidden md:flex border border-black/10 shadow-2xl hover:scale-105"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>

                <div
                  ref={carouselRef}
                  className="flex overflow-x-auto gap-6 md:gap-8 pb-12 pt-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                >
                  {members.map((member: any, i: number) => (
                    <div key={member.id || i} className="snap-center shrink-0 w-[85vw] sm:w-[400px]">
                      <MemberCard member={member} className="h-[500px] md:h-[600px]" />
                    </div>
                  ))}
                </div>

                {/* Fade Edges */}
                <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-white to-transparent pointer-events-none md:block hidden z-10" />
                <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-white to-transparent pointer-events-none md:block hidden z-10" />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Team;