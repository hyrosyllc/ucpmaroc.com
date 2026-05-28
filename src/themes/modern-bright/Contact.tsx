import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mail,
  Phone,
  Linkedin,
  Instagram,
  Twitter,
  Globe,
  MessageCircle,
} from "lucide-react";
import { InlineEdit } from "../../components/dashboard/InlineEdit";

const Contact: React.FC<any> = ({ data, settings = {}, id, isPreview }) => {
  const variant = settings.variant || data.variant || "minimal";

  const cleanNumber = (num: string) => num.replace(/[^0-9]/g, "");

  // --- SUB-COMPONENT: SOCIAL ICONS ---
  const SocialIcons = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {data.linkedin && (
        <a
          href={data.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="p-3 rounded-full bg-black/5 hover:bg-primary/20 hover:text-primary hover:scale-110 transition-all text-neutral-600 ring-1 ring-black/5 hover:ring-primary/50"
        >
          <Linkedin className="w-5 h-5" />
        </a>
      )}
      {data.instagram && (
        <a
          href={data.instagram}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="p-3 rounded-full bg-black/5 hover:bg-pink-500/20 hover:text-pink-600 hover:scale-110 transition-all text-neutral-600 ring-1 ring-black/5 hover:ring-pink-500/50"
        >
          <Instagram className="w-5 h-5" />
        </a>
      )}
      {data.twitter && (
        <a
          href={data.twitter}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="p-3 rounded-full bg-black/5 hover:bg-black/10 hover:text-neutral-900 hover:scale-110 transition-all text-neutral-600 ring-1 ring-black/5 hover:ring-black/20"
        >
          <Twitter className="w-5 h-5" />
        </a>
      )}
      {data.website && (
        <a
          href={data.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => isPreview && e.preventDefault()}
          className="p-3 rounded-full bg-black/5 hover:bg-black/10 hover:text-neutral-900 hover:scale-110 transition-all text-neutral-600 ring-1 ring-black/5 hover:ring-black/20"
        >
          <Globe className="w-5 h-5" />
        </a>
      )}
    </div>
  );

  // --- SUB-COMPONENT: ACTION CLUSTER ---
  const ContactActions = ({
    align = "center",
  }: {
    align?: "center" | "start";
  }) => (
    <div
      className={cn(
        "flex flex-wrap gap-4",
        align === "center" ? "justify-center" : "justify-start"
      )}
    >
      <Button
        asChild
        size="lg"
        className="h-14 px-8 rounded-full text-base shadow-lg hover:shadow-xl transition-all bg-white text-black hover:bg-neutral-200 hover:scale-105 group border border-black/5"
      >
        <a
          href={`mailto:${data.email}`}
          onClick={(e) => isPreview && e.preventDefault()}
        >
          <Mail className="mr-2 w-5 h-5 group-hover:-rotate-12 transition-transform" />
          <InlineEdit
            tagName="span"
            text={data.ctaText || "Email Me"}
            sectionId={id}
            fieldKey="ctaText"
            isPreview={isPreview}
            className="font-bold tracking-wide"
          />
        </a>
      </Button>

      {data.whatsapp && (
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-14 px-8 rounded-full border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-700 hover:border-green-600 hover:scale-105 transition-all text-base"
        >
          <a
            href={`https://wa.me/${cleanNumber(data.whatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => isPreview && e.preventDefault()}
          >
            <MessageCircle className="mr-2 w-5 h-5" /> WhatsApp
          </a>
        </Button>
      )}

      {data.phone && (
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-14 px-8 rounded-full border-black/10 hover:bg-black/5 hover:text-neutral-900 hover:border-black/30 text-neutral-700 hover:scale-105 transition-all text-base"
        >
          <a
            href={`tel:${data.phone}`}
            onClick={(e) => isPreview && e.preventDefault()}
          >
            <Phone className="mr-2 w-5 h-5" /> Call
          </a>
        </Button>
      )}
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <section
      className="relative py-32 bg-white overflow-hidden text-neutral-900"
      id="contact"
    >
      {/* Global Atmosphere */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* VARIANT 1: MINIMAL */}
      {variant === "minimal" && (
        <div className="container mx-auto px-6 relative z-10 max-w-4xl text-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="space-y-6">
              <InlineEdit
                tagName="h2"
                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter block leading-none"
                text={data.title || "Let's Work Together"}
                sectionId={id}
                fieldKey="title"
                isPreview={isPreview}
              />
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
              <InlineEdit
                tagName="p"
                className="text-xl md:text-2xl text-neutral-600 leading-relaxed font-medium block max-w-2xl mx-auto"
                text={
                  data.subheadline || "Reach out to discuss your next project."
                }
                sectionId={id}
                fieldKey="subheadline"
                isPreview={isPreview}
              />
            </div>

            <div className="pt-6">
              <ContactActions align="center" />
            </div>

            <div className="pt-12 flex justify-center border-t border-black/10 w-3/4 mx-auto">
              <SocialIcons />
            </div>
          </div>
        </div>
      )}

      {/* VARIANT 2: SPLIT */}
      {variant === "split" && (
        <div className="container mx-auto px-6 relative z-10 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Image Side */}
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-neutral-50 border border-black/10 group order-2 lg:order-1 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {data.image ? (
                <img
                  src={data.image}
                  alt="Contact"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-black/5 text-neutral-400">
                  <Mail className="w-24 h-24 mb-4 opacity-20" />
                  <span className="text-sm font-medium tracking-widest uppercase opacity-40">
                    No Image Selected
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>

            {/* Info Side */}
            <div className="space-y-10 order-1 lg:order-2 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
              <div className="space-y-6">
                <InlineEdit
                  tagName="h2"
                  className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] block"
                  text={data.title || "Get In Touch"}
                  sectionId={id}
                  fieldKey="title"
                  isPreview={isPreview}
                />
                <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent rounded-full" />
                <InlineEdit
                  tagName="p"
                  className="text-xl text-neutral-700 leading-relaxed block font-medium"
                  text={
                    data.subheadline ||
                    "Reach out to discuss your next project."
                  }
                  sectionId={id}
                  fieldKey="subheadline"
                  isPreview={isPreview}
                />
              </div>

              <ContactActions align="start" />

              <div className="pt-10">
                <p className="text-xs tracking-widest uppercase text-neutral-500 font-bold mb-4">
                  Connect Socially
                </p>
                <SocialIcons />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VARIANT 3: CARD */}
      {variant === "card" && (
        <div className="relative w-full min-h-[70vh] flex items-center justify-center py-20 px-6">
          {/* Blurred Background Plate */}
          {data.image && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={data.image}
                className="w-full h-full object-cover opacity-40 blur-2xl scale-110 brightness-50"
                alt="bg"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white/90" />
            </div>
          )}

          <div className="w-full max-w-3xl relative z-10">
            <div className="bg-white/80 backdrop-blur-2xl border border-black/10 rounded-[3rem] p-10 md:p-16 lg:p-20 shadow-2xl text-center space-y-10 animate-in zoom-in-95 duration-1000 ring-1 ring-black/5">
              <div className="space-y-6">
                <InlineEdit
                  tagName="h2"
                  className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight block"
                  text={data.title || "Contact Me"}
                  sectionId={id}
                  fieldKey="title"
                  isPreview={isPreview}
                />
                <InlineEdit
                  tagName="p"
                  className="text-lg md:text-xl text-neutral-700 leading-relaxed block max-w-xl mx-auto"
                  text={
                    data.subheadline ||
                    "Reach out to discuss your next project."
                  }
                  sectionId={id}
                  fieldKey="subheadline"
                  isPreview={isPreview}
                />
              </div>

              <div className="flex justify-center">
                <ContactActions align="center" />
              </div>

              <div className="pt-10 border-t border-black/10 flex flex-col items-center gap-6 mt-10">
                <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold">
                  Or Connect On
                </span>
                <SocialIcons />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Contact;
