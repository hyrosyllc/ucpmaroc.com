import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Check,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Tag,
  Loader2,
  X,
  Send,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineEdit } from "../../components/dashboard/InlineEdit";
import { supabase } from "@/supabaseClient";

// Helper to get icon for field type
const getFieldIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail size={14} />;
    case "tel":
      return <Phone size={14} />;
    case "textarea":
      return <MessageSquare size={14} />;
    case "date":
      return <Calendar size={14} />;
    default:
      return <User size={14} />;
  }
};

// Helper to safely parse options
const parseOptions = (optString?: string) => {
  if (!optString) return [];
  return optString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const Pricing: React.FC<any> = ({
  data,
  settings = {},
  id,
  isPreview,
  actorId,
  portfolioId,
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  const plans = data.plans || [];
  const hasPlans = plans.length > 0;
  const variant = settings.variant || data.variant || "cards";

  // --- RAW FORM MODAL STATE ---
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [formTemplate, setFormTemplate] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  if (!hasPlans && !isPreview) return null;

  // --- SCROLL LOGIC ---
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const amount = carouselRef.current.clientWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  // --- ACTION HANDLER ---
  const handlePlanAction = async (plan: any, e: React.MouseEvent) => {
    if (isPreview) {
      e.preventDefault();
      return;
    }

    if (plan.actionType === "form" && plan.formId) {
      e.preventDefault();
      setActivePlan(plan);
      setIsModalOpen(true);
      setIsLoadingForm(true);
      setIsSuccess(false);
      setFormValues({});

      const { data: formData } = await supabase
        .from("forms")
        .select("*")
        .eq("id", plan.formId)
        .single();

      if (formData) {
        setFormTemplate(formData);
      }
      setIsLoadingForm(false);
    }
  };

  // --- SUBMIT HANDLER ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorId || !activePlan) return;

    setIsSubmitting(true);

    // Smart Field Extractor (Matches what users type to database columns)
    const getFieldVal = (keywords: string[]) => {
      const key = Object.keys(formValues).find((k) =>
        keywords.some((keyword) => k.toLowerCase().includes(keyword))
      );
      return key ? formValues[key] : "";
    };

    const customerName = getFieldVal(["name", "first", "last"]) || "Anonymous";
    const customerEmail =
      getFieldVal(["email", "mail"]) || "no-email@provided.com";
    const customerPhone = getFieldVal(["phone", "tel", "mobile"]) || null;
    const customerMessage =
      getFieldVal(["message", "inquiry", "details"]) || "";

    const dbPayload: any = {
      actor_id: actorId,
      portfolio_id: portfolioId,
      source: "pricing_form",
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      subject: `Inquiry for ${activePlan.name} Plan`,
      message: customerMessage,
      metadata: {
        "Plan Name": activePlan.name,
        "Plan Price": activePlan.price,
      },
    };

    // Dump all custom remaining fields into metadata
    if (formTemplate?.fields) {
      formTemplate.fields.forEach((f: any) => {
        const isCoreField = [
          "name",
          "first",
          "last",
          "email",
          "mail",
          "phone",
          "tel",
          "message",
          "inquiry",
        ].some(
          (kw) =>
            f.id.toLowerCase().includes(kw) ||
            f.label.toLowerCase().includes(kw)
        );

        if (!isCoreField) {
          dbPayload.metadata[f.label] = formValues[f.id];
        }
      });
    }

    const { error } = await supabase.from("leads").insert(dbPayload);
    setIsSubmitting(false);

    if (error) {
      console.error("Lead Error:", error);
      alert("Failed to send message. Please try again.");
    } else {
      setIsSuccess(true);
    }
  };

  // --- SUB-COMPONENT: PRICING CARD ---
  const PricingCard = ({ plan }: { plan: any }) => {
    const isPopular = plan.isPopular;
    const isExternal =
      plan.actionType !== "form" && plan.buttonUrl?.startsWith("http");
    const linkTarget = isExternal ? "_blank" : "_self";
    const href =
      plan.actionType === "form" ? "#" : plan.buttonUrl || "#contact";

    const features = (plan.features || "")
      .split(",")
      .map((f: string) => f.trim())
      .filter(Boolean);

    return (
      <div
        className={cn(
          "relative group h-full flex flex-col p-8 md:p-10 rounded-[2.5rem] transition-all duration-700 border",
          isPopular
            ? "bg-neutral-50 border-primary/50 shadow-2xl scale-[1.02] z-10 ring-1 ring-primary/20"
            : "bg-black/5 border-black/10 hover:border-black/20 hover:bg-black/10"
        )}
      >
        {isPopular && (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none rounded-[2.5rem]" />
        )}
        {isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-black px-5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 whitespace-nowrap z-20">
            <Sparkles className="w-3.5 h-3.5 fill-black" /> Popular
          </div>
        )}

        <div className="mb-8 text-center relative z-10 pointer-events-none">
          <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4 font-bold">
            {plan.name || "Plan Name"}
          </h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl md:text-6xl font-black text-neutral-900 tracking-tighter">
              {plan.price || "$0"}
            </span>
            {plan.unit && (
              <span className="text-lg text-neutral-600 font-medium">
                {plan.unit.startsWith("/") ? plan.unit : `/${plan.unit}`}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "h-px w-full mb-8",
            isPopular ? "bg-primary/30" : "bg-black/5"
          )}
        />

        <ul className="space-y-4 flex-grow relative z-10 mb-10 pointer-events-none">
          {features.map((feat: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-neutral-700 font-medium"
            >
              <div
                className={cn(
                  "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                  isPopular ? "bg-primary text-black" : "bg-black/5 text-neutral-900"
                )}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="opacity-90 leading-relaxed">{feat}</span>
            </li>
          ))}
          {features.length === 0 && (
            <li className="text-sm text-neutral-500 italic text-center">
              No features listed
            </li>
          )}
        </ul>

        <div className="relative z-10 mt-auto">
          <Button
            asChild
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold transition-all duration-300 hover:scale-105",
              isPopular
                ? "bg-primary hover:bg-primary/90 text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                : "bg-white text-black hover:bg-neutral-200 shadow-xl"
            )}
          >
            <a
              href={href}
              target={linkTarget}
              rel={isExternal ? "noopener noreferrer" : undefined}
              onClick={(e) => handlePlanAction(plan, e)}
            >
              {plan.cta || "Get Started"}
              {isExternal && (
                <ExternalLink className="ml-2 w-4 h-4 opacity-50" />
              )}
            </a>
          </Button>
        </div>
      </div>
    );
  };

  // --- SUB-COMPONENT: RATE CARD ITEM ---
  const RateCardItem = ({ plan }: { plan: any }) => {
    const isExternal =
      plan.actionType !== "form" && plan.buttonUrl?.startsWith("http");
    const linkTarget = isExternal ? "_blank" : "_self";
    const href =
      plan.actionType === "form" ? "#" : plan.buttonUrl || "#contact";

    return (
      <div className="group relative border-b border-black/10 last:border-0 py-8 pointer-events-none md:pointer-events-auto transition-colors hover:bg-black/5 px-4 -mx-4 rounded-2xl">
        <div className="flex items-end justify-between w-full mb-3 pointer-events-none">
          <div className="flex items-end flex-grow min-w-0">
            <h3 className="text-xl md:text-2xl font-bold text-neutral-900 shrink-0 pr-4 bg-transparent tracking-tight">
              {plan.name || "Service"}
            </h3>
            <div className="flex-grow border-b-2 border-dotted border-black/20 relative -top-1.5 opacity-40 hidden md:block mx-2" />
          </div>
          <div className="text-2xl md:text-3xl font-mono text-primary font-bold shrink-0 pl-4">
            {plan.price || "$0"}
            {plan.unit && (
              <span className="text-sm text-neutral-500 ml-1 font-sans">
                /{plan.unit.replace("/", "")}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <p className="text-neutral-600 text-sm leading-relaxed max-w-xl pointer-events-none font-medium">
            {plan.features}
          </p>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 rounded-full border-black/20 text-neutral-700 hover:text-neutral-900 hover:border-primary hover:bg-primary/10 transition-all pointer-events-auto h-10 px-6"
          >
            <a
              href={href}
              target={linkTarget}
              rel={isExternal ? "noopener noreferrer" : undefined}
              onClick={(e) => handlePlanAction(plan, e)}
              className="flex items-center gap-2"
            >
              <span className="text-xs uppercase tracking-wider font-bold">
                {plan.cta || "Book"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  };

  const showImageCover = formTemplate?.image && !isLoadingForm && !isSuccess;

  return (
    <>
      {/* 🚀 THE AAA+ FORM MODAL (Missing from previous code!) */}
      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer animate-in fade-in duration-300"
              onClick={() => setIsModalOpen(false)}
            />

            <div
              className={cn(
                "relative w-full bg-white border-t sm:border border-black/10 rounded-t-[2rem] sm:rounded-[2.5rem] p-0 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-500 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden",
                showImageCover ? "sm:max-w-5xl sm:flex-row" : "sm:max-w-2xl"
              )}
            >
              {/* Mobile Handle & Close */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/10 rounded-full sm:hidden pointer-events-none z-50" />
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full z-50 transition-colors",
                  showImageCover
                    ? "text-neutral-900 bg-black/20 hover:bg-white/50"
                    : "text-neutral-600 hover:text-neutral-900 bg-black/5 hover:bg-black/5"
                )}
                onClick={() => setIsModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>

              {/* SPLIT SCREEN IMAGE */}
              {showImageCover && (
                <div className="hidden sm:flex sm:w-2/5 relative border-r border-black/10 bg-neutral-50 shrink-0">
                  <img
                    src={formTemplate.image}
                    alt="Cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-neutral-950/20 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8 z-10 space-y-2">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-primary/20 mb-2">
                      Selected Plan
                    </div>
                    <h3 className="text-3xl font-black text-neutral-900 tracking-tight leading-tight drop-shadow-lg">
                      {activePlan?.name}
                    </h3>
                    <p className="text-primary font-mono font-bold text-2xl drop-shadow-md">
                      {activePlan?.price}
                    </p>
                  </div>
                </div>
              )}

              {/* SCROLLABLE CONTENT */}
              <div
                className={cn(
                  "flex-grow overflow-y-auto no-scrollbar flex flex-col p-6 sm:p-10",
                  showImageCover ? "sm:w-3/5" : "w-full"
                )}
              >
                {isLoadingForm ? (
                  <div className="py-20 flex flex-col items-center justify-center text-primary h-full">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm text-neutral-600 font-medium">
                      Loading form...
                    </p>
                  </div>
                ) : !formTemplate ? (
                  <div className="py-20 text-center h-full flex items-center justify-center">
                    <p className="text-neutral-600">
                      Form template could not be loaded.
                    </p>
                  </div>
                ) : isSuccess ? (
                  <div className="py-16 text-center space-y-4 animate-in zoom-in-95 h-full flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/50">
                      <CheckCircle2 size={40} className="animate-in zoom-in" />
                    </div>
                    <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">
                      {formTemplate.success_title || "Request Sent!"}
                    </h3>
                    <p className="text-neutral-600 max-w-sm">
                      {formTemplate.success_message ||
                        `Thanks for inquiring about the ${activePlan?.name} plan. We'll be in touch.`}
                    </p>
                    <Button
                      className="mt-6 rounded-full px-8 bg-white text-black hover:bg-neutral-200"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8 mt-4 sm:mt-0">
                    <div className="text-left space-y-3 pb-6 border-b border-black/10">
                      <h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight pr-8">
                        {formTemplate.title || "Let's get started"}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {formTemplate.subheadline ||
                          "Please fill in your details below."}
                      </p>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        {(formTemplate.fields || []).map(
                          (field: any, idx: number) => {
                            const isHalf = field.width === "half";
                            const fieldOptions = parseOptions(field.options);

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "space-y-2",
                                  isHalf
                                    ? "col-span-1"
                                    : "col-span-1 sm:col-span-2"
                                )}
                              >
                                <Label className="text-neutral-600 flex items-center gap-2 text-xs uppercase tracking-widest font-bold ml-1">
                                  {getFieldIcon(field.type)} {field.label}{" "}
                                  {field.required && (
                                    <span className="text-primary">*</span>
                                  )}
                                </Label>

                                {field.type === "textarea" ? (
                                  <Textarea
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    className="bg-black/5 border-black/10 focus-visible:border-primary text-neutral-900 min-h-[100px] resize-none rounded-xl"
                                    value={formValues[field.id] || ""}
                                    onChange={(e) =>
                                      setFormValues({
                                        ...formValues,
                                        [field.id]: e.target.value,
                                      })
                                    }
                                  />
                                ) : field.type === "select" ? (
                                  <select
                                    required={field.required}
                                    className="w-full bg-black/5 border border-black/10 focus:border-primary text-neutral-900 h-12 rounded-xl px-4 text-sm appearance-none outline-none"
                                    value={formValues[field.id] || ""}
                                    onChange={(e) =>
                                      setFormValues({
                                        ...formValues,
                                        [field.id]: e.target.value,
                                      })
                                    }
                                  >
                                    <option
                                      value=""
                                      disabled
                                      className="text-neutral-900"
                                    >
                                      Select...
                                    </option>
                                    {fieldOptions.map(
                                      (opt: string, i: number) => (
                                        <option
                                          key={i}
                                          value={opt}
                                          className="text-neutral-900"
                                        >
                                          {opt}
                                        </option>
                                      )
                                    )}
                                  </select>
                                ) : field.type === "radio" ? (
                                  <div className="flex flex-col gap-2 pt-1">
                                    {fieldOptions.map(
                                      (opt: string, i: number) => (
                                        <label
                                          key={i}
                                          className="flex items-center gap-3 cursor-pointer group"
                                        >
                                          <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-black/20 group-hover:border-primary bg-black/5">
                                            <input
                                              type="radio"
                                              name={field.id}
                                              value={opt}
                                              required={field.required}
                                              className="peer sr-only"
                                              onChange={(e) =>
                                                setFormValues({
                                                  ...formValues,
                                                  [field.id]: e.target.value,
                                                })
                                              }
                                            />
                                            <div className="w-2 h-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100" />
                                          </div>
                                          <span className="text-neutral-700 text-sm font-medium">
                                            {opt}
                                          </span>
                                        </label>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <Input
                                    required={field.required}
                                    type={
                                      field.type === "email"
                                        ? "email"
                                        : field.type === "tel"
                                        ? "tel"
                                        : field.type === "date"
                                        ? "date"
                                        : "text"
                                    }
                                    placeholder={field.placeholder}
                                    className={cn(
                                      "bg-black/5 border-black/10 focus-visible:border-primary text-neutral-900 h-12 rounded-xl",
                                      field.type === "date" &&
                                        "[color-scheme:dark]"
                                    )}
                                    value={formValues[field.id] || ""}
                                    onChange={(e) =>
                                      setFormValues({
                                        ...formValues,
                                        [field.id]: e.target.value,
                                      })
                                    }
                                  />
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                      <div className="pt-4 border-t border-black/10">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-14 text-base font-bold rounded-xl bg-primary text-black hover:bg-primary/90 transition-transform hover:scale-[1.02]"
                        >
                          {isSubmitting ? (
                            <Loader2 className="animate-spin mr-2 w-5 h-5" />
                          ) : (
                            <Send className="mr-3 w-5 h-5" />
                          )}
                          {formTemplate.button_text || "Submit Request"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 🚀 THE ACTUAL PRICING SECTION */}
      <section
        className="relative py-24 md:py-32 bg-white overflow-hidden"
        id="pricing"
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container max-w-7xl mx-auto relative z-10 px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-4">
              <InlineEdit
                tagName="h2"
                className="text-4xl md:text-5xl lg:text-6xl font-black text-neutral-900 tracking-tighter block leading-tight"
                text={data.title || "Pricing Plans"}
                sectionId={id}
                fieldKey="title"
                isPreview={isPreview}
              />
            </div>
            <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
            <InlineEdit
              tagName="p"
              className="text-lg md:text-xl text-neutral-600 font-medium block"
              text={
                data.subheadline ||
                "Simple, transparent pricing. No hidden fees."
              }
              sectionId={id}
              fieldKey="subheadline"
              isPreview={isPreview}
            />
          </div>

          {!hasPlans && isPreview && (
            <div className="w-full py-24 border-2 border-dashed border-black/10 rounded-3xl flex flex-col items-center justify-center text-white/40 bg-black/5 backdrop-blur-sm">
              <Tag className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium tracking-wide">
                No pricing plans added yet.
              </p>
              <p className="text-xs mt-2 opacity-70">
                Hover over this section and click "Design" to add plans.
              </p>
            </div>
          )}

          {hasPlans && (
            <>
              {variant === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                  {plans.map((plan: any, i: number) => (
                    <PricingCard key={i} plan={plan} />
                  ))}
                </div>
              )}

              {variant === "slider" && (
                <div className="relative group/carousel -mx-6 px-6 md:mx-0 md:px-0">
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
                    className="flex overflow-x-auto pb-12 pt-4 gap-6 md:gap-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                  >
                    {plans.map((plan: any, i: number) => (
                      <div
                        key={i}
                        className="snap-center shrink-0 w-[85vw] sm:w-[400px] h-auto"
                      >
                        <PricingCard plan={plan} />
                      </div>
                    ))}
                  </div>

                  <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-white to-transparent pointer-events-none md:block hidden z-10" />
                  <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-white to-transparent pointer-events-none md:block hidden z-10" />
                </div>
              )}

              {variant === "list" && (
                <div className="max-w-4xl mx-auto bg-black/5 backdrop-blur-xl border border-black/10 rounded-[2.5rem] p-8 md:p-14 shadow-2xl ring-1 ring-black/5">
                  <div className="space-y-2">
                    {plans.map((plan: any, i: number) => (
                      <RateCardItem key={i} plan={plan} />
                    ))}
                  </div>

                  <div className="mt-14 text-center pt-8 border-t border-black/10">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-full px-12 h-14 bg-white text-black hover:bg-neutral-200 shadow-xl transition-all hover:scale-105 font-bold"
                    >
                      <a
                        href={data.ctaLink || "#contact"}
                        onClick={(e) => isPreview && e.preventDefault()}
                      >
                        <InlineEdit
                          tagName="span"
                          text={data.ctaText || "Contact for Custom Rates"}
                          sectionId={id}
                          fieldKey="ctaText"
                          isPreview={isPreview}
                        />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default Pricing;
