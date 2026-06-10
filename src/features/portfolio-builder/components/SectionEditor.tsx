// src/components/dashboard/SectionEditor.tsx

import React, { useState, useEffect } from "react";
import { useBuilderStore } from "../../../store/useBuilderStore"; // <-- ZUSTAND IMPORT
import { supabase } from "@/supabaseClient";
import { useSubscription } from "../../../context/SubscriptionContext";
import { verticalListSortingStrategy } from "@dnd-kit/sortable"; // 🚀 Add this next to rectSortingStrategy
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
// --- shadcn/ui Imports ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// --- Icons ---
import {
  Video,
  Map,
  Users,
  ShoppingBag,
  DollarSign,
  Trash2,
  FileText,
  X,
  Plus,
  Image as ImageIcon,
  Link as LinkIcon,
  MessageCircle,
  ExternalLink,
  Package,
  Monitor,
  Smartphone,
  Film,
  Instagram,
  Twitter,
  Youtube,
  Lock,
  Layers,
  Star,
  LayoutTemplate,
  Palette,
  BarChart,
  CheckCircle2,
  Type,
  Code,
  List,
  Play,
  Camera,
  Phone,
  Mail,
  Share2,
  UserPlus,
  GripVertical,
  MapPinned,
  MapPin,
  Settings2,
  Tag,
  CreditCard,
  MessageSquare,
  Save,
  Library,
  Copy,
  Pencil,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  ShoppingCart,
  Settings,
  Loader2,
  BookOpen,
  AlertTriangle,
} from "lucide-react";

import PortfolioMediaManager, {
  UnifiedMediaItem,
} from "./PortfolioMediaManager";
import { PortfolioSection } from "../types/portfolio";
import {
  THEME_REGISTRY,
  SECTION_COMPONENT_MAP,
  resolveThemeComponent,
} from "@/themes/registry";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/toggle-group";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import FormManager from "./FormManager";
import { HTML_TEMPLATES } from "@/features/portfolio-builder/config/html-templates"; // 🚀 Import Templates

const SiteReviewsManager = ({ portfolioId }: { portfolioId: string }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved">("pending");

  const fetchReviews = async () => {
    if (!portfolioId) return;
    const { data } = await supabase
      .from("pro_site_reviews")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .order("created_at", { ascending: false });
    if (data) setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [portfolioId]);

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("pro_site_reviews").update({ is_published: !current }).eq("id", id);
    setReviews(reviews.map((r) => (r.id === id ? { ...r, is_published: !current } : r)));
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    await supabase.from("pro_site_reviews").delete().eq("id", id);
    setReviews(reviews.filter((r) => r.id !== id));
  };

  const pending = reviews.filter((r) => !r.is_published);
  const approved = reviews.filter((r) => r.is_published);
  const display = tab === "pending" ? pending : approved;

  return (
    <div className="space-y-4 pt-6 mt-6 border-t border-border">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <Label className="text-base font-semibold">Manage Site Reviews</Label>
      </div>
      <div className="flex gap-2 bg-muted/50 p-1 rounded-lg border">
        <button className={cn("flex-1 text-xs font-semibold py-2 rounded-md transition-all", tab === "pending" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => setTab("pending")}>
          Pending ({pending.length})
        </button>
        <button className={cn("flex-1 text-xs font-semibold py-2 rounded-md transition-all", tab === "approved" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")} onClick={() => setTab("approved")}>
          Approved ({approved.length})
        </button>
      </div>
      <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : display.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">No reviews in this tab.</div>
        ) : (
          display.map((r) => (
            <div key={r.id} className="bg-background border rounded-xl p-3 shadow-sm flex flex-col gap-2">
              {r.image_url && <img src={r.image_url} alt="Review" className="w-full h-24 object-cover rounded-md border" />}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">{r.reviewer_name}</span>
                  <div className="flex gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => <Star key={i} size={10} className={cn("fill-current", i < r.rating ? "text-amber-500" : "text-muted")} />)}
                  </div>
                </div>
                <span className="text-xs font-semibold block">{r.title}</span>
                <p className="text-xs text-muted-foreground italic line-clamp-3">"{r.content}"</p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border/50 mt-1">
                <Button size="sm" variant={r.is_published ? "outline" : "default"} className={cn("flex-1 h-8 text-[10px] font-bold", !r.is_published && "bg-green-500 hover:bg-green-600 text-white")} onClick={() => togglePublish(r.id, r.is_published)}>
                  {r.is_published ? "Hide Review" : "Approve Review"}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => deleteReview(r.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// 🚀 NEW: Draggable Menu Item Component
const DraggableMenuItem = ({
  item,
  dragHandleProps,
  updateMenuConfig,
  updateCustomLink,
  isMegaMenu,
  megaFolders,
}: any) => {
  const { type, id, data } = item;
  const { isVisible, label, url, folderId } = data;

  const itemIcons = {
    page: <FileText size={14} />,
    custom_link: <LinkIcon size={14} />,
    section: <Layers size={14} />,
  };

  return (
    <div className="flex items-start gap-2 bg-background p-3 border rounded-lg shadow-sm group">
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors flex-shrink-0 touch-none pt-2.5"
      >
        <GripVertical size={16} />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <Switch
            checked={isVisible}
            onCheckedChange={(c) => {
              if (type === "custom_link") {
                updateCustomLink(id, "visible", c);
              } else {
                updateMenuConfig(id, "visible", c);
              }
            }}
          />
          <div className="flex-1">
            <Input
              value={label}
              onChange={(e) => {
                if (type === "custom_link") {
                  updateCustomLink(id, "label", e.target.value);
                } else {
                  updateMenuConfig(id, "label", e.target.value);
                }
              }}
              disabled={!isVisible}
              className="h-8 text-sm"
            />
          </div>
          <Badge
            variant="outline"
            className="hidden sm:flex items-center gap-1.5 text-muted-foreground font-medium"
          >
            {itemIcons[type]}
            <span className="text-[10px] uppercase tracking-wider">
              {type.replace("_", " ")}
            </span>
          </Badge>
        </div>
        {type === "custom_link" && (
          <Input
            value={url}
            placeholder="https:// or /page-slug"
            onChange={(e) => updateCustomLink(id, "url", e.target.value)}
            disabled={!isVisible}
            className="h-8 text-xs text-muted-foreground"
          />
        )}
        {isMegaMenu && (
          <div className="pt-1">
            <Select
              value={folderId || "none"}
              onValueChange={(val) => {
                const newFolderId = val === "none" ? null : val;
                if (type === "custom_link") {
                  updateCustomLink(id, "folderId", newFolderId);
                } else {
                  updateMenuConfig(id, "folderId", newFolderId);
                }
              }}
            >
              <SelectTrigger className="w-full h-8 text-xs bg-background/50">
                <SelectValue placeholder="Parent Folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Folder (Root Level)</SelectItem>
                {megaFolders.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label || "Unnamed Folder"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};

interface SectionEditorProps {
  section: PortfolioSection | null;
  sections: PortfolioSection[]; // Kept for backwards compatibility if needed
  isOpen: boolean;
  isInline: boolean;
  onClose: () => void;
  // onSave is no longer needed! Zustand handles it.
  actorId: string;
  themeId?: string;
  pages?: any[]; // 🚀 1. ADD THIS HERE
  portfolioId: string; // 🚀 ADD THIS PROP
}
// 🚀 NEW: Standalone Sortable Item for Shop Products (Accordion & Duplication)
const SortableShopProduct = ({
  product,
  idx,
  updateProduct,
  removeProduct,
  duplicateProduct,
  setActiveMediaField,
  setIsMediaPickerOpen,
  setIsFormManagerOpen, // 🚀 ADD THIS
  savedForms = [],
}: any) => {
  const [isExpanded, setIsExpanded] = useState(idx === 0); // Open the first one by default

  const sortableId = product.id || `shop-product-${idx}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  const images = product.images || (product.image ? [product.image] : []);

  const moveImage = (imgIdx: number, direction: number) => {
    const newImages = [...images];
    if (direction === -1 && imgIdx > 0) {
      [newImages[imgIdx], newImages[imgIdx - 1]] = [
        newImages[imgIdx - 1],
        newImages[imgIdx],
      ];
    } else if (direction === 1 && imgIdx < newImages.length - 1) {
      [newImages[imgIdx], newImages[imgIdx + 1]] = [
        newImages[imgIdx + 1],
        newImages[imgIdx],
      ];
    }
    updateProduct(idx, "images", newImages);
    updateProduct(idx, "image", newImages[0] || "");
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-xl bg-background shadow-sm transition-all relative group overflow-hidden",
        isDragging
          ? "ring-2 ring-primary shadow-2xl opacity-90 scale-[0.98]"
          : "hover:border-primary/30"
      )}
    >
      {/* 🚀 ACCORDION HEADER */}
      <div
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer select-none transition-colors hover:bg-muted/30",
          isExpanded && "border-b bg-muted/10"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors flex-shrink-0 touch-none py-2"
          onClick={(e) => e.stopPropagation()} // Prevent drag from toggling accordion
        >
          <GripVertical size={16} />
        </div>

        {/* Thumbnail Preview */}
        <div className="w-10 h-10 rounded bg-muted/50 border overflow-hidden shrink-0">
          {images[0] ? (
            <img
              src={images[0]}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag className="w-4 h-4 m-auto mt-3 text-muted-foreground opacity-30" />
          )}
        </div>

        {/* Summary */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">
            {product.title || "Unnamed Product"}
          </div>
          <div className="text-[10px] text-muted-foreground flex gap-2">
            <span className="font-mono text-primary font-bold">
              {product.price || "$0.00"}
            </span>
            <span>• {images.length} images</span>
            {product.variants?.length > 0 && (
              <span>• {product.variants.length} options</span>
            )}
          </div>
        </div>

        {/* Actions (Duplicate / Delete) */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => duplicateProduct(idx)}
            title="Duplicate Product"
          >
            <Copy size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => removeProduct(idx)}
            title="Delete Product"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* 🚀 EXPANDABLE CONTENT */}
      {isExpanded && (
        <div className="p-5 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
          {/* 1. MEDIA GALLERY */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Product Gallery
            </Label>
            <div className="flex flex-wrap gap-2">
              {images.map((imgUrl: string, imgIdx: number) => (
                <div
                  key={imgIdx}
                  className="relative group/thumb w-20 h-20 border rounded-lg overflow-hidden bg-muted/30 shrink-0"
                >
                  <img
                    src={imgUrl}
                    className="w-full h-full object-cover"
                    alt="thumb"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex flex-col justify-between p-1">
                    <div className="flex justify-between">
                      <button
                        className="text-white hover:text-primary disabled:opacity-30 p-1"
                        disabled={imgIdx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImage(imgIdx, -1);
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        className="text-white hover:text-primary disabled:opacity-30 p-1"
                        disabled={imgIdx === images.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveImage(imgIdx, 1);
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 flex justify-center w-full pb-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newImages = [...images];
                        newImages.splice(imgIdx, 1);
                        updateProduct(idx, "images", newImages);
                        updateProduct(idx, "image", newImages[0] || "");
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {imgIdx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-[8px] text-primary-foreground text-center font-bold uppercase py-0.5 pointer-events-none">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              <div
                className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors shrink-0"
                onClick={() => {
                  setActiveMediaField(`product-gallery-add-${idx}`);
                  setIsMediaPickerOpen(true);
                }}
              >
                <Plus size={16} />
                <span className="text-[9px] font-semibold mt-1">ADD IMAGE</span>
              </div>
            </div>
          </div>

          {/* 2. CORE DETAILS */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Product Title
              </Label>
              <Input
                placeholder="e.g. Premium Leather Bag"
                value={product.title || ""}
                onChange={(e) => updateProduct(idx, "title", e.target.value)}
                className="font-bold"
              />
            </div>
            <div className="col-span-4 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Price
              </Label>
              <Input
                placeholder="$99.00"
                value={product.price || ""}
                onChange={(e) => updateProduct(idx, "price", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="col-span-4 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                Sale Price <Tag size={10} className="text-orange-500" />
              </Label>
              <Input
                placeholder="$79.00 (Opt)"
                value={product.salePrice || ""}
                onChange={(e) =>
                  updateProduct(idx, "salePrice", e.target.value)
                }
                className="font-mono text-sm text-orange-600"
              />
            </div>
            <div className="col-span-4 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Stock
              </Label>
              <Input
                placeholder="In Stock"
                value={product.stock || ""}
                onChange={(e) => updateProduct(idx, "stock", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="col-span-12 space-y-1.5 pt-2">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Description
              </Label>
              <Textarea
                placeholder="Detailed product description..."
                value={product.description || ""}
                onChange={(e) =>
                  updateProduct(idx, "description", e.target.value)
                }
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>

          {/* 3. PURCHASE ACTION */}
          <div className="p-3 bg-muted/20 border rounded-lg space-y-3">
            <div className="flex items-center gap-2 border-b border-muted-foreground/10 pb-2">
              <ShoppingCart size={14} className="text-primary" />
              <Label className="text-[10px] font-bold uppercase tracking-wider">
                Purchase Setup
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">
                  Action Type
                </Label>
                <Select
                  value={product.actionType || "whatsapp"}
                  onValueChange={(val) => updateProduct(idx, "actionType", val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp Order</SelectItem>
                    <SelectItem value="form_order">
                      Custom Order Form
                    </SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">
                  Button Label
                </Label>
                <Input
                  placeholder="e.g. Buy Now"
                  value={product.buttonText || ""}
                  onChange={(e) =>
                    updateProduct(idx, "buttonText", e.target.value)
                  }
                  className="h-8 text-xs bg-background font-medium"
                />
              </div>
            </div>

            <div className="pt-1">
              {product.actionType === "link" && (
                <Input
                  placeholder="https://..."
                  value={product.checkoutUrl || ""}
                  onChange={(e) =>
                    updateProduct(idx, "checkoutUrl", e.target.value)
                  }
                  className="h-8 text-xs bg-background"
                />
              )}
              {product.actionType === "whatsapp" && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-1.5 rounded border">
                    wa.me/
                  </span>
                  <Input
                    placeholder="212600000000"
                    value={product.whatsappNumber || ""}
                    onChange={(e) =>
                      updateProduct(idx, "whatsappNumber", e.target.value)
                    }
                    className="h-8 text-xs bg-background flex-grow"
                  />
                </div>
              )}
              {product.actionType === "form_order" && (
                <div className="space-y-1.5 p-2 bg-orange-500/5 border border-orange-500/20 rounded">
                  <Label className="text-[10px] text-orange-600 font-bold uppercase tracking-wider flex items-center justify-between">
                    Select Checkout Form
                  </Label>
                  <Select
                    value={product.formId || ""}
                    onValueChange={(val) => updateProduct(idx, "formId", val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background border-orange-500/30">
                      <SelectValue placeholder="Choose a checkout form..." />
                    </SelectTrigger>
                    <SelectContent className="z-[100000]">
                      {savedForms &&
                      savedForms.filter((f: any) => f.type === "checkout")
                        .length > 0 ? (
                        savedForms
                          .filter((f: any) => f.type === "checkout") // 🚀 FIX: Only show Checkout forms!
                          .map((f: any) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No checkout forms created yet
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[10px] mt-1 border-dashed border-orange-500/30 text-orange-600 hover:text-orange-700 hover:bg-orange-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (setIsFormManagerOpen) setIsFormManagerOpen(true);
                    }}
                  >
                    <Settings className="w-3 h-3 mr-1.5" /> Manage Forms
                  </Button>
                  <p className="text-[9px] text-muted-foreground pt-1 leading-tight">
                    When a user submits this form, it will automatically save to
                    your{" "}
                    <span className="font-bold text-foreground">
                      Orders Dashboard
                    </span>{" "}
                    instead of your Leads.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. ADVANCED VARIANTS (AAA+) */}
          <div className="space-y-3 pt-2 border-t border-muted-foreground/10">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <ListPlus size={14} /> Product Variants
              </Label>
              <Button
                size="sm"
                variant="secondary"
                className="h-6 text-[10px] px-2"
                onClick={() => {
                  const current = product.variants || [];
                  updateProduct(idx, "variants", [
                    ...current,
                    {
                      name: "Size",
                      options: [
                        { label: "Small", price: "" },
                        { label: "Large", price: "10" },
                      ],
                    },
                  ]);
                }}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Variant Type
              </Button>
            </div>

            <div className="space-y-3">
              {(product.variants || []).map((v: any, vIdx: number) => {
                // 🚀 THE FIX: Safely parse old strings AND new objects!
                const optionsArray = Array.isArray(v.options)
                  ? v.options.map((o: any) =>
                      typeof o === "string" ? { label: o.trim(), price: "" } : o
                    )
                  : typeof v.options === "string"
                  ? v.options
                      .split(",")
                      .map((s: string) => ({ label: s.trim(), price: "" }))
                  : [];

                return (
                  <div
                    key={vIdx}
                    className="bg-muted/10 p-3 rounded-lg border space-y-3 relative group/variant"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/variant:opacity-100 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const newVars = [...product.variants];
                        newVars.splice(vIdx, 1);
                        updateProduct(idx, "variants", newVars);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>

                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">
                        Variant Name
                      </Label>
                      <Input
                        placeholder="e.g. Size, Color, Material"
                        value={v.name || ""}
                        onChange={(e) => {
                          const newVars = [...product.variants];
                          newVars[vIdx].name = e.target.value;
                          updateProduct(idx, "variants", newVars);
                        }}
                        className="h-8 text-xs font-semibold w-2/3"
                      />
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                      {optionsArray.map((opt: any, optIdx: number) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <Input
                            placeholder="Option (e.g. Large)"
                            value={opt.label}
                            onChange={(e) => {
                              const newVars = [...product.variants];
                              // Make sure we are writing to an object array
                              newVars[vIdx].options = [...optionsArray];
                              newVars[vIdx].options[optIdx].label =
                                e.target.value;
                              updateProduct(idx, "variants", newVars);
                            }}
                            className="h-8 text-xs bg-background flex-grow"
                          />

                          <div className="relative w-1/3">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                              +
                            </span>
                            <Input
                              placeholder="Price (Opt)"
                              value={opt.price}
                              onChange={(e) => {
                                const newVars = [...product.variants];
                                newVars[vIdx].options = [...optionsArray];
                                newVars[vIdx].options[optIdx].price =
                                  e.target.value;
                                updateProduct(idx, "variants", newVars);
                              }}
                              className="h-8 text-xs bg-background pl-5"
                              title="Leave blank to inherit main price"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => {
                              const newVars = [...product.variants];
                              newVars[vIdx].options = [...optionsArray];
                              newVars[vIdx].options.splice(optIdx, 1);
                              updateProduct(idx, "variants", newVars);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] text-primary hover:bg-primary/10 mt-1"
                        onClick={() => {
                          const newVars = [...product.variants];
                          newVars[vIdx].options = [...optionsArray];
                          newVars[vIdx].options.push({
                            label: "New Option",
                            price: "",
                          });
                          updateProduct(idx, "variants", newVars);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Option
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. FAQs / PRODUCT DETAILS */}
          <div className="space-y-3 pt-2 border-t border-muted-foreground/10">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold flex items-center gap-2">
                <HelpCircle size={14} /> Details & FAQs
              </Label>
              <Button
                size="sm"
                variant="secondary"
                className="h-6 text-[10px] px-2"
                onClick={() => {
                  const current = product.faqs || [];
                  updateProduct(idx, "faqs", [
                    ...current,
                    {
                      question: "Shipping Info",
                      answer: "Ships within 24 hours.",
                    },
                  ]);
                }}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Detail
              </Button>
            </div>

            <div className="space-y-2">
              {(product.faqs || []).map((faq: any, fIdx: number) => (
                <div
                  key={fIdx}
                  className="bg-muted/10 border rounded-lg p-3 space-y-2 relative group/faq"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/faq:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const newFaqs = [...product.faqs];
                      newFaqs.splice(fIdx, 1);
                      updateProduct(idx, "faqs", newFaqs);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <Input
                    placeholder="Title / Question (e.g. Materials)"
                    value={faq.question}
                    onChange={(e) => {
                      const newFaqs = [...product.faqs];
                      newFaqs[fIdx].question = e.target.value;
                      updateProduct(idx, "faqs", newFaqs);
                    }}
                    className="h-8 text-xs font-semibold bg-background pr-8"
                  />
                  <Textarea
                    placeholder="Details..."
                    value={faq.answer}
                    onChange={(e) => {
                      const newFaqs = [...product.faqs];
                      newFaqs[fIdx].answer = e.target.value;
                      updateProduct(idx, "faqs", newFaqs);
                    }}
                    className="h-16 text-xs resize-none bg-background"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// 🚀 UPDATED: Standalone Sortable Item for Form Fields
const SortableFormField = ({
  field,
  idx,
  updateFieldData,
  removeField,
}: any) => {
  const sortableId = field.id || `form-field-${idx}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  const needsOptions = field.type === "select" || field.type === "radio";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-3 p-4 border rounded-xl bg-background shadow-sm transition-all relative group",
        isDragging && "ring-2 ring-primary shadow-2xl opacity-90 scale-[0.98]"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="mt-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors flex-shrink-0 touch-none"
      >
        <GripVertical size={20} />
      </div>

      <div className="flex-1 space-y-4">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeField(idx)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="grid grid-cols-12 gap-3 pr-8">
          <div className="col-span-12 md:col-span-6 space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Field Label
            </Label>
            <Input
              placeholder="e.g. First Name"
              value={field.label || ""}
              onChange={(e) => updateFieldData(idx, "label", e.target.value)}
              className="font-bold h-9"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="col-span-12 md:col-span-6 space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Input Type
            </Label>
            <Select
              value={field.type || "text"}
              onValueChange={(val) => updateFieldData(idx, "type", val)}
            >
              <SelectTrigger className="h-9 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Short Text</SelectItem>
                <SelectItem value="textarea">Long Text (Paragraph)</SelectItem>
                <SelectItem value="email">Email Address</SelectItem>
                <SelectItem value="tel">Phone Number</SelectItem>
                <SelectItem value="date">Date Picker</SelectItem>
                {/* 🚀 NEW: Advanced Field Types */}
                <SelectItem value="select">Dropdown (Select)</SelectItem>
                <SelectItem value="radio">Multiple Choice (Radio)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 🚀 NEW: Options Field for Select/Radio */}
        {needsOptions && (
          <div className="space-y-1.5 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Label className="text-[10px] uppercase tracking-widest text-primary font-bold">
              Choices (Comma Separated)
            </Label>
            <Input
              placeholder="e.g. Basic Plan, Pro Plan, Enterprise"
              value={field.options || ""}
              onChange={(e) => updateFieldData(idx, "options", e.target.value)}
              className="h-9 text-xs bg-background"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Placeholder Text
          </Label>
          <Input
            placeholder={
              needsOptions
                ? "Leave blank for dropdowns"
                : "e.g. Enter your name here..."
            }
            value={field.placeholder || ""}
            onChange={(e) =>
              updateFieldData(idx, "placeholder", e.target.value)
            }
            className="h-9 text-xs bg-muted/50"
            onPointerDown={(e) => e.stopPropagation()}
            disabled={needsOptions}
          />
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-dashed">
          <div className="flex items-center gap-2">
            <Switch
              id={`req-${sortableId}`}
              checked={field.required || false}
              onCheckedChange={(c) => updateFieldData(idx, "required", c)}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <Label
              htmlFor={`req-${sortableId}`}
              className="text-xs cursor-pointer font-medium"
            >
              Required
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`width-${sortableId}`}
              checked={field.width === "half"}
              onCheckedChange={(c) =>
                updateFieldData(idx, "width", c ? "half" : "full")
              }
              onPointerDown={(e) => e.stopPropagation()}
            />
            <Label
              htmlFor={`width-${sortableId}`}
              className="text-xs cursor-pointer font-medium"
            >
              50% Width
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};
// 🚀 NEW: Standalone Sortable Item for Pricing Plans (Upgraded with Form Actions)
const SortablePricingPlan = ({
  plan,
  idx,
  updatePlan,
  removePlan,
  setIsFormManagerOpen, // 🚀 ADD THIS
  savedForms = [],
}: any) => {
  const sortableId = plan.id || `pricing-plan-${idx}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-3 p-4 border rounded-xl bg-background shadow-sm transition-all relative group",
        isDragging && "ring-2 ring-primary shadow-2xl opacity-90 scale-[0.98]",
        plan.isPopular && "border-primary/50 bg-primary/5"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="mt-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors flex-shrink-0 touch-none"
      >
        <GripVertical size={20} />
      </div>

      <div className="flex-1 space-y-4">
        {/* Remove Button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removePlan(idx)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="grid grid-cols-12 gap-3 pr-8">
          <div className="col-span-12 md:col-span-5 space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Plan Name
            </Label>
            <Input
              placeholder="e.g. Pro Plan"
              value={plan.name || ""}
              onChange={(e) => updatePlan(idx, "name", e.target.value)}
              className="font-bold h-9"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="col-span-6 md:col-span-4 space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Price
            </Label>
            <Input
              placeholder="e.g. $99"
              value={plan.price || ""}
              onChange={(e) => updatePlan(idx, "price", e.target.value)}
              className="h-9 font-mono"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="col-span-6 md:col-span-3 space-y-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Unit
            </Label>
            <Input
              placeholder="/mo"
              value={plan.unit || ""}
              onChange={(e) => updatePlan(idx, "unit", e.target.value)}
              className="h-9 text-xs"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Features (Comma Separated)
          </Label>
          <Textarea
            placeholder="Feature 1, Feature 2, Feature 3..."
            value={plan.features || ""}
            onChange={(e) => updatePlan(idx, "features", e.target.value)}
            rows={2}
            className="text-xs resize-none"
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* 🚀 UPGRADED CHECKOUT / ACTION SETTINGS */}
        <div className="p-3 bg-muted/20 border rounded-md space-y-3">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Button Action
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">
                Button Text
              </Label>
              <Input
                placeholder="Get Started"
                value={plan.cta || ""}
                onChange={(e) => updatePlan(idx, "cta", e.target.value)}
                className="h-8 text-xs bg-background"
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">
                Action Type
              </Label>
              <Select
                value={plan.actionType || "link"}
                onValueChange={(val) => updatePlan(idx, "actionType", val)}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">URL / Link</SelectItem>
                  <SelectItem value="form">Open Lead Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional Input based on Action Type */}
          {plan.actionType === "form" ? (
            <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1">
              <Label className="text-[10px] text-primary font-bold">
                Select Form Template
              </Label>
              <Select
                value={plan.formId || ""}
                onValueChange={(val) => updatePlan(idx, "formId", val)}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-primary/30">
                  <SelectValue placeholder="Choose a saved form..." />
                </SelectTrigger>
                <SelectContent>
                  {savedForms?.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                  {(!savedForms || savedForms.length === 0) && (
                    <SelectItem value="none" disabled>
                      No templates saved. Go to a Form section to save one!
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {/* 🚀 NEW: Button explicitly placed here */}
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-[10px] mt-1 border-dashed text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFormManagerOpen(true);
                }}
              >
                <Settings className="w-3 h-3 mr-1.5" /> Manage Forms
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1">
              <Label className="text-[10px] text-muted-foreground">
                Button Link
              </Label>
              <Input
                placeholder="https://..."
                value={plan.buttonUrl || ""}
                onChange={(e) => updatePlan(idx, "buttonUrl", e.target.value)}
                className="h-8 text-xs bg-background"
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Switch
            id={`pop-${sortableId}`}
            checked={plan.isPopular || false}
            onCheckedChange={(c) => updatePlan(idx, "isPopular", c)}
            onPointerDown={(e) => e.stopPropagation()}
          />
          <Label
            htmlFor={`pop-${sortableId}`}
            className="text-[11px] font-semibold cursor-pointer text-primary"
          >
            Highlight as Popular Plan
          </Label>
        </div>
      </div>
    </div>
  );
};
const SortableMediaItem = ({ img, idx, isVid, ytId, onDelete }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.url }); // Use URL as unique ID

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative group aspect-square bg-black rounded-lg overflow-hidden border shadow-sm cursor-grab active:cursor-grabbing touch-none",
        isDragging && "ring-2 ring-primary opacity-50 scale-95"
      )}
    >
      {ytId ? (
        <>
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            className="w-full h-full object-cover opacity-80"
            alt="YT"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-red-600 p-1.5 rounded-lg text-white">
              <Play size={14} fill="currentColor" />
            </div>
          </div>
        </>
      ) : isVid ? (
        <>
          <video
            src={img.url}
            className="w-full h-full object-cover opacity-80"
            muted
            autoPlay
            loop
            playsInline
          />
          <div className="absolute top-1 left-1 bg-black/60 p-1 rounded-md text-white">
            <Video size={12} />
          </div>
        </>
      ) : (
        <img
          src={img.url}
          alt="Gallery"
          className="w-full h-full object-cover pointer-events-none"
        />
      )}

      {/* Delete Button - Needs onPointerDown stopPropagation to allow clicking inside a draggable area */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 rounded-full shadow-lg"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
// 🚀 NEW: Standalone Sortable Item for Team Members
const SortableTeamMember = ({
  member,
  idx,
  updateMember,
  removeMember,
  setActiveMediaField,
  setIsMediaPickerOpen,
}: any) => {
  // Use a fallback ID if the member doesn't have a unique ID yet
  const sortableId = member.id || `team-member-${idx}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-3 p-4 border rounded-xl bg-background shadow-sm transition-all relative group",
        isDragging && "ring-2 ring-primary shadow-2xl opacity-90 scale-[0.98]"
      )}
    >
      {/* Drag Handle - Only this part triggers the drag! */}
      <div
        {...attributes}
        {...listeners}
        className="mt-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors flex-shrink-0 touch-none"
      >
        <GripVertical size={20} />
      </div>

      <div className="flex-1 space-y-4">
        {/* Remove Button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => removeMember(idx)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <div className="flex gap-4 items-start pr-8">
          {/* Image Picker */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex-shrink-0 relative overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-colors group/img"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setActiveMediaField(`member-image-${idx}`);
              setIsMediaPickerOpen(true);
            }}
          >
            {member.image ? (
              <img
                src={member.image}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                alt={member.name}
              />
            ) : (
              <Users className="w-6 h-6 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white uppercase tracking-wider font-bold">
              Edit
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-grow space-y-2">
            <Input
              placeholder="Full Name"
              value={member.name || ""}
              onChange={(e) => updateMember(idx, "name", e.target.value)}
              className="font-bold h-9"
              onPointerDown={(e) => e.stopPropagation()}
            />
            <Input
              placeholder="Role / Title (e.g. Lead Designer)"
              value={member.role || ""}
              onChange={(e) => updateMember(idx, "role", e.target.value)}
              className="text-xs h-8 text-muted-foreground"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Short Bio
          </Label>
          <Textarea
            placeholder="A brief introduction..."
            value={member.bio || ""}
            onChange={(e) => updateMember(idx, "bio", e.target.value)}
            rows={2}
            className="text-xs resize-none"
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-[10px]">
              IN
            </span>
            <Input
              placeholder="LinkedIn URL"
              value={member.linkedin || ""}
              onChange={(e) => updateMember(idx, "linkedin", e.target.value)}
              className="pl-8 text-xs h-8 bg-muted/50"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-[10px]">
              IG
            </span>
            <Input
              placeholder="Instagram URL"
              value={member.instagram || ""}
              onChange={(e) => updateMember(idx, "instagram", e.target.value)}
              className="pl-8 text-xs h-8 bg-muted/50"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  sections,
  pages = [], // 🚀 2. EXTRACT IT HERE (with a default empty array)
  isOpen,
  isInline, // 🚀 YOU MUST ADD THIS HERE!
  onClose,
  actorId,
  themeId = "modern",
  portfolioId, // 🚀 2. DESTRUCTURE THIS
}) => {
  // --- ZUSTAND HOOK ---
  // We grab the update action from the store.
  const updateSectionInStore = useBuilderStore((state) => state.updateSection);

  // --- LOCAL UI STATE ---
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isFormManagerOpen, setIsFormManagerOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<string>("");
  const [isProductManagerOpen, setIsProductManagerOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState(section?.data || {});
  const [isHtmlDocsOpen, setIsHtmlDocsOpen] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false); // 🚀 Template Modal State

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { limits } = useSubscription();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  // Tier 2 is eCommerce, Tier 3 is Pro
  const hasMegaMenuAccess = limits?.hasMegaMenu === true;

  // Put this near the top of your SectionEditor component
  const [savedForms, setSavedForms] = useState<any[]>([]); // 🚀 STATE FOR FETCHED FORMS

  // 🚀 FIXED: Fetch by portfolioId because the forms table doesn't use actorId!
  const fetchForms = async () => {
    if (!portfolioId) return;
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("portfolio_id", portfolioId) // Changed from actor_id
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedForms(data);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [portfolioId]);

  // 🚀 AAA+ GLOBAL TEMPLATE AUTO-SAVE ENGINE
  useEffect(() => {
    if (
      section?.type !== "lead_form" ||
      !formData.formId ||
      formData.formId === "custom"
    )
      return;

    const autoSaveTemplate = async () => {
      await supabase
        .from("forms")
        .update({
          title: formData.title,
          subheadline: formData.subheadline,
          button_text: formData.buttonText,
          success_title: formData.successTitle,
          success_message: formData.successMessage,
          variant: formData.variant, // 🚀 Now saving layout
          image: formData.image, // 🚀 Now saving image
          fields: formData.fields || [],
        })
        .eq("id", formData.formId);

      // Update the local list so the renaming/duplicating uses the freshest data
      setSavedForms((prev) =>
        prev.map((f) =>
          f.id === formData.formId
            ? {
                ...f,
                title: formData.title,
                subheadline: formData.subheadline,
                button_text: formData.buttonText,
                success_title: formData.successTitle,
                success_message: formData.successMessage,
                variant: formData.variant,
                image: formData.image,
                fields: formData.fields || [],
              }
            : f
        )
      );
    };

    const timer = setTimeout(autoSaveTemplate, 1000);
    return () => clearTimeout(timer);
  }, [formData, section?.type]);

  useEffect(() => {
    const fetchActorProducts = async () => {
      if (!actorId) return;
      
      let query = supabase
        .from("pro_products")
        .select("id, title, status")
        .eq("actor_id", actorId);

      if (portfolioId) {
        query = query.or(`portfolio_id.eq.${portfolioId},portfolio_id.is.null`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (!error && data) setAvailableProducts(data);
    };

    if (section?.type === "dynamic_store") {
      fetchActorProducts();
    }
  }, [actorId, section?.type, portfolioId]);

  if (!section) return null;
  // =========================================================
  // THE LOCAL STATE BUFFER (Fixes cursor jumping & freezing!)
  // =========================================================

  // 1. We keep a local copy of the data so typing is buttery smooth
  const [settingsData, setSettingsData] = useState(section?.settings || {});

  // 2. If the user clicks a DIFFERENT section, or if the canvas iframe
  // sends an inline-edit update, we sync the local state to match.
  useEffect(() => {
    if (section) {
      setFormData(section.data || {});
      setSettingsData(section.settings || {});
    }
  }, [section]);

  // =========================================================
  // CORE UPDATE HANDLERS (Zustand Connected)
  // =========================================================

  // Update Core Content (Zone A)
  const updateField = (key: string, value: any) => {
    // 1. Update Local UI instantly
    const newFormData = { ...formData, [key]: value };
    setFormData(newFormData);

    // 2. Send to Zustand in the background
    updateSectionInStore(section.id, {
      data: newFormData,
    });
  };

  // Update Theme Settings (Zone B)
  const updateSetting = (key: string, value: any) => {
    // 1. Update Local UI instantly
    const newSettingsData = { ...settingsData, [key]: value };
    setSettingsData(newSettingsData);

    // 2. Send to Zustand in the background
    updateSectionInStore(section.id, {
      settings: newSettingsData,
    });
  };

  // 🚀 Apply Template Helper
  const handleApplyTemplate = (template: any) => {
    if (formData.code?.trim() && !window.confirm("Loading this template will overwrite your current code. Are you sure you want to continue?")) {
      return;
    }
    
    const newFormData = {
      ...formData,
      code: template.code,
      allowJavascript: template.allowJavascript,
      useTailwind: template.useTailwind,
    };
    
    setFormData(newFormData);
    updateSectionInStore(section.id, { data: newFormData });
    setIsTemplateLibraryOpen(false);
  };

  // =========================================================
  // MEDIA HANDLER (Adapted to Zustand)
  // =========================================================
  const handleMediaSelect = (item: UnifiedMediaItem) => {
    if (activeMediaField === "logoImage") {
      updateField("logoImage", item.url);
    } else if (activeMediaField.startsWith("member-image-")) {
      const index = parseInt(activeMediaField.split("-").pop() || "0");
      updateMember(index, "image", item.url);
    } else if (activeMediaField.startsWith("slider-image-")) {
      const index = parseInt(activeMediaField.split("-").pop() || "0");
      handleUpdateSlide("image", index, "url", item.url);
    } else if (activeMediaField.startsWith("slider-video-")) {
      const index = parseInt(activeMediaField.split("-").pop() || "0");
      handleUpdateSlide("video", index, "url", item.url);
      if (!formData.videos?.[index]?.title) {
        handleUpdateSlide("video", index, "title", item.title || "Video");
      }
    } else if (activeMediaField === "gallery") {
      const currentList = formData.images || [];
      updateField("images", [
        ...currentList,
        { url: item.url, type: item.type },
      ]);
    } else if (activeMediaField === "backgroundImage") {
      if (section.type === "header") {
        updateSetting("backgroundImage", item.url);
      } else {
        updateField("backgroundImage", item.url);
      }
    } else if (activeMediaField === "image") {
      updateField("image", item.url);
    } else if (activeMediaField === "videoUrl") {
      updateField("videoUrl", item.url);
    } else if (activeMediaField.startsWith("product-image-")) {
      const index = parseInt(activeMediaField.split("-").pop() || "0");
      const currentProducts = [...(formData.products || [])];
      if (currentProducts[index]) {
        currentProducts[index].image = item.url;
        if (!currentProducts[index].images) currentProducts[index].images = [];
        if (currentProducts[index].images.length === 0)
          currentProducts[index].images.push(item.url);
        updateField("products", currentProducts);
      }
    } else if (activeMediaField.startsWith("product-gallery-add-")) {
      const index = parseInt(activeMediaField.split("product-gallery-add-")[1]);
      const currentProducts = [...(formData.products || [])];
      if (currentProducts[index]) {
        const currentImages = currentProducts[index].images || [];
        currentProducts[index].images = [...currentImages, item.url];
        if (!currentProducts[index].image)
          currentProducts[index].image = item.url;
        updateField("products", currentProducts);
      }
    }
    // 2. Special Case for Header Background (saves to settings instead of data)
    else if (
      activeMediaField === "backgroundImage" &&
      section.type === "header"
    ) {
      updateSetting("backgroundImage", item.url);
    }
    // 🚀 3. THE MAGIC CATCH-ALL FOR STANDARD FIELDS
    else if (activeMediaField) {
      // This automatically handles "logoImage", "image", "backgroundImage",
      // "videoUrl", "mobileBackgroundImage", "mobileVideoUrl", etc!
      updateField(activeMediaField, item.url);
    }

    // 4. Close the modal and reset
    setIsMediaPickerOpen(false);
    setActiveMediaField("");
  };
  // =========================================================
  // ARRAY HELPERS (Adapted to use formData directly)
  // =========================================================
  const addStat = () =>
    updateField("customStats", [
      ...(formData.customStats || []),
      { label: "New Stat", value: "100" },
    ]);
  const updateStat = (index: number, field: "label" | "value", val: string) => {
    const currentStats = [...(formData.customStats || [])];
    currentStats[index][field] = val;
    updateField("customStats", currentStats);
  };
  const removeStat = (index: number) => {
    const currentStats = [...(formData.customStats || [])];
    currentStats.splice(index, 1);
    updateField("customStats", currentStats);
  };

  const handleAddSlide = (type: "image" | "video") => {
    const field = type === "image" ? "images" : "videos";
    const newItem =
      type === "image"
        ? { url: "", caption: "" }
        : { url: "", title: "", poster: "" };
    updateField(field, [...(formData[field] || []), newItem]);
  };
  const handleUpdateSlide = (
    type: "image" | "video",
    index: number,
    key: string,
    val: string
  ) => {
    const field = type === "image" ? "images" : "videos";
    const newSlides = [...(formData[field] || [])];
    newSlides[index][key] = val;
    updateField(field, newSlides);
  };
  const handleRemoveSlide = (type: "image" | "video", index: number) => {
    const field = type === "image" ? "images" : "videos";
    const newSlides = [...(formData[field] || [])];
    newSlides.splice(index, 1);
    updateField(field, newSlides);
  };

  const updateMenuConfig = (
    targetSectionId: string,
    field: "label" | "visible" | "folderId",
    value: any
  ) => {
    const currentConfig = formData.menuConfig || {};
    const sectionConfig = currentConfig[targetSectionId] || {
      visible: true,
      label: "",
    };
    updateField("menuConfig", {
      ...currentConfig,
      [targetSectionId]: { ...sectionConfig, [field]: value },
    });
  };

  const handleAddMember = () =>
    updateField("members", [
      ...(formData.members || []),
      { name: "New Member", role: "Role", image: "" },
    ]);
  const updateMember = (idx: number, field: string, val: any) => {
    const current = [...(formData.members || [])];
    current[idx][field] = val;
    updateField("members", current);
  };
  const removeMember = (idx: number) => {
    const current = [...(formData.members || [])];
    current.splice(idx, 1);
    updateField("members", current);
  };

  const handleAddPlan = () =>
    updateField("plans", [
      ...(formData.plans || []),
      { name: "Basic", price: "1000", features: "Feature 1, Feature 2" },
    ]);
  const updatePlan = (idx: number, field: string, val: any) => {
    const current = [...(formData.plans || [])];
    current[idx][field] = val;
    updateField("plans", current);
  };
  const removePlan = (idx: number) => {
    const current = [...(formData.plans || [])];
    current.splice(idx, 1);
    updateField("plans", current);
  };

  const handleAddProduct = () =>
    updateField("products", [
      ...(formData.products || []),
      {
        title: "New Product",
        price: "$19.99",
        buttonText: "Buy Now",
        link: "",
      },
    ]);
  const updateProduct = (idx: number, field: string, val: any) => {
    const current = [...(formData.products || [])];
    current[idx][field] = val;
    updateField("products", current);
  };
  const removeProduct = (idx: number) => {
    const current = [...(formData.products || [])];
    current.splice(idx, 1);
    updateField("products", current);
  };
  const duplicateProduct = (idx: number) => {
    const currentProducts = formData.products || [];
    const productToCopy = currentProducts[idx];

    // Deep clone the object so modifying the copy doesn't affect the original
    const newProduct = JSON.parse(JSON.stringify(productToCopy));

    // Append " (Copy)" to the title
    if (newProduct.title) {
      newProduct.title = `${newProduct.title} (Copy)`;
    }

    // Generate a new unique ID for DndKit
    newProduct.id = `shop-product-${Date.now()}`;

    const newProducts = [...currentProducts];
    newProducts.splice(idx + 1, 0, newProduct); // Insert it right after the original

    updateField("products", newProducts);
  };
  // =========================================================
  // DYNAMIC FORM BUILDER (Theme Settings)
  // =========================================================
  const renderThemeSettings = () => {
    // We now know this is correctly resolving to "cupertino"
    const ActiveTheme = THEME_REGISTRY[themeId];
    if (!ActiveTheme) return <p>Theme not found.</p>;

    // 🚀 Look how clean this is using your new helper!
    const SectionComponent = resolveThemeComponent(ActiveTheme, section.type);
    const componentKey = SECTION_COMPONENT_MAP[section.type];

    // 🚀 THE FIX: Look for the schema in a dedicated schemas object first!
    // This bypasses the React.lazy() trap entirely.
    let schema =
      ActiveTheme.schemas?.[componentKey] ||
      SectionComponent?.schema ||
      SectionComponent?.default?.schema ||
      [];

    // 🚀 DYNAMIC STORE INJECTION: Ensures the layout settings appear in the Design tab
    if (section.type === "dynamic_store" && (!schema || schema.length === 0)) {
      schema = [
        {
          id: "variant",
          label: "Store Layout Style",
          type: "select",
          defaultValue: "grid",
          options: [
            { value: "grid", label: "Modern Grid" },
            { value: "bento", label: "Bento Gallery" },
            { value: "carousel", label: "Horizontal Carousel" },
             { value: "spotlight", label: "Spotlight (Full Product View)" },
          ]
        }
      ];
      schema.push({
        id: "spotlightAction",
        label: "Spotlight Action Behavior",
        type: "select",
        defaultValue: "inline",
        options: [
          { value: "inline", label: "Inline Checkout & Add to Cart" },
          { value: "redirect", label: "Redirect to Product Page" },
        ],
        showIf: (settings: any) => (settings.variant || "grid") === "spotlight",
      });
    }

    if (!schema || schema.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-lg">
          <p>
            This section has no design settings for the current theme ({themeId}
            ).
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in">
        {schema.map((field: any) => {
          if (field.showIf && !field.showIf(settingsData)) return null;

          return (
            <div
              key={field.id}
              className="space-y-3 p-4 border rounded-lg bg-muted/20"
            >
            <div className="flex items-center justify-between">
              <Label htmlFor={field.id} className="text-base font-medium">
                {field.label}
              </Label>
            </div>

            {field.type === "toggle" && (
              <Switch
                id={field.id}
                checked={
                  settingsData[field.id] !== undefined
                    ? settingsData[field.id]
                    : field.defaultValue
                }
                onCheckedChange={(val) => updateSetting(field.id, val)}
              />
            )}

            {field.type === "select" && (
              <Select
                value={settingsData[field.id] || field.defaultValue}
                onValueChange={(val) => updateSetting(field.id, val)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {field.options?.map((opt: any) => {
                  const value = typeof opt === "string" ? opt : opt.value;
                  const label = typeof opt === "string" ? opt.charAt(0).toUpperCase() + opt.slice(1) : opt.label;
                  return (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  );
                })}
                </SelectContent>
              </Select>
            )}

            {field.type === "slider" && (
              <div className="pt-2">
                <Slider
                  value={[settingsData[field.id] ?? field.defaultValue ?? 0]}
                  min={field.min || 0}
                  max={field.max || 100}
                  step={field.step || 1}
                  onValueChange={([val]) => updateSetting(field.id, val)}
                />
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-muted-foreground">{field.min}</span>
                  <span className="font-medium text-primary">
                    {settingsData[field.id] ?? field.defaultValue}
                  </span>
                  <span className="text-muted-foreground">{field.max}</span>
                </div>
              </div>
            )}

            {field.type === "color" && (
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  className="w-10 h-10 p-0.5 cursor-pointer rounded border"
                  value={
                    settingsData[field.id] || field.defaultValue || "#000000"
                  }
                  onChange={(e) => updateSetting(field.id, e.target.value)}
                />
                <Input
                  className="font-mono text-xs uppercase"
                  value={
                    settingsData[field.id] || field.defaultValue || "#000000"
                  }
                  onChange={(e) => updateSetting(field.id, e.target.value)}
                />
              </div>
            )}
            </div>
          );
        })}
      </div>
    );
  };
  // =========================================================
  // CORE CONTENT FIELDS
  // =========================================================
  const renderFields = () => {
    switch (section.type) {
      case "header":
        const megaFolders = formData.megaMenuFolders || []; // Helper for the dropdowns

        return (
          <div className="space-y-6">
            {/* --- UPGRADED: AAA+ ANNOUNCEMENT BAR (MULTIPLE MESSAGES) --- */}
            <div className="space-y-4 p-4 border rounded-lg bg-indigo-500/5 border-indigo-500/20">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-indigo-400">
                  Announcement Bar
                </Label>
                <Switch
                  checked={formData.showAnnouncement === true}
                  onCheckedChange={(checked) =>
                    updateField("showAnnouncement", checked)
                  }
                />
              </div>
              {formData.showAnnouncement && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    {(
                      formData.announcements ||
                      (formData.announcementText
                        ? [
                            {
                              id: "legacy",
                              text: formData.announcementText,
                              link: formData.announcementLink,
                            },
                          ]
                        : [])
                    ).map((ann: any, index: number) => (
                      <div
                        key={ann.id || index}
                        className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start bg-background p-2 rounded-md border shadow-sm relative group"
                      >
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            Message {index + 1}
                          </Label>
                          <Input
                            value={ann.text || ""}
                            onChange={(e) => {
                              const newAnns = [
                                ...(formData.announcements || []),
                              ];
                              if (!newAnns.length && formData.announcementText)
                                newAnns.push({
                                  id: "legacy",
                                  text: formData.announcementText,
                                  link: formData.announcementLink,
                                });
                              newAnns[index] = {
                                ...newAnns[index],
                                text: e.target.value,
                              };
                              updateField("announcements", newAnns);
                            }}
                            placeholder="e.g. Free shipping!"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                            Link
                          </Label>
                          <Input
                            value={ann.link || ""}
                            onChange={(e) => {
                              const newAnns = [
                                ...(formData.announcements || []),
                              ];
                              if (!newAnns.length && formData.announcementText)
                                newAnns.push({
                                  id: "legacy",
                                  text: formData.announcementText,
                                  link: formData.announcementLink,
                                });
                              newAnns[index] = {
                                ...newAnns[index],
                                link: e.target.value,
                              };
                              updateField("announcements", newAnns);
                            }}
                            placeholder="/shop"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="pt-5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => {
                              const currentAnns = formData.announcements || [
                                {
                                  id: "legacy",
                                  text: formData.announcementText,
                                  link: formData.announcementLink,
                                },
                              ];
                              const newAnns = currentAnns.filter(
                                (_: any, i: number) => i !== index
                              );
                              updateField("announcements", newAnns);
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {(formData.announcements?.length || 0) < 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed text-xs h-8 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 border-indigo-200"
                        onClick={() => {
                          const currentAnns =
                            formData.announcements ||
                            (formData.announcementText
                              ? [
                                  {
                                    id: "legacy",
                                    text: formData.announcementText,
                                    link: formData.announcementLink,
                                  },
                                ]
                              : []);
                          updateField("announcements", [
                            ...currentAnns,
                            {
                              id: `ann_${crypto.randomUUID()}`,
                              text: "",
                              link: "",
                            },
                          ]);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-2" /> Add Message
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 bg-background rounded-md border mt-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.announcementBgColor || "#000000"}
                          onChange={(e) =>
                            updateField("announcementBgColor", e.target.value)
                          }
                          className="h-8 w-8 rounded cursor-pointer border"
                        />
                        <Input
                          value={formData.announcementBgColor || "#000000"}
                          onChange={(e) =>
                            updateField("announcementBgColor", e.target.value)
                          }
                          className="h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Text Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={formData.announcementTextColor || "#ffffff"}
                          onChange={(e) =>
                            updateField("announcementTextColor", e.target.value)
                          }
                          className="h-8 w-8 rounded cursor-pointer border"
                        />
                        <Input
                          value={formData.announcementTextColor || "#ffffff"}
                          onChange={(e) =>
                            updateField("announcementTextColor", e.target.value)
                          }
                          className="h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-md bg-background">
                    <div className="space-y-0.5">
                      <Label className="cursor-pointer">
                        Sliding Animation (Marquee)
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Makes the text scroll continuously.
                      </p>
                    </div>
                    <Switch
                      checked={formData.announcementMarquee === true}
                      onCheckedChange={(checked) =>
                        updateField("announcementMarquee", checked)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <Label className="text-base font-semibold">Branding</Label>
              <div className="space-y-2">
                <Label>Logo Text</Label>
                <Input
                  value={formData.logoText || ""}
                  onChange={(e) => updateField("logoText", e.target.value)}
                  placeholder="e.g. HAMZA KAEL"
                />
              </div>
              <div className="space-y-2">
                <Label>Logo Image</Label>
                <div className="flex items-center gap-4">
                  {formData.logoImage && (
                    <div className="h-10 w-10 bg-black rounded border flex items-center justify-center p-1">
                      <img
                        src={formData.logoImage}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveMediaField("logoImage");
                      setIsMediaPickerOpen(true);
                    }}
                  >
                    {formData.logoImage ? "Change Logo" : "Upload Logo"}
                  </Button>
                </div>
              </div>
              {formData.logoImage && (
                <div className="space-y-5 pt-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Monitor size={14} /> Desktop Size
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.logoHeight || 40}px
                      </span>
                    </div>
                    <Slider
                      value={[formData.logoHeight || 40]}
                      min={20}
                      max={120}
                      step={2}
                      onValueChange={([val]) => updateField("logoHeight", val)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Smartphone size={14} /> Mobile Size
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.mobileLogoHeight || 30}px
                      </span>
                    </div>
                    <Slider
                      value={[formData.mobileLogoHeight || 30]}
                      min={16}
                      max={80}
                      step={2}
                      onValueChange={([val]) =>
                        updateField("mobileLogoHeight", val)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <Label className="text-base font-semibold">Social Icons</Label>
              <p className="text-[10px] text-muted-foreground mb-2">
                Leave blank to hide. They will appear next to the navigation
                links.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    <Instagram size={14} />
                  </div>
                  <Input
                    className="pl-8 text-xs"
                    value={formData.socialInstagram || ""}
                    onChange={(e) =>
                      updateField("socialInstagram", e.target.value)
                    }
                    placeholder="Instagram URL"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    <Twitter size={14} />
                  </div>
                  <Input
                    className="pl-8 text-xs"
                    value={formData.socialTwitter || ""}
                    onChange={(e) =>
                      updateField("socialTwitter", e.target.value)
                    }
                    placeholder="Twitter/X URL"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    <Youtube size={14} />
                  </div>
                  <Input
                    className="pl-8 text-xs"
                    value={formData.socialYoutube || ""}
                    onChange={(e) =>
                      updateField("socialYoutube", e.target.value)
                    }
                    placeholder="YouTube URL"
                  />
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                    <Film size={14} />
                  </div>
                  <Input
                    className="pl-8 text-xs"
                    value={formData.socialImdb || ""}
                    onChange={(e) => updateField("socialImdb", e.target.value)}
                    placeholder="IMDb URL"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-col gap-2">
                <Label className="text-base font-semibold">
                  Navigation Menu
                </Label>

                <div className="flex bg-muted/50 p-1 rounded-lg border">
                  <button
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                      formData.menuType !== "mega"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => updateField("menuType", "simple")}
                  >
                    Simple Menu
                  </button>
                  <button
                    className={cn(
                      "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5",
                      formData.menuType === "mega"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      const newConfig = { ...(formData.menuConfig || {}) };
                      const visibleSections = sections.filter((s: any) => s.type !== "header" && s.isVisible);
                      visibleSections.forEach((s: any, idx: number) => {
                        if (!newConfig[s.id]) {
                          newConfig[s.id] = { visible: idx < 3, label: s.data.title || s.type };
                        }
                      });
                      const newFormData = { 
                        ...formData, 
                        menuType: "mega", 
                        autoMenu: false, 
                        menuConfig: newConfig 
                      };
                      setFormData(newFormData);
                      updateSectionInStore(section.id, { data: newFormData });
                    }}
                  >
                    Mega Menu{" "}
                    {!hasMegaMenuAccess && (
                      <Lock
                        size={10}
                        className={
                          formData.menuType === "mega"
                            ? "text-primary-foreground/70"
                            : "text-amber-500"
                        }
                      />
                    )}
                  </button>
                </div>
              </div>

              {formData.menuType === "mega" ? (
                hasMegaMenuAccess ? (
                  /* --- 🚀 ACTIVE MEGA MENU BUILDER --- */
                  <div className="space-y-4 p-4 border rounded-lg bg-primary/5 animate-in slide-in-from-right-2">
                    <div className="flex items-center gap-3 border-b border-primary/10 pb-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-md">
                        <Layers size={16} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-primary">
                          Mega Menu Organizer
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          eCommerce & Pro feature unlocked.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-primary">
                        1. Create Folders
                      </Label>
                      {(formData.megaMenuFolders || []).map(
                        (folder: any, i: number) => (
                          <div
                            key={folder.id}
                            className="flex items-center gap-2 p-2 bg-background border rounded-md shadow-sm"
                          >
                            <Layers
                              size={14}
                              className="text-muted-foreground"
                            />
                            <Input
                              value={folder.label}
                              onChange={(e) => {
                                const newF = [...formData.megaMenuFolders];
                                newF[i].label = e.target.value;
                                updateField("megaMenuFolders", newF);
                              }}
                              className="h-7 text-xs"
                              placeholder="Folder Name (e.g. Services)"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive/70 hover:text-destructive"
                              onClick={() => {
                                const newF = formData.megaMenuFolders.filter(
                                  (_: any, idx: number) => idx !== i
                                );
                                updateField("megaMenuFolders", newF);
                              }}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        )
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs border-dashed bg-background"
                        onClick={() => {
                          const newF = [
                            ...(formData.megaMenuFolders || []),
                            { id: `folder_${crypto.randomUUID()}`, label: "" },
                          ];
                          updateField("megaMenuFolders", newF);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-2" /> Add Dropdown Folder
                      </Button>
                    </div>

                    {/* 🚀 NEW: LINK ASSIGNMENT UI */}
                    <div className="pt-4 mt-4 border-t border-primary/10 space-y-4">
                      <Label className="text-xs font-bold text-primary">
                        2. Assign Links to Folders
                      </Label>

                      {/* Mega Menu Pages */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Pages
                        </Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={
                              formData.menuConfig?.page_shop?.visible !== false
                            }
                            onCheckedChange={(c) =>
                              updateMenuConfig("page_shop", "visible", c)
                            }
                          />
                          <Input
                            value={
                              formData.menuConfig?.page_shop?.label || "Shop"
                            }
                            onChange={(e) =>
                              updateMenuConfig(
                                "page_shop",
                                "label",
                                e.target.value
                              )
                            }
                            disabled={
                              formData.menuConfig?.page_shop?.visible === false
                            }
                            className="h-8 text-xs flex-1"
                          />
                          <Select
                            value={
                              formData.menuConfig?.page_shop?.folderId || "none"
                            }
                            onValueChange={(val) =>
                              updateMenuConfig(
                                "page_shop",
                                "folderId",
                                val === "none" ? null : val
                              )
                            }
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                              <SelectValue placeholder="Parent" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Folder</SelectItem>
                              {megaFolders.map((f: any) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.label || "Unnamed"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {(pages || [])
                          .filter((p) => !p.isHome)
                          .map((page) => {
                            const configKey = `page_${page.id}`;
                            const config =
                              formData.menuConfig?.[configKey] || {};
                            return (
                              <div
                                key={page.id}
                                className="flex items-center gap-2"
                              >
                                <Switch
                                  checked={config.visible !== false}
                                  onCheckedChange={(c) =>
                                    updateMenuConfig(configKey, "visible", c)
                                  }
                                />
                                <Input
                                  value={config.label || page.title}
                                  onChange={(e) =>
                                    updateMenuConfig(
                                      configKey,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  disabled={config.visible === false}
                                  className="h-8 text-xs flex-1"
                                />
                                <Select
                                  value={config.folderId || "none"}
                                  onValueChange={(val) =>
                                    updateMenuConfig(
                                      configKey,
                                      "folderId",
                                      val === "none" ? null : val
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                                    <SelectValue placeholder="Parent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      No Folder
                                    </SelectItem>
                                    {megaFolders.map((f: any) => (
                                      <SelectItem key={f.id} value={f.id}>
                                        {f.label || "Unnamed"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                      </div>

                      {/* Mega Menu Custom Links */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Custom Links
                        </Label>
                        {(formData.customNavLinks || []).map(
                          (link: any, index: number) => (
                            <div
                              key={link.id}
                              className="flex items-start gap-2 bg-background p-2 border rounded-md relative group shadow-sm"
                            >
                              <Switch
                                checked={link.visible !== false}
                                className="mt-2"
                                onCheckedChange={(c) => {
                                  const newLinks = formData.customNavLinks.map(
                                    (l: any, i: number) =>
                                      i === index ? { ...l, visible: c } : l
                                  );
                                  updateField("customNavLinks", newLinks);
                                }}
                              />
                              <div className="flex-grow space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={link.label}
                                    placeholder="Link Name"
                                    onChange={(e) => {
                                      const newLinks =
                                        formData.customNavLinks.map(
                                          (l: any, i: number) =>
                                            i === index
                                              ? { ...l, label: e.target.value }
                                              : l
                                        );
                                      updateField("customNavLinks", newLinks);
                                    }}
                                    className="h-8 text-xs"
                                  />
                                  <Select
                                    value={link.folderId || "none"}
                                    onValueChange={(val) => {
                                      const newLinks =
                                        formData.customNavLinks.map(
                                          (l: any, i: number) =>
                                            i === index
                                              ? {
                                                  ...l,
                                                  folderId:
                                                    val === "none" ? null : val,
                                                }
                                              : l
                                        );
                                      updateField("customNavLinks", newLinks);
                                    }}
                                  >
                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                      <SelectValue placeholder="Parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">
                                        No Folder
                                      </SelectItem>
                                      {megaFolders.map((f: any) => (
                                        <SelectItem key={f.id} value={f.id}>
                                          {f.label || "Unnamed"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Input
                                  value={link.url}
                                  placeholder="https://..."
                                  onChange={(e) => {
                                    const newLinks =
                                      formData.customNavLinks.map(
                                        (l: any, i: number) =>
                                          i === index
                                            ? { ...l, url: e.target.value }
                                            : l
                                      );
                                    updateField("customNavLinks", newLinks);
                                  }}
                                  className="h-8 text-xs text-muted-foreground"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/50 hover:text-destructive absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded-full"
                                onClick={() => {
                                  const newLinks =
                                    formData.customNavLinks.filter(
                                      (l: any) => l.id !== link.id
                                    );
                                  updateField("customNavLinks", newLinks);
                                }}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          )
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed text-xs bg-background"
                          onClick={() => {
                            const currentLinks = formData.customNavLinks || [];
                            updateField("customNavLinks", [
                              ...currentLinks,
                              {
                                id: `link_${Date.now()}`,
                                label: "",
                                url: "",
                                visible: true,
                                folderId: null,
                              },
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Custom Link
                        </Button>
                      </div>

                      {/* Mega Menu Sections */}
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          On-Page Sections
                        </Label>
                        {sections
                          .filter(
                            (s: any) => s.type !== "header" && s.isVisible
                          )
                          .map((s: any) => {
                            const config = formData.menuConfig?.[s.id] || {};
                            return (
                              <div
                                key={s.id}
                                className="flex items-center gap-2"
                              >
                                <Switch
                                  checked={config.visible !== false}
                                  onCheckedChange={(c) =>
                                    updateMenuConfig(s.id, "visible", c)
                                  }
                                />
                                <Input
                                  value={config.label || s.data.title || s.type}
                                  onChange={(e) =>
                                    updateMenuConfig(
                                      s.id,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  disabled={config.visible === false}
                                  className="h-8 text-xs flex-1"
                                />
                                <Select
                                  value={config.folderId || "none"}
                                  onValueChange={(val) =>
                                    updateMenuConfig(
                                      s.id,
                                      "folderId",
                                      val === "none" ? null : val
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                                    <SelectValue placeholder="Parent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      No Folder
                                    </SelectItem>
                                    {megaFolders.map((f: any) => (
                                      <SelectItem key={f.id} value={f.id}>
                                        {f.label || "Unnamed"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* --- 🚀 LOCKED MEGA MENU STATE (Starter / Free) --- */
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center space-y-3 animate-in slide-in-from-right-2">
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2 text-amber-600">
                      <Layers size={24} />
                    </div>
                    <h4 className="font-bold text-amber-900">
                      Mega Menu unlocked in eCommerce & Pro
                    </h4>
                    <p className="text-xs text-amber-700 max-w-[250px] mx-auto">
                      Upgrade your plan to organize your links into nested
                      folders, add images to dropdowns, and create rich
                      navigation experiences.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="bg-white hover:bg-amber-100 text-amber-700 border-amber-300 w-full max-w-[200px] mt-2"
                    >
                      <a href="/dashboard/settings">View Upgrade Plans</a>
                    </Button>
                  </div>
                )
              ) : (
                /* --- 🚀 SIMPLE MENU BUILDER --- */
                <div className="space-y-4 animate-in slide-in-from-left-2">
                  <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md border">
                    <Label
                      htmlFor="autoMenu"
                      className="text-xs font-bold text-foreground"
                    >
                      Auto-Generate Links
                    </Label>
                    <Switch
                      id="autoMenu"
                      checked={formData.autoMenu !== false}
                      onCheckedChange={(checked) => {
                        if (!checked) {
                          const newConfig = { ...(formData.menuConfig || {}) };
                          const visibleSections = sections.filter((s: any) => s.type !== "header" && s.isVisible);
                          visibleSections.forEach((s: any, idx: number) => {
                            if (!newConfig[s.id]) {
                              newConfig[s.id] = { visible: idx < 3, label: s.data.title || s.type };
                            }
                          });
                          const newFormData = { ...formData, autoMenu: false, menuConfig: newConfig };
                          const newFormData = {
                            ...formData,
                            autoMenu: false,
                            menuConfig: newConfig,
                          };
                          setFormData(newFormData);
                          updateSectionInStore(section.id, { data: newFormData });
                        } else {
                          updateField("autoMenu", true);
                        }
                      }}
                    />
                  </div>

                  {formData.autoMenu !== false ? (
                    <div className="bg-muted/10 border border-dashed p-4 rounded-md space-y-3">
                      <p className="text-xs text-muted-foreground text-center">
                        Auto-Generate is <strong>ON</strong>. The system is
                        currently displaying these visible sections:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center pointer-events-none opacity-70">
                        {sections
                          .filter(
                            (s: any) => s.isVisible && s.type !== "header"
                          )
                          .map((s: any) => (
                            <span
                              key={s.id}
                              className="px-2 py-1 bg-secondary text-secondary-foreground text-[10px] uppercase font-bold tracking-widest rounded-md shadow-sm"
                            >
                              {s.data.title || s.type}
                            </span>
                          ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center pt-3 border-t border-dashed mt-4">
                        Turn off Auto-Generate to manually reorder, rename, or
                        hide links.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 bg-muted/20 p-4 rounded-md border">
                      {/* --- PAGES --- */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <span className="h-px bg-border flex-grow"></span>{" "}
                          Pages{" "}
                          <span className="h-px bg-border flex-grow"></span>
                        </Label>
                        <p className="text-[10px] text-muted-foreground text-center mb-3">
                          Links to specific pages on your website.
                  <div className="space-y-3 pt-4">
                    {formData.autoMenu !== false ? (
                      <div className="bg-muted/10 border border-dashed p-4 rounded-md space-y-3">
                        <p className="text-xs text-muted-foreground text-center">
                          Auto-Generate is <strong>ON</strong>. The menu will
                          automatically include important sections like Hero,
                          Shop, and Contact.
                        </p>

                        <div className="flex items-center gap-3">
                          <Switch
                            checked={
                              formData.menuConfig?.page_shop?.visible !== false
                            }
                            onCheckedChange={(c) =>
                              updateMenuConfig("page_shop", "visible", c)
                            }
                          />
                          <Input
                            value={
                              formData.menuConfig?.page_shop?.label || "Shop"
                            }
                            onChange={(e) =>
                              updateMenuConfig(
                                "page_shop",
                                "label",
                                e.target.value
                              )
                            }
                            disabled={
                              formData.menuConfig?.page_shop?.visible === false
                            }
                            className="h-8 text-sm"
                          />
                          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest w-16 text-right">
                            System
                          </span>
                        </div>

                        {(pages || [])
                          .filter((p) => !p.isHome)
                          .map((page) => {
                            const configKey = `page_${page.id}`;
                            const config =
                              formData.menuConfig?.[configKey] || {};
                            const isSelected = config.visible !== false;
                            const label = config.label || page.title;

                            return (
                              <div
                                key={page.id}
                                className="flex items-center gap-3"
                              >
                                <Switch
                                  checked={isSelected}
                                  onCheckedChange={(c) =>
                                    updateMenuConfig(configKey, "visible", c)
                                  }
                                />
                                <Input
                                  value={label}
                                  onChange={(e) =>
                                    updateMenuConfig(
                                      configKey,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  disabled={!isSelected}
                                  className="h-8 text-sm"
                                />
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest w-16 text-right truncate">
                                  Custom
                                </span>
                              </div>
                            );
                          })}
                        <p className="text-[10px] text-muted-foreground text-center pt-3 border-t border-dashed mt-4">
                          Turn off Auto-Generate to manually reorder, rename, or
                          hide links.
                        </p>
                      </div>

                      {/* --- CUSTOM EXTERNAL LINKS --- */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <span className="h-px bg-border flex-grow"></span>{" "}
                          Custom Links{" "}
                          <span className="h-px bg-border flex-grow"></span>
                        </Label>
                        <p className="text-[10px] text-muted-foreground text-center mb-3">
                          Link to specific products, collections, or external
                          websites.
                        </p>

                        {(formData.customNavLinks || []).map(
                          (link: any, index: number) => (
                    ) : (
                      <DragDropContext onDragEnd={onMenuDragEnd}>
                        <Droppable droppableId="menu-items">
                          {(provided) => (
                            <div
                              key={link.id}
                              className="flex items-start gap-3 bg-background p-2 border rounded-md relative group shadow-sm"
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-3"
                            >
                              <Switch
                                checked={link.visible !== false}
                                className="mt-2"
                                onCheckedChange={(c) => {
                                  const newLinks = formData.customNavLinks.map(
                                    (l: any, i: number) =>
                                      i === index ? { ...l, visible: c } : l
                                  );
                                  updateField("customNavLinks", newLinks);
                                }}
                              />
                              <div className="flex-grow space-y-2">
                                <Input
                                  value={link.label}
                                  placeholder="Link Name (e.g. My IMDb)"
                                  onChange={(e) => {
                                    const newLinks =
                                      formData.customNavLinks.map(
                                        (l: any, i: number) =>
                                          i === index
                                            ? { ...l, label: e.target.value }
                                            : l
                                      );
                                    updateField("customNavLinks", newLinks);
                                  }}
                                  className="h-8 text-sm"
                                />
                                <Input
                                  value={link.url}
                                  placeholder="https:// or /shop/product"
                                  onChange={(e) => {
                                    const newLinks =
                                      formData.customNavLinks.map(
                                        (l: any, i: number) =>
                                          i === index
                                            ? { ...l, url: e.target.value }
                                            : l
                                      );
                                    updateField("customNavLinks", newLinks);
                                  }}
                                  className="h-8 text-sm text-muted-foreground"
                                />
                              </div>
                              {/* Delete Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/50 hover:text-destructive absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded-full"
                                onClick={() => {
                                  const newLinks =
                                    formData.customNavLinks.filter(
                                      (l: any) => l.id !== link.id
                                    );
                                  updateField("customNavLinks", newLinks);
                                }}
                              >
                                <X size={14} />
                              </Button>
                              {allMenuItems.map((item: any, index: number) => {
                                const config = formData.menuConfig?.[item.id] || {};
                                const linkData = item.linkData || {};
                                const itemData = {
                                  isVisible: (type: string) => type === 'custom_link' ? linkData.visible !== false : config.visible !== false,
                                  label: (type: string) => {
                                    if (type === 'custom_link') return linkData.label || '';
                                    if (type === 'page') return config.label || item.pageData?.title || 'Shop';
                                    if (type === 'section') return config.label || item.sectionData?.data?.title || item.sectionData?.type;
                                    return '';
                                  },
                                  url: linkData.url || '',
                                  folderId: config.folderId || linkData.folderId || 'none',
                                };

                                return (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(providedDraggable) => (
                                      <div ref={providedDraggable.innerRef} {...providedDraggable.draggableProps}>
                                        <DraggableMenuItem
                                          item={{ ...item, data: itemData }}
                                          dragHandleProps={providedDraggable.dragHandleProps}
                                          updateMenuConfig={updateMenuConfig}
                                          updateCustomLink={(linkId: string, field: string, value: any) => {
                                            const linkIndex = formData.customNavLinks.findIndex((l: any) => l.id === linkId);
                                            if (linkIndex > -1) {
                                              const newLinks = [...formData.customNavLinks];
                                              newLinks[linkIndex][field] = value;
                                              updateField("customNavLinks", newLinks);
                                            }
                                          }}
                                          isMegaMenu={formData.menuType === 'mega'}
                                          megaFolders={formData.megaMenuFolders || []}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed text-xs"
                          onClick={() => {
                            const currentLinks = formData.customNavLinks || [];
                            updateField("customNavLinks", [
                              ...currentLinks,
                              {
                                id: `link_${Date.now()}`,
                                label: "",
                                url: "",
                                visible: true,
                              },
                            ]);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Custom Link
                        </Button>
                      </div>

                      {/* --- ON-PAGE SECTIONS --- */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <span className="h-px bg-border flex-grow"></span>{" "}
                          On-Page Sections{" "}
                          <span className="h-px bg-border flex-grow"></span>
                        </Label>
                        <p className="text-[10px] text-muted-foreground text-center mb-3">
                          Links that scroll down to sections on the Home page.
                        </p>

                        {sections
                          .filter(
                            (s: any) => s.type !== "header" && s.isVisible
                          )
                          .map((s: any) => {
                            const config = formData.menuConfig?.[s.id] || {};
                            const isSelected = config.visible !== false;
                            const label =
                              config.label || s.data.title || s.type;
                            return (
                              <div
                                key={s.id}
                                className="flex items-center gap-3"
                              >
                                <Switch
                                  checked={isSelected}
                                  onCheckedChange={(c) =>
                                    updateMenuConfig(s.id, "visible", c)
                                  }
                                />
                                <Input
                                  value={label}
                                  onChange={(e) =>
                                    updateMenuConfig(
                                      s.id,
                                      "label",
                                      e.target.value
                                    )
                                  }
                                  disabled={!isSelected}
                                  className="h-8 text-sm"
                                />
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest w-16 text-right truncate">
                                  Section
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t space-y-2">
              <Label>Call to Action Button</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={formData.ctaText || ""}
                  onChange={(e) => updateField("ctaText", e.target.value)}
                  placeholder="Button Text"
                />
                <Input
                  value={formData.ctaLink || ""}
                  onChange={(e) => updateField("ctaLink", e.target.value)}
                  placeholder="/checkout or #contact"
                />
              </div>
            </div>
          </div>
        );
      case "dynamic_store":
        return (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Store Inventory</h4>
                <p className="text-xs text-muted-foreground mb-3 mt-1 max-w-[250px] mx-auto">
                  Add or edit the actual products in your database.
                </p>
              </div>
              <Button
                onClick={() => setIsProductManagerOpen(true)}
                className="w-full shadow-sm"
              >
                Manage Inventory
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">
                Display Settings
              </h4>
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g., My Store"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle (Optional)</Label>
                <Input
                  value={formData.subtitle || ""}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="e.g., Browse my available services and packages."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Products</Label>
                  <Input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.maxProductsToShow || 6}
                    onChange={(e) =>
                      updateField("maxProductsToShow", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-1">
                <Label>Select Specific Products</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Choose exactly which products show here. If none are selected,
                  your most recent active products will display automatically.
                </p>
              </div>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 space-y-2 bg-muted/10">
                {availableProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No products found in your inventory.
                  </p>
                ) : (
                  availableProducts.map((prod) => {
                    const isSelected = (
                      formData.selectedProductIds || []
                    ).includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`prod-${prod.id}`}
                          checked={isSelected}
                          onChange={(e) => {
                            const currentList =
                              formData.selectedProductIds || [];
                            let newList;
                            if (e.target.checked)
                              newList = [...currentList, prod.id];
                            else
                              newList = currentList.filter(
                                (id: string) => id !== prod.id
                              );
                            updateField("selectedProductIds", newList);
                          }}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                        />
                        <Label
                          htmlFor={`prod-${prod.id}`}
                          className="text-sm font-normal cursor-pointer flex-1 flex justify-between items-center"
                        >
                          <span className="truncate pr-2">{prod.title}</span>
                          {prod.status !== "active" && (
                            <Badge
                              variant="destructive"
                              className="text-[9px] uppercase px-1 py-0 h-4"
                            >
                              Draft
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );

      case "lead_form": {
        const isCustomForm = !formData.formId || formData.formId === "custom";
        const selectedFormObj = savedForms.find(
          (f) => f.id === formData.formId
        );

        return (
          <div className="space-y-6">
            {/* 🚀 0. GLOBAL TEMPLATE MANAGEMENT */}
            <div className="space-y-4 p-4 border rounded-xl bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-2xl rounded-full pointer-events-none" />

              <div className="flex items-center justify-between mb-2 border-b border-primary/10 pb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <Library size={18} className="text-primary" />
                  <Label className="text-lg font-bold text-primary tracking-tight">
                    Form Library
                  </Label>
                </div>

                {!isCustomForm && (
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-600 rounded border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      Auto-Syncing
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 relative z-10">
                <Label className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                  Selected Template
                </Label>
                <div className="flex flex-col gap-3">
                  <Select
                    value={formData.formId || "custom"}
                    onValueChange={(val) => {
                      if (val === "custom") {
                        const newFormData = { ...formData, formId: "custom" };
                        setFormData(newFormData);
                        if (section)
                          updateSectionInStore(section.id, {
                            data: newFormData,
                          }); // 🚀 INSTANT SYNC
                      } else {
                        const template = savedForms.find((f) => f.id === val);
                        if (template) {
                          const newFormData = {
                            ...formData,
                            formId: val,
                            title: template.title || "",
                            subheadline: template.subheadline || "",
                            buttonText: template.button_text || "",
                            successTitle: template.success_title || "",
                            successMessage: template.success_message || "",
                            variant: template.variant || "centered",
                            image: template.image || "",
                            fields: template.fields || [],
                          };

                          setFormData(newFormData);
                          if (section)
                            updateSectionInStore(section.id, {
                              data: newFormData,
                            }); // 🚀 INSTANT SYNC
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="bg-background w-full h-10 border-primary/20 shadow-sm">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="custom"
                        className="font-bold text-primary"
                      >
                        ✨ Custom Form (This page only)
                      </SelectItem>
                      {savedForms.map((form) => (
                        <SelectItem
                          key={form.id}
                          value={form.id}
                          className="font-medium"
                        >
                          {form.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* 🚀 DYNAMIC ACTION BUTTONS */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isCustomForm ? (
                      <Button
                        className="h-9 shadow-sm"
                        size="sm"
                        onClick={async () => {
                          const templateName = prompt(
                            "Enter a name for this form template (e.g., 'Main Contact Form'):"
                          );
                          if (!templateName) return;

                          try {
                            const { data, error } = await supabase
                              .from("forms")
                              .insert({
                                portfolio_id: portfolioId,
                                name: templateName,
                                title: formData.title,
                                subheadline: formData.subheadline,
                                button_text: formData.buttonText,
                                success_title: formData.successTitle,
                                success_message: formData.successMessage,
                                variant: formData.variant || "centered",
                                image: formData.image || "",
                                fields: formData.fields || [],
                              })
                              .select()
                              .single();

                            if (error) throw error;

                            setSavedForms((prev) => [data, ...prev]);

                            const newFormData = {
                              ...formData,
                              formId: data.id,
                            };
                            setFormData(newFormData);
                            if (section)
                              updateSectionInStore(section.id, {
                                data: newFormData,
                              }); // 🚀 INSTANT SYNC

                            alert("Template saved successfully!");
                          } catch (err: any) {
                            alert(`Failed to save template: ${err.message}`);
                          }
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" /> Save as Template
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 bg-background shadow-sm hover:text-primary hover:border-primary/50 transition-colors"
                          onClick={async () => {
                            const newName = prompt(
                              "Enter new template name:",
                              selectedFormObj?.name
                            );
                            if (!newName || newName === selectedFormObj?.name)
                              return;

                            const { error } = await supabase
                              .from("forms")
                              .update({ name: newName })
                              .eq("id", formData.formId);
                            if (!error) {
                              setSavedForms((prev) =>
                                prev.map((f) =>
                                  f.id === formData.formId
                                    ? { ...f, name: newName }
                                    : f
                                )
                              );
                            }
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" /> Rename
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-background shadow-sm hover:text-primary hover:border-primary/50 transition-colors"
                          title="Duplicate Template"
                          onClick={async () => {
                            const { data, error } = await supabase
                              .from("forms")
                              .insert({
                                portfolio_id: portfolioId,
                                name: `${
                                  selectedFormObj?.name || "Template"
                                } (Copy)`,
                                title: formData.title,
                                subheadline: formData.subheadline,
                                button_text: formData.buttonText,
                                success_title: formData.successTitle,
                                success_message: formData.successMessage,
                                variant: formData.variant || "centered",
                                image: formData.image || "",
                                fields: formData.fields || [],
                              })
                              .select()
                              .single();

                            if (!error && data) {
                              setSavedForms((prev) => [data, ...prev]);
                              const newFormData = {
                                ...formData,
                                formId: data.id,
                              };
                              setFormData(newFormData);
                              if (section)
                                updateSectionInStore(section.id, {
                                  data: newFormData,
                                }); // 🚀 INSTANT SYNC
                            }
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9 shadow-sm ml-auto"
                          title="Delete Template"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Delete this template permanently? Sections using it will keep their current data but will be converted to Custom Forms."
                              )
                            )
                              return;

                            const { error } = await supabase
                              .from("forms")
                              .delete()
                              .eq("id", formData.formId);

                            if (!error) {
                              setSavedForms((prev) =>
                                prev.filter((f) => f.id !== formData.formId)
                              );
                              const newFormData = {
                                ...formData,
                                formId: "custom",
                              };
                              setFormData(newFormData);
                              if (section)
                                updateSectionInStore(section.id, {
                                  data: newFormData,
                                }); // 🚀 INSTANT SYNC
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-primary/60 font-medium leading-relaxed pt-2 border-t border-primary/10">
                  {isCustomForm
                    ? "Save your current setup as a template to reuse it on other pages and connect it to Pricing checkout buttons."
                    : "Any changes you make below are auto-saved and will apply to ALL sections across your site that are using this specific template."}
                </p>
              </div>
            </div>

            {/* 1. TEXT CONTENT */}
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Type size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Section Header
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Form Title
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Let's Work Together"
                  className="font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Subtitle / Note
                </Label>
                <Textarea
                  value={formData.subheadline || ""}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="Fill out the form below and we'll get back to you within 24 hours."
                  className="resize-none"
                  rows={2}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Submit Button Text
                </Label>
                <Input
                  value={formData.buttonText || ""}
                  onChange={(e) => updateField("buttonText", e.target.value)}
                  placeholder="e.g. Send Message"
                />
              </div>
            </div>

            {/* SUCCESS MESSAGE SETTINGS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-green-500" /> Success
                  Title
                </Label>
                <Input
                  value={formData.successTitle || ""}
                  onChange={(e) => updateField("successTitle", e.target.value)}
                  placeholder="Message Sent!"
                  className="font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-green-500" /> Success
                  Note
                </Label>
                <Textarea
                  value={formData.successMessage || ""}
                  onChange={(e) =>
                    updateField("successMessage", e.target.value)
                  }
                  placeholder="Thank you! We will get back to you shortly."
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            {/* 2. MEDIA MANAGER */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <ImageIcon size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Side Cover Image
                </Label>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-2 mb-2">
                Note: This image is only visible when using the "Split Screen" layout in the Design tab.
              </p>
              <div className="flex gap-3 items-center p-3 border rounded-md bg-background">
                    {formData.image && (
                      <div className="h-16 w-16 rounded overflow-hidden border shrink-0 bg-muted">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setActiveMediaField("image");
                        setIsMediaPickerOpen(true);
                      }}
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      {formData.image ? "Change Image" : "Select Image"}
                    </Button>
                  </div>
            </div>

            {/* 3. FORM FIELDS BUILDER */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-primary" />
                  <Label className="text-base font-semibold">Form Fields</Label>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-background shadow-sm"
                  onClick={() => {
                    const newField = {
                      id: `field_${Date.now()}`,
                      label: "New Field",
                      type: "text",
                      placeholder: "",
                      required: false,
                      width: "full",
                    };
                    updateField("fields", [
                      ...(formData.fields || []),
                      newField,
                    ]);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Field
                </Button>
              </div>

              <div className="space-y-4 pt-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      const oldIndex = formData.fields.findIndex(
                        (f: any, idx: number) =>
                          (f.id || `form-field-${idx}`) === active.id
                      );
                      const newIndex = formData.fields.findIndex(
                        (f: any, idx: number) =>
                          (f.id || `form-field-${idx}`) === over.id
                      );
                      updateField(
                        "fields",
                        arrayMove(formData.fields, oldIndex, newIndex)
                      );
                    }
                  }}
                >
                  <SortableContext
                    items={(formData.fields || []).map(
                      (f: any, idx: number) => f.id || `form-field-${idx}`
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {(formData.fields || []).map((field: any, idx: number) => (
                      <SortableFormField
                        key={field.id || `form-field-${idx}`}
                        field={field}
                        idx={idx}
                        updateFieldData={(
                          index: number,
                          key: string,
                          value: any
                        ) => {
                          const newFields = [...formData.fields];
                          newFields[index][key] = value;
                          updateField("fields", newFields);
                        }}
                        removeField={(index: number) => {
                          const newFields = [...formData.fields];
                          newFields.splice(index, 1);
                          updateField("fields", newFields);
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {(!formData.fields || formData.fields.length === 0) && (
                  <div className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No fields added</p>
                    <p className="text-xs opacity-70">
                      Click "Add Field" to start building your form.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
      case "shop":
        return (
          <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Type size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Section Header
                </Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Shop Title
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="Shop"
                  className="font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Subtitle
                </Label>
                <Textarea
                  value={formData.subheadline || ""}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="Browse our latest collection."
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* 1. PRODUCT MANAGER (WITH DND) */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={16} className="text-primary" />
                  <Label className="text-base font-semibold">
                    Product Catalog
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-background shadow-sm"
                  onClick={handleAddProduct}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Product
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      const oldIndex = formData.products.findIndex(
                        (p: any, idx: number) =>
                          (p.id || `shop-product-${idx}`) === active.id
                      );
                      const newIndex = formData.products.findIndex(
                        (p: any, idx: number) =>
                          (p.id || `shop-product-${idx}`) === over.id
                      );
                      updateField(
                        "products",
                        arrayMove(formData.products, oldIndex, newIndex)
                      );
                    }
                  }}
                >
                  <SortableContext
                    items={(formData.products || []).map(
                      (p: any, idx: number) => p.id || `shop-product-${idx}`
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {(formData.products || []).map(
                      (product: any, idx: number) => (
                        <SortableShopProduct
                          key={product.id || `shop-product-${idx}`}
                          product={product}
                          idx={idx}
                          updateProduct={updateProduct}
                          removeProduct={removeProduct}
                          duplicateProduct={duplicateProduct}
                          setActiveMediaField={setActiveMediaField}
                          setIsMediaPickerOpen={setIsMediaPickerOpen}
                          setIsFormManagerOpen={setIsFormManagerOpen} // 🚀 Ensure this is passed!
                          savedForms={savedForms}
                        />
                      )
                    )}
                  </SortableContext>
                </DndContext>

                {(!formData.products || formData.products.length === 0) && (
                  <div
                    className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={handleAddProduct}
                  >
                    <ShoppingBag className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No products added</p>
                    <p className="text-xs opacity-70">
                      Click here to add your first product
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "hero":
        return (
          <div className="space-y-6">
            {/* --- CONTENT & TYPOGRAPHY --- */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <Label className="text-base font-semibold">
                Content & Typography
              </Label>
              <div className="grid gap-2">
                <Label>Eyebrow Label (Small Top Text)</Label>
                <Input
                  value={formData.label || ""}
                  onChange={(e) => updateField("label", e.target.value)}
                  placeholder="e.g. Welcome to my portfolio"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Main Headline</Label>
                  <div className="flex items-center gap-2">
                    <Label
                      className="text-[10px] text-muted-foreground cursor-pointer"
                      htmlFor="typewriter"
                    >
                      Typewriter Effect?
                    </Label>
                    <Switch
                      id="typewriter"
                      checked={formData.animateHeadline === true}
                      onCheckedChange={(c) => updateField("animateHeadline", c)}
                    />
                  </div>
                </div>
                <Textarea
                  value={formData.headline || ""}
                  onChange={(e) => updateField("headline", e.target.value)}
                  placeholder="Creative & Voice Actor"
                  className="font-bold text-lg h-20"
                />
              </div>
              <div className="grid gap-2">
                <Label>Subheadline</Label>
                <Textarea
                  value={formData.subheadline || ""}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="Based in Los Angeles. Available for worldwide bookings."
                  className="h-20"
                />
              </div>
            </div>

            {/* --- 🚀 NEW: TRUST SIGNALS (Conversion Booster) --- */}
            <div className="space-y-4 p-4 border rounded-lg border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <Label className="text-base font-semibold text-amber-700">
                    Trust Badge
                  </Label>
                </div>
                <Switch
                  checked={formData.showTrustBadge === true}
                  onCheckedChange={(checked) =>
                    updateField("showTrustBadge", checked)
                  }
                />
              </div>
              {formData.showTrustBadge && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 pt-2">
                  <Label className="text-amber-900">Badge Text</Label>
                  <Input
                    value={formData.trustText || "★★★★★ 5.0 from 100+ Reviews"}
                    onChange={(e) => updateField("trustText", e.target.value)}
                    placeholder="e.g. Trusted by 50+ Brands"
                    className="border-amber-200 focus-visible:ring-amber-500"
                  />
                  <p className="text-[10px] text-amber-700/70">
                    Appears directly above or below the primary Call to Action.
                  </p>
                </div>
              )}
            </div>

            {/* --- MEDIA BACKGROUND --- */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <Label className="text-base font-semibold">
                Background Media
              </Label>

              <div className="flex bg-muted/50 p-1 rounded-lg border mb-4">
                <button
                  className={cn(
                    "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                    formData.variant !== "video" && formData.variant !== "color"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => updateField("variant", "static")}
                >
                  <ImageIcon size={14} className="inline mr-2" /> Image
                </button>
                <button
                  className={cn(
                    "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                    formData.variant === "video"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => updateField("variant", "video")}
                >
                  <Video size={14} className="inline mr-2" /> Video
                </button>
                <button
                  className={cn(
                    "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                    formData.variant === "color"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => updateField("variant", "color")}
                >
                  <Palette size={14} className="inline mr-2" /> Color
                </button>
              </div>

              {/* 🚀 OPTION 1: VIDEO (Upgraded for Mobile) */}
              {formData.variant === "video" ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  {/* Desktop Video Block */}
                  <div className="grid gap-4 p-3 border rounded-md bg-background">
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <Monitor size={14} /> Desktop Video Source
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.videoUrl || ""}
                            onChange={(e) =>
                              updateField("videoUrl", e.target.value)
                            }
                            placeholder="Paste link or select from library..."
                            className="pl-9"
                          />
                        </div>
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => {
                            setActiveMediaField("videoUrl");
                            setIsMediaPickerOpen(true);
                          }}
                          title="Select from Library"
                        >
                          <Video className="h-4 w-4 mr-2" /> Library
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Supports direct MP4 links, YouTube, Instagram, or
                        TikTok.
                      </p>
                    </div>

                    <div className="grid gap-2 pt-2 border-t">
                      <Label className="text-xs">
                        Desktop Poster (Fallback)
                      </Label>
                      <div className="flex gap-2 items-center">
                        {formData.backgroundImage && (
                          <div className="h-9 w-9 rounded overflow-hidden border shrink-0 bg-muted relative group">
                            <img
                              src={formData.backgroundImage}
                              className="h-full w-full object-cover"
                              alt="preview"
                            />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-grow justify-start"
                          onClick={() => {
                            setActiveMediaField("backgroundImage");
                            setIsMediaPickerOpen(true);
                          }}
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />{" "}
                          {formData.backgroundImage
                            ? "Change Poster"
                            : "Select Poster Image"}
                        </Button>
                        {formData.backgroundImage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => updateField("backgroundImage", "")}
                            title="Remove Image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Video Block */}
                  <div className="grid gap-4 p-3 border rounded-md bg-background">
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <Smartphone size={14} /> Mobile Video (Optional)
                      </Label>
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Upload a vertical reel specifically for phones.
                      </p>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={formData.mobileVideoUrl || ""}
                            onChange={(e) =>
                              updateField("mobileVideoUrl", e.target.value)
                            }
                            placeholder="Vertical video link..."
                            className="pl-9"
                          />
                        </div>
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => {
                            setActiveMediaField("mobileVideoUrl");
                            setIsMediaPickerOpen(true);
                          }}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {!formData.mobileVideoUrl ? (
                      <div className="grid gap-2 pt-2 border-t">
                        <Label className="text-xs">
                          Desktop Video Fit (On Mobile)
                        </Label>
                        <Select
                          value={formData.mobileVideoFit || "cover"}
                          onValueChange={(val) =>
                            updateField("mobileVideoFit", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">
                              Crop to Fill Screen (Default)
                            </SelectItem>
                            <SelectItem value="fill">
                              Stretch to Fill Screen
                            </SelectItem>
                            <SelectItem value="contain">
                              Show Original (Letterbox)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="grid gap-2 pt-2 border-t">
                        <Label className="text-xs">
                          Mobile Poster (Fallback)
                        </Label>
                        <div className="flex gap-2 items-center">
                          {formData.mobileBackgroundImage && (
                            <div className="h-9 w-6 rounded overflow-hidden border shrink-0 bg-muted relative group">
                              <img
                                src={formData.mobileBackgroundImage}
                                className="h-full w-full object-cover"
                                alt="preview"
                              />
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-grow justify-start"
                            onClick={() => {
                              setActiveMediaField("mobileBackgroundImage");
                              setIsMediaPickerOpen(true);
                            }}
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />{" "}
                            {formData.mobileBackgroundImage
                              ? "Change Mobile Poster"
                              : "Select Mobile Poster"}
                          </Button>
                          {formData.mobileBackgroundImage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() =>
                                updateField("mobileBackgroundImage", "")
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : /* 🚀 OPTION 2: COLOR / GRADIENT */
              formData.variant === "color" ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-3 border rounded-md bg-background">
                  <div className="space-y-2">
                    <Label>Background Type</Label>
                    <Select
                      value={formData.colorType || "solid"}
                      onValueChange={(val) => updateField("colorType", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="gradient">
                          Creative Gradient
                        </SelectItem>
                        <SelectItem value="mesh">
                          Animated Glass Mesh
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.colorType === "solid" ? (
                    <div className="space-y-2 pt-2">
                      <Label className="text-xs">Select Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.backgroundColor || "#000000"}
                          onChange={(e) =>
                            updateField("backgroundColor", e.target.value)
                          }
                          className="h-8 w-8 rounded cursor-pointer border"
                        />
                        <Input
                          value={formData.backgroundColor || "#000000"}
                          onChange={(e) =>
                            updateField("backgroundColor", e.target.value)
                          }
                          className="h-8 font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-3 border-t">
                      <Label className="text-xs font-bold text-primary">
                        Custom Gradient Colors
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Color 1
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.gradientColor1 || "#0f172a"}
                              onChange={(e) =>
                                updateField("gradientColor1", e.target.value)
                              }
                              className="h-8 w-8 rounded cursor-pointer border"
                            />
                            <Input
                              value={formData.gradientColor1 || "#0f172a"}
                              onChange={(e) =>
                                updateField("gradientColor1", e.target.value)
                              }
                              className="h-8 font-mono text-[10px] uppercase px-2"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Color 2
                          </Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formData.gradientColor2 || "#3b82f6"}
                              onChange={(e) =>
                                updateField("gradientColor2", e.target.value)
                              }
                              className="h-8 w-8 rounded cursor-pointer border"
                            />
                            <Input
                              value={formData.gradientColor2 || "#3b82f6"}
                              onChange={(e) =>
                                updateField("gradientColor2", e.target.value)
                              }
                              className="h-8 font-mono text-[10px] uppercase px-2"
                            />
                          </div>
                        </div>
                      </div>
                      {formData.colorType === "mesh" && (
                        <p className="text-[10px] text-muted-foreground">
                          The mesh animation will smoothly loop between these
                          two colors.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* 🚀 OPTION 3: STATIC IMAGE */
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid gap-2 p-3 border rounded-md bg-background">
                    <Label className="flex items-center gap-2">
                      <Monitor size={14} /> Desktop Background Image
                    </Label>
                    <div className="flex gap-2 items-center">
                      {formData.backgroundImage && (
                        <div className="h-9 w-9 rounded overflow-hidden border shrink-0 bg-muted relative group">
                          <img
                            src={formData.backgroundImage}
                            className="h-full w-full object-cover"
                            alt="preview"
                          />
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-grow justify-start"
                        onClick={() => {
                          setActiveMediaField("backgroundImage");
                          setIsMediaPickerOpen(true);
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />{" "}
                        {formData.backgroundImage
                          ? "Change Desktop Image"
                          : "Select Image"}
                      </Button>
                      {formData.backgroundImage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() => updateField("backgroundImage", "")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2 p-3 border rounded-md bg-background">
                    <div className="flex justify-between items-center">
                      <Label className="flex items-center gap-2">
                        <Smartphone size={14} /> Mobile Background (Optional)
                      </Label>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Upload a vertical image so faces/subjects aren't cropped
                      out on phones.
                    </p>
                    <div className="flex gap-2 items-center">
                      {formData.mobileBackgroundImage && (
                        <div className="h-9 w-6 rounded overflow-hidden border shrink-0 bg-muted relative group">
                          <img
                            src={formData.mobileBackgroundImage}
                            className="h-full w-full object-cover"
                            alt="preview"
                          />
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-grow justify-start"
                        onClick={() => {
                          setActiveMediaField("mobileBackgroundImage");
                          setIsMediaPickerOpen(true);
                        }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />{" "}
                        {formData.mobileBackgroundImage
                          ? "Change Mobile Image"
                          : "Select Mobile Image"}
                      </Button>
                      {formData.mobileBackgroundImage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                          onClick={() =>
                            updateField("mobileBackgroundImage", "")
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 pt-4 border-t">
                <div className="flex justify-between">
                  <Label>Overlay Darkness</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.overlayOpacity || 60}%
                  </span>
                </div>
                <Slider
                  value={[formData.overlayOpacity || 60]}
                  max={95}
                  step={5}
                  onValueChange={([val]: [number]) =>
                    updateField("overlayOpacity", val)
                  }
                />
              </div>
            </div>

            {/* --- CALL TO ACTION --- */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <Label className="text-base font-semibold">
                Call to Action Buttons
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2 border p-3 rounded bg-background">
                  <Label className="text-xs font-bold text-primary">
                    Primary Button
                  </Label>
                  <Input
                    value={formData.ctaText || ""}
                    onChange={(e) => updateField("ctaText", e.target.value)}
                    placeholder="e.g. Book Me"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={formData.ctaLink || ""}
                    onChange={(e) => updateField("ctaLink", e.target.value)}
                    placeholder="/contact"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-2 border p-3 rounded bg-background">
                  <Label className="text-xs font-bold">Secondary Button</Label>
                  <Input
                    value={formData.secondaryCtaText || ""}
                    onChange={(e) =>
                      updateField("secondaryCtaText", e.target.value)
                    }
                    placeholder="e.g. Watch Reel"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={formData.secondaryCtaLink || ""}
                    onChange={(e) =>
                      updateField("secondaryCtaLink", e.target.value)
                    }
                    placeholder="#reel"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "team":
        return (
          <div className="space-y-6">
            {/* 1. TEXT CONTENT */}
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Type size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Section Header
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Team Title
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Meet The Team"
                  className="font-bold"
                />
              </div>

              {/* 🚀 NEW: Subheadline added here! */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Subtitle / Note
                </Label>
                <Textarea
                  value={formData.subheadline || ""}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="The creative minds behind the magic..."
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* 2. MEMBER MANAGER */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <Label className="text-base font-semibold">
                    Team Members
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-background shadow-sm"
                  onClick={handleAddMember}
                >
                  <UserPlus className="w-3 h-3 mr-1" /> Add Member
                </Button>
              </div>

              {/* 🚀 DND-KIT LIST */}
              <div className="space-y-4 pt-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      // We map by the same ID logic used in the SortableTeamMember
                      const oldIndex = formData.members.findIndex(
                        (m: any, idx: number) =>
                          (m.id || `team-member-${idx}`) === active.id
                      );
                      const newIndex = formData.members.findIndex(
                        (m: any, idx: number) =>
                          (m.id || `team-member-${idx}`) === over.id
                      );
                      updateField(
                        "members",
                        arrayMove(formData.members, oldIndex, newIndex)
                      );
                    }
                  }}
                >
                  <SortableContext
                    items={(formData.members || []).map(
                      (m: any, idx: number) => m.id || `team-member-${idx}`
                    )}
                    strategy={verticalListSortingStrategy} // 🚀 1D Vertical list math!
                  >
                    {(formData.members || []).map(
                      (member: any, idx: number) => (
                        <SortableTeamMember
                          key={member.id || `team-member-${idx}`}
                          member={member}
                          idx={idx}
                          updateMember={updateMember}
                          removeMember={removeMember}
                          setActiveMediaField={setActiveMediaField}
                          setIsMediaPickerOpen={setIsMediaPickerOpen}
                        />
                      )
                    )}
                  </SortableContext>
                </DndContext>

                {(!formData.members || formData.members.length === 0) && (
                  <div
                    className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={handleAddMember}
                  >
                    <UserPlus className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No team members yet</p>
                    <p className="text-xs opacity-70">
                      Click here to add your first member
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ); // --- MAP SECTION EDITOR ---
      case "map":
        return (
          <div className="space-y-6">
            {/* 1. TEXT CONTENT */}
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <MapPinned size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Location Details
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Map Title
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Visit Our Studio"
                  className="font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Physical Address
                </Label>
                <Textarea
                  value={formData.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 Creative Ave, Suite 100&#10;Los Angeles, CA 90028"
                  rows={2}
                  className="resize-none"
                />
                <p className="text-[10px] text-muted-foreground pt-1">
                  This address will be displayed on the map overlay card.
                </p>
              </div>
            </div>

            {/* 2. EMBED CONFIGURATION */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5 border-l-4 border-l-primary">
              <div className="flex items-center justify-between mb-2 border-b pb-2">
                <div className="flex items-center gap-2">
                  <Settings2 size={16} className="text-primary" />
                  <Label className="text-base font-semibold">
                    Embed Configuration
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Map size={14} className="text-muted-foreground" /> Google
                    Maps Embed URL (src)
                  </Label>
                  <Input
                    value={formData.mapUrl || ""}
                    onChange={(e) => updateField("mapUrl", e.target.value)}
                    placeholder="https://www.google.com/maps/embed?pb=!1m18..."
                    className="font-mono text-[10px] bg-background"
                  />
                  <div className="bg-primary/10 text-primary/80 text-[10px] p-2 rounded border border-primary/20">
                    <span className="font-bold">How to find this:</span> Go to
                    Google Maps → Click "Share" → Click "Embed a map" → Click
                    "Copy HTML" → Paste it into a text editor and copy{" "}
                    <strong className="underline">ONLY</strong> the URL inside
                    the <code>src="..."</code> quotes.
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-dashed">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <LinkIcon size={14} className="text-muted-foreground" />{" "}
                    'Get Directions' Button Link
                  </Label>
                  <Input
                    value={formData.directionUrl || ""}
                    onChange={(e) =>
                      updateField("directionUrl", e.target.value)
                    }
                    placeholder="https://maps.app.goo.gl/..."
                    className="font-mono text-[10px] bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground pl-1">
                    Paste the direct "Share Link" here. If left empty, the
                    button will try to auto-generate a route based on your
                    address.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "pricing":
        return (
          <div className="space-y-6">
            {/* 1. TEXT CONTENT */}
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Type size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Section Header
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Pricing Title
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Simple, Transparent Pricing"
                  className="font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Subtitle / Note
                </Label>
                <Textarea
                  value={formData.subheadline || ""}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="No hidden fees. Cancel anytime."
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* 2. RATE CARD FOOTER CTA */}
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5 animate-in fade-in slide-in-from-top-2 border-primary/20">
                <div className="flex items-center gap-2 mb-2 border-b border-primary/20 pb-2">
                  <ExternalLink size={16} className="text-primary" />
                  <Label className="text-base font-semibold text-primary">
                    Rate Card Footer Button
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Button Text
                    </Label>
                    <Input
                      value={formData.ctaText || ""}
                      onChange={(e) => updateField("ctaText", e.target.value)}
                      placeholder="e.g. Contact for Custom Rates"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                      Button Link
                    </Label>
                    <Input
                      value={formData.ctaLink || ""}
                      onChange={(e) => updateField("ctaLink", e.target.value)}
                      placeholder="e.g. #contact"
                      className="bg-background"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                Note: This button is only visible when using the "Rate Card" layout in the Design tab. It sits at the bottom to catch users who don't see a plan that fits their needs.
                </p>
              </div>

            {/* 3. PLANS MANAGER */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-primary" />
                  <Label className="text-base font-semibold">
                    Packages & Rates
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-background shadow-sm"
                  onClick={handleAddPlan}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Plan
                </Button>
              </div>

              {/* DND-KIT LIST */}
              <div className="space-y-4 pt-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                      const oldIndex = formData.plans.findIndex(
                        (p: any, idx: number) =>
                          (p.id || `pricing-plan-${idx}`) === active.id
                      );
                      const newIndex = formData.plans.findIndex(
                        (p: any, idx: number) =>
                          (p.id || `pricing-plan-${idx}`) === over.id
                      );
                      updateField(
                        "plans",
                        arrayMove(formData.plans, oldIndex, newIndex)
                      );
                    }
                  }}
                >
                  <SortableContext
                    items={(formData.plans || []).map(
                      (p: any, idx: number) => p.id || `pricing-plan-${idx}`
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {(formData.plans || []).map((plan: any, idx: number) => (
                      <SortablePricingPlan
                        key={plan.id || `pricing-plan-${idx}`}
                        plan={plan}
                        idx={idx}
                        updatePlan={updatePlan}
                        removePlan={removePlan}
                        setIsFormManagerOpen={setIsFormManagerOpen} // 🚀 Ensure this is passed!
                        savedForms={savedForms}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {(!formData.plans || formData.plans.length === 0) && (
                  <div
                    className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={handleAddPlan}
                  >
                    <CreditCard className="w-8 h-8 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No plans added</p>
                    <p className="text-xs opacity-70">
                      Click here to create your first pricing tier
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "about":
        return (
          <div className="space-y-6">
            {/* 2. TEXT CONTENT */}
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Type size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Biography Content
                </Label>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Eyebrow Label
                </Label>
                <Input
                  value={formData.label || ""}
                  onChange={(e) => updateField("label", e.target.value)}
                  placeholder="e.g. Who I Am / My Story"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Main Title
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. About Me"
                  className="font-bold"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Bio Content
                </Label>
                <Textarea
                  rows={6}
                  value={formData.content || ""}
                  onChange={(e) => updateField("content", e.target.value)}
                  placeholder="Write your bio here... (Press Enter to create paragraphs)"
                  className="resize-y"
                />
              </div>
            </div>

            {/* 3. MEDIA PICKER */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <ImageIcon size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Featured Media
                </Label>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-2 mb-2">
                Note: This media is automatically hidden if you select the "Minimal" layout in the Design tab.
              </p>

                <div className="flex gap-4 items-center p-3 bg-background border rounded-md">
                  {/* Smart Preview (Video or Image) */}
                  <div
                    className="h-24 w-24 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 shrink-0 bg-muted/50 relative group cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => {
                      setActiveMediaField("image");
                      setIsMediaPickerOpen(true);
                    }}
                  >
                    {formData.image ? (
                      <>
                        {formData.image.match(/\.(mp4|webm|mov)$/i) ? (
                          <video
                            src={formData.image}
                            className="w-full h-full object-cover opacity-80"
                            muted
                            autoPlay
                            loop
                            playsInline
                          />
                        ) : (
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                            Change
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <Plus size={16} className="mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Add Media
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Upload a high-quality portrait, headshot, or a silent
                      looping video reel to introduce yourself.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setActiveMediaField("image");
                        setIsMediaPickerOpen(true);
                      }}
                    >
                      {formData.image
                        ? "Replace Media"
                        : "Select Image or Video"}
                    </Button>
                  </div>
                </div>
              </div>

            {/* 4. KEY FEATURES LIST */}
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-2">
                  <List size={16} className="text-primary" />
                  <Label className="text-base font-semibold">
                    Key Highlights
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={() => {
                    const current = formData.features || [];
                    updateField("features", [...current, "New Highlight"]);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>

              <div className="space-y-2">
                {(formData.features || []).map(
                  (feature: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-center bg-muted/20 p-1.5 rounded-md border"
                    >
                      <div className="w-6 flex justify-center text-muted-foreground/50">
                        <CheckCircle2 size={14} />
                      </div>
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...formData.features];
                          newFeatures[idx] = e.target.value;
                          updateField("features", newFeatures);
                        }}
                        className="h-8 text-sm bg-background border-transparent hover:border-input focus-visible:border-input"
                        placeholder="e.g. 10+ Years Experience"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => {
                          const newFeatures = [...formData.features];
                          newFeatures.splice(idx, 1);
                          updateField("features", newFeatures);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                )}
                {(!formData.features || formData.features.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-2 italic">
                    Add bullet points to highlight your unique skills.
                  </p>
                )}
              </div>
            </div>

            {/* 5. PROFILE STATS */}
            <div className="space-y-4 p-4 border rounded-lg bg-primary/5 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center border-b border-primary/10 pb-2">
                <div className="flex items-center gap-2">
                  <BarChart size={16} className="text-primary" />
                  <Label className="text-base font-semibold text-primary">
                    Actor Stats Grid
                  </Label>
                </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-background"
                    onClick={() => {
                      const current = formData.stats || [];
                      updateField("stats", [
                        ...current,
                        { label: "Label", value: "Value" },
                      ]);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Stat
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(formData.stats || []).map((stat: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-1.5 bg-background p-2.5 rounded-md border shadow-sm relative group"
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 absolute -top-2 -right-2 bg-background border shadow-sm rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newStats = [...formData.stats];
                          newStats.splice(idx, 1);
                          updateField("stats", newStats);
                        }}
                      >
                        <X size={12} />
                      </Button>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Big Number
                        </Label>
                        <Input
                          placeholder="e.g. 50+"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...formData.stats];
                            newStats[idx].value = e.target.value;
                            updateField("stats", newStats);
                          }}
                          className="h-8 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">
                          Small Label
                        </Label>
                        <Input
                          placeholder="e.g. Projects"
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...formData.stats];
                            newStats[idx].label = e.target.value;
                            updateField("stats", newStats);
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Note: The stats grid is only visible when using the "Actor Profile" layout in the Design tab.
                </p>
              </div>

            {/* 6. CALL TO ACTION */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <LinkIcon size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Call to Action (Optional)
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Button Text
                  </Label>
                  <Input
                    value={formData.ctaText || ""}
                    onChange={(e) => updateField("ctaText", e.target.value)}
                    placeholder="e.g. Download Resume"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Button Link
                  </Label>
                  <Input
                    value={formData.ctaLink || ""}
                    onChange={(e) => updateField("ctaLink", e.target.value)}
                    placeholder="e.g. /contact or https://..."
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case "stats":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose which statistics to display.
            </p>
            <div className="flex items-center justify-between border p-3 rounded-md">
              <Label htmlFor="showProjects">
                Show Completed Projects (Auto)
              </Label>
              <Switch
                id="showProjects"
                checked={formData.showProjects !== false}
                onCheckedChange={(checked) =>
                  updateField("showProjects", checked)
                }
              />
            </div>
            <div className="flex items-center justify-between border p-3 rounded-md">
              <Label htmlFor="showExperience">
                Show Years of Experience (Auto)
              </Label>
              <Switch
                id="showExperience"
                checked={formData.showExperience !== false}
                onCheckedChange={(checked) =>
                  updateField("showExperience", checked)
                }
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <Label>Custom Stats</Label>
                <Button size="sm" variant="ghost" onClick={addStat}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.customStats || []).map(
                  (stat: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Label (e.g. Clients)"
                        value={stat.label}
                        onChange={(e) =>
                          updateStat(index, "label", e.target.value)
                        }
                        className="flex-1"
                      />
                      <Input
                        placeholder="Value (e.g. 50+)"
                        value={stat.value}
                        onChange={(e) =>
                          updateStat(index, "value", e.target.value)
                        }
                        className="w-24"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeStat(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        );

      case "services_showcase":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || "My Services & Work"}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between border p-3 rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="showRates">Show Rates & Description</Label>
                <p className="text-xs text-muted-foreground">
                  Display the starting price and details for each service.
                </p>
              </div>
              <Switch
                id="showRates"
                checked={formData.showRates !== false}
                onCheckedChange={(checked) => updateField("showRates", checked)}
              />
            </div>

            <div className="flex items-center justify-between border p-3 rounded-md">
              <div className="space-y-0.5">
                <Label htmlFor="showDemos">Show Demos</Label>
                <p className="text-xs text-muted-foreground">
                  Display your uploaded demos for each service category.
                </p>
              </div>
              <Switch
                id="showDemos"
                checked={formData.showDemos !== false}
                onCheckedChange={(checked) => updateField("showDemos", checked)}
              />
            </div>

            <div className="pt-4 border-t space-y-2">
              <Label>Call to Action Button</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={formData.ctaText || ""}
                  onChange={(e) => updateField("ctaText", e.target.value)}
                  placeholder="Button Text"
                />
                <Input
                  value={formData.ctaLink || ""}
                  onChange={(e) => updateField("ctaLink", e.target.value)}
                  placeholder="#contact"
                />
              </div>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Type size={16} className="text-primary" />
                <Label className="text-base font-semibold">Section Header</Label>
              </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Reviews Title</Label>
              <Input
                value={formData.title || "Client Love"}
                onChange={(e) => updateField("title", e.target.value)}
                className="font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Subtitle / Note</Label>
              <Textarea
                value={formData.subheadline || ""}
                onChange={(e) => updateField("subheadline", e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-sm animate-in fade-in flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-primary/90 leading-relaxed">
                <strong>Site Reviews are collected from visitors.</strong> Visitors can leave reviews directly on your site. Submitted reviews are saved to your database and must be <strong>approved</strong> in your dashboard before they appear publicly.
              </p>
            </div>

            <SiteReviewsManager portfolioId={portfolioId} />
          </div>
        );

      case "image_slider":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title (Optional)</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. My Best Shots"
              />
            </div>

            {/* 1. SLIDES MANAGER */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <Label>Slides</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddSlide("image")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Slide
                </Button>
              </div>
              <div className="space-y-2">
                {(formData.images || []).map((slide: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 items-start border p-3 rounded-md bg-background shadow-sm group"
                  >
                    {/* Image Preview & Picker */}
                    <div
                      className="w-20 h-20 bg-muted rounded-md flex-shrink-0 relative overflow-hidden cursor-pointer border"
                      onClick={() => {
                        setActiveMediaField(`slider-image-${idx}`);
                        setIsMediaPickerOpen(true);
                      }}
                    >
                      {slide.url ? (
                        <img
                          src={slide.url}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          alt="slide"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-medium uppercase tracking-wider">
                        Change
                      </div>
                    </div>

                    {/* Caption Input */}
                    <div className="flex-grow space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Caption
                      </Label>
                      <Input
                        placeholder="e.g. Headshot 2024"
                        value={slide.caption}
                        onChange={(e) =>
                          handleUpdateSlide(
                            "image",
                            idx,
                            "caption",
                            e.target.value
                          )
                        }
                        className="h-9"
                      />
                    </div>

                    {/* Remove Button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleRemoveSlide("image", idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {(formData.images || []).length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                    No slides added yet. Click "Add Slide" to begin.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "video_slider":
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Section Title</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Showreel & Clips"
              />
            </div>

            {/* 1. VIDEO MANAGER */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <Label>Video Clips</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddSlide("video")}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Video
                </Button>
              </div>

              <div className="space-y-4">
                {(formData.videos || []).map((slide: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-3 border p-4 rounded-lg bg-background shadow-sm relative group"
                  >
                    {/* Remove Button (Top Right) */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleRemoveSlide("video", idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="flex gap-4 items-start">
                      {/* Thumbnail / Library Picker */}
                      <div
                        className="w-32 h-20 bg-black rounded-md flex-shrink-0 relative overflow-hidden cursor-pointer flex items-center justify-center border border-border"
                        onClick={() => {
                          setActiveMediaField(`slider-video-${idx}`);
                          setIsMediaPickerOpen(true);
                        }}
                        title="Pick from Library"
                      >
                        {slide.url ? (
                          <video
                            src={slide.url}
                            className="w-full h-full object-cover opacity-50 pointer-events-none"
                          />
                        ) : (
                          <LinkIcon className="w-8 h-8 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                          <span className="text-[10px] text-white font-medium bg-black/60 px-2 py-1 rounded">
                            Library
                          </span>
                        </div>
                      </div>

                      {/* Text Inputs */}
                      <div className="flex-grow space-y-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">
                            Video URL (YouTube or MP4)
                          </Label>
                          <Input
                            placeholder="https://youtube.com/watch?v=..."
                            value={slide.url || ""}
                            onChange={(e) =>
                              handleUpdateSlide(
                                "video",
                                idx,
                                "url",
                                e.target.value
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Title (e.g. Drama Reel)"
                            value={slide.title}
                            onChange={(e) =>
                              handleUpdateSlide(
                                "video",
                                idx,
                                "title",
                                e.target.value
                              )
                            }
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Caption (Optional)"
                            value={slide.caption}
                            onChange={(e) =>
                              handleUpdateSlide(
                                "video",
                                idx,
                                "caption",
                                e.target.value
                              )
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(formData.videos || []).length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                    No videos added yet. Click "Add Video" to begin.
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "gallery":
        return (
          <div className="space-y-6">
            {/* 1. TEXT CONTENT */}
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Type size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Section Header
                </Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Gallery Title
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. My Portfolio or Behind the Scenes"
                  className="font-bold"
                />
              </div>
            </div>

            {/* 2. MEDIA MANAGER */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <div className="flex justify-between items-center border-b pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-primary" />
                  <Label className="text-base font-semibold">
                    Gallery Media
                  </Label>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-background shadow-sm"
                  onClick={() => {
                    setActiveMediaField("gallery");
                    setIsMediaPickerOpen(true);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add from Library
                </Button>
              </div>

              {/* 🚀 QUICK ADD URL */}
              <div className="flex gap-2 items-center bg-background p-1.5 rounded-md border shadow-sm">
                <div className="bg-muted/50 p-1.5 rounded text-muted-foreground">
                  <LinkIcon size={14} />
                </div>
                <Input
                  placeholder="Paste YouTube or Image URL and press Enter..."
                  className="h-8 text-xs border-0 focus-visible:ring-0 shadow-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        const newImages = [
                          ...(formData.images || []),
                          { url: val },
                        ];
                        updateField("images", newImages);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
              </div>

              {/* 🚀 FLAWLESS DND-KIT GRID */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    const oldIndex = formData.images.findIndex(
                      (i: any) => i.url === active.id
                    );
                    const newIndex = formData.images.findIndex(
                      (i: any) => i.url === over.id
                    );
                    updateField(
                      "images",
                      arrayMove(formData.images, oldIndex, newIndex)
                    );
                  }
                }}
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  <SortableContext
                    items={(formData.images || []).map((i: any) => i.url)}
                    strategy={rectSortingStrategy} // 🚀 THIS ENABLES FLAWLESS 2D GRID SORTING
                  >
                    {(formData.images || []).map((img: any, idx: number) => {
                      const isVid = img.url.match(/\.(mp4|webm|mov)$/i);
                      const ytMatch = img.url.match(
                        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
                      );
                      const ytId =
                        ytMatch && ytMatch[2].length === 11 ? ytMatch[2] : null;

                      return (
                        <SortableMediaItem
                          key={img.url}
                          img={img}
                          idx={idx}
                          isVid={isVid}
                          ytId={ytId}
                          onDelete={() => {
                            const newImages = [...formData.images];
                            newImages.splice(idx, 1);
                            updateField("images", newImages);
                          }}
                        />
                      );
                    })}
                  </SortableContext>

                  {/* Add Button sits cleanly at the end of the CSS grid! */}
                  <div
                    className="relative group aspect-square bg-background rounded-lg overflow-hidden border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setActiveMediaField("gallery");
                      setIsMediaPickerOpen(true);
                    }}
                  >
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Library
                    </span>
                  </div>
                </div>
              </DndContext>

              <p className="text-[10px] text-muted-foreground text-center pt-2">
                Tip: Drag and drop to reorder. You can mix images, MP4s, and
                YouTube links!
              </p>
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-6">
            {/* 1. MESSAGING & TYPOGRAPHY */}
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Type size={16} className="text-primary" />
                <Label className="text-base font-semibold">Messaging</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Headline
                </Label>
                <Input
                  value={formData.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Let's Work Together"
                  className="font-bold text-lg h-10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Subtitle / Note
                </Label>
                <Textarea
                  value={formData.subheadline || ""}
                  onChange={(e) => updateField("subheadline", e.target.value)}
                  placeholder="Available for projects worldwide. Reach out for rates and availability."
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* 2. DIRECT CONTACT INFO */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Mail size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Direct Contact
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.email || ""}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="hello@example.com"
                      className="pl-9 h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs">Button Text</Label>
                  <Input
                    value={formData.ctaText || "Send Email"}
                    onChange={(e) => updateField("ctaText", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs">Phone (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.phone || ""}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="pl-9 h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs">WhatsApp (Optional)</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={formData.whatsapp || ""}
                      onChange={(e) => updateField("whatsapp", e.target.value)}
                      placeholder="15550000000"
                      className="pl-9 h-9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. MEDIA MANAGER */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2 border-b pb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-primary" />
                  <Label className="text-base font-semibold">
                    Featured Image
                  </Label>
                </div>
                {formData.image && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => updateField("image", "")}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground -mt-2 mb-3">
                Note: This image is automatically hidden if you select the "Minimal" layout in the Design tab.
              </p>

                {!formData.image ? (
                  <div
                    className="w-full py-8 border-2 border-dashed rounded-xl bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors group"
                    onClick={() => {
                      setActiveMediaField("image");
                      setIsMediaPickerOpen(true);
                    }}
                  >
                    <div className="bg-background p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform text-muted-foreground group-hover:text-primary">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium">Add Featured Image</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Shown alongside your contact info
                    </p>
                  </div>
                ) : (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border shadow-sm group">
                    <img
                      src={formData.image}
                      alt="Contact Preview"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="shadow-xl"
                        onClick={() => {
                          setActiveMediaField("image");
                          setIsMediaPickerOpen(true);
                        }}
                      >
                        <Camera className="w-4 h-4 mr-2" /> Change Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            {/* 4. SOCIAL PROFILES */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/5">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Share2 size={16} className="text-primary" />
                <Label className="text-base font-semibold">
                  Social Profiles
                </Label>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">
                Icons will automatically appear on your site for any links
                provided below.
              </p>

              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-20 text-muted-foreground uppercase tracking-wider">
                    LinkedIn
                  </span>
                  <Input
                    className="h-9 flex-1 bg-background"
                    value={formData.linkedin || ""}
                    onChange={(e) => updateField("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-20 text-muted-foreground uppercase tracking-wider">
                    Instagram
                  </span>
                  <Input
                    className="h-9 flex-1 bg-background"
                    value={formData.instagram || ""}
                    onChange={(e) => updateField("instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-20 text-muted-foreground uppercase tracking-wider">
                    Twitter (X)
                  </span>
                  <Input
                    className="h-9 flex-1 bg-background"
                    value={formData.twitter || ""}
                    onChange={(e) => updateField("twitter", e.target.value)}
                    placeholder="https://x.com/..."
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold w-20 text-muted-foreground uppercase tracking-wider">
                    Website
                  </span>
                  <Input
                    className="h-9 flex-1 bg-background"
                    value={formData.website || ""}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "html":
        return (
          <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg bg-background shadow-sm">
              <div className="flex items-center gap-2 mb-2 border-b pb-2">
                <Code size={16} className="text-primary" />
                <Label className="text-base font-semibold">Custom HTML/CSS</Label>
              </div>

              {/* 🚀 NEW: JS SANDBOX TOGGLE */}
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-3">
                <div className="space-y-0.5">
                  <Label className="text-amber-700 dark:text-amber-500 font-bold">Sandboxed JavaScript</Label>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-500/70">
                    Run code in an isolated iframe. Enables JS & UCP SDK.
                  </p>
                </div>
                <Switch
                  checked={formData.allowJavascript === true}
                  onCheckedChange={(c) => updateField("allowJavascript", c)}
                />
              </div>

              {formData.allowJavascript && (
                <div className="space-y-3 mb-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl shadow-sm">
                    <div className="space-y-0.5">
                      <Label className="text-indigo-700 dark:text-indigo-400 font-bold">Inject Tailwind CSS</Label>
                      <p className="text-[10px] text-indigo-700/70 dark:text-indigo-400/70">
                        Allows you to use Tailwind utility classes in your code.
                      </p>
                    </div>
                    <Switch
                      checked={formData.useTailwind === true}
                      onCheckedChange={(c) => updateField("useTailwind", c)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl shadow-sm">
                    <div className="space-y-0.5">
                      <Label className="text-sky-700 dark:text-sky-400 font-bold">Full Page Mode</Label>
                      <p className="text-[10px] text-sky-700/70 dark:text-sky-400/70">
                        Sets sandbox height to 100% of the viewport.
                      </p>
                    </div>
                    <Switch
                      checked={formData.useFullPage === true}
                      onCheckedChange={(c) => updateField("useFullPage", c)}
                    />
                  </div>
                  {!formData.useFullPage && (
                    <div className="space-y-3 p-4 bg-muted/20 border rounded-xl animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-bold">Section Height</Label>
                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border shadow-sm">{formData.iframeHeight || 600}px</span>
                      </div>
                      <Slider value={[formData.iframeHeight || 600]} min={200} max={2000} step={50} onValueChange={([val]) => updateField("iframeHeight", val)} />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Adjust the height of the sandbox container when not in Full Page Mode. The content inside will scroll if it overflows.</p>
                    </div>
                  )}
                </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Source Code
                  </Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-background shadow-sm text-primary hover:text-primary" onClick={() => setIsTemplateLibraryOpen(true)}>
                    <LayoutTemplate className="w-3 h-3 mr-1.5" /> Template Library
                  </Button>
                </div>
                <div className="border border-border/50 rounded-xl overflow-hidden shadow-inner relative z-0">
                  <Editor
                    height="400px"
                    language="html"
                    theme={isDark ? "vs-dark" : "light"}
                    value={formData.code || ""}
                    onChange={(value) => updateField("code", value || "")}
                    options={{
                      minimap: { enabled: false },
                      wordWrap: "on",
                      formatOnPaste: true,
                      fontSize: 13,
                      padding: { top: 16 },
                      fontFamily: "JetBrains Mono, monospace",
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14}/> Important Rules
                  </h4>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] bg-background border-amber-500/30 text-amber-700 hover:bg-amber-500/10" onClick={() => setIsHtmlDocsOpen(true)}>
                    <BookOpen size={12} className="mr-1" /> Full Guide
                  </Button>
                </div>
                <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li><strong className="text-foreground">No Document Tags:</strong> Omit <code>&lt;html&gt;</code>, <code>&lt;head&gt;</code>, and <code>&lt;body&gt;</code>.</li>
                  <li><strong className="text-foreground">Scope your CSS:</strong> Prefix all classes to prevent overwriting the main site.</li>
                  {!formData.allowJavascript ? (
                    <li><strong className="text-foreground">No JavaScript:</strong> JS is stripped. Use CSS for interactivity (e.g. <code>:checked</code> for tabs).</li>
                  ) : (
                    <li><strong className="text-foreground">UCP SDK Active:</strong> You can now use <code>window.UCP.addToCart()</code> in your custom scripts!</li>
                  )}
                </ul>
              </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-muted-foreground">
            Detailed settings for this section are available in the Design tab.
          </p>
        );
    }
  };

  // =========================================================
  // 🚀 THE CONDITIONAL RENDER LOGIC
  // =========================================================

  // 1. Extract the actual form content into a variable
  const EditorContent = (
    <div className="w-full h-full flex flex-col">
      {/* We only show the Header if it's NOT inline, because the inline sidebar already has a "<- Back" header */}
      {!isInline && (
        <div className="mb-6 px-4 pt-6">
          <h2 className="text-lg font-semibold">
            Edit{" "}
            {section.type.charAt(0).toUpperCase() +
              section.type.slice(1).replace(/_/g, " ")}
          </h2>
        </div>
      )}

      <Tabs defaultValue="content" className="w-full flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4 mx-4 w-auto">
          <TabsTrigger value="content">Section Content</TabsTrigger>
          <TabsTrigger value="design">Theme Designs</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="space-y-4 px-4 pb-8">
          {renderFields()}
        </TabsContent>
        <TabsContent value="design" className="space-y-4 px-4 pb-8">
          {renderThemeSettings()}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      {/* 2. THE SPLIT: Native Div OR Modal Sheet */}
      {isInline ? (
        EditorContent
      ) : (
        <Sheet open={isOpen} onOpenChange={onClose}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
            {EditorContent}
          </SheetContent>
        </Sheet>
      )}

      {/* 3. MEDIA PICKER REMAINS A DIALOG */}
      <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogTitle className="sr-only">Media Library</DialogTitle>
          <DialogDescription className="sr-only">
            Select or upload media.
          </DialogDescription>
          <div className="p-6 flex-grow overflow-hidden">
            <PortfolioMediaManager
              actorId={actorId}
              onSelect={handleMediaSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
      {/* 🚀 FORM MANAGER IS A SIBLING TO MEDIA PICKER NOW */}
      <FormManager
        isOpen={isFormManagerOpen}
        onClose={() => setIsFormManagerOpen(false)}
        actorId={actorId}
        portfolioId={portfolioId} // 🚀 Pass this down!
        onFormsChange={fetchForms}
      />

      {/* 🚀 FULL HTML DOCUMENTATION MODAL */}
      <Dialog open={isHtmlDocsOpen} onOpenChange={setIsHtmlDocsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Code className="text-primary" /> Custom HTML Guide
            </DialogTitle>
            <DialogDescription>
              Everything you need to safely build stunning custom blocks using pure HTML & CSS.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar text-sm text-muted-foreground leading-relaxed">
            
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b pb-2">
                <span className="text-primary">1.</span> Structure & Layout
              </h3>
              <p>Because this block is injected directly into an existing React webpage, <strong>you must not include structural document tags</strong>.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Remove</strong> <code>&lt;!DOCTYPE html&gt;</code>, <code>&lt;html&gt;</code>, <code>&lt;head&gt;</code>, and <code>&lt;body&gt;</code> tags.</li>
                <li>Paste <strong>only the inner content</strong> (e.g., <code>&lt;style&gt;</code> and <code>&lt;div&gt;</code> tags).</li>
                <li><strong>Full Width:</strong> The block naturally fills the section width. If your design feels boxed in, ensure your outer wrapper doesn't have a fixed <code>max-width</code> or hardcoded <code>margin</code>. Set <code>width: 100%</code>.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b pb-2">
                <span className="text-primary">2.</span> Strictly Scoped CSS
              </h3>
              <p>Any CSS you write inside a <code>&lt;style&gt;</code> tag will apply globally to the entire website. To prevent breaking the platform's core styling, <strong>always prefix your class names</strong> with a unique identifier (e.g., <code>ch-</code>).</p>
              <div className="bg-zinc-950 text-zinc-300 p-4 rounded-xl border border-zinc-800 font-mono text-xs space-y-2 overflow-x-auto">
                <div className="text-emerald-400">/* GOOD: Safely scoped */</div>
                <div>.ch-my-button {"{"} color: red; {"}"}</div>
                <div className="text-rose-400 mt-3">/* BAD: Turns every button on the site red! */</div>
                <div>button {"{"} color: red; {"}"}</div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b pb-2">
                <span className="text-primary">3.</span> Interactivity (No JavaScript)
              </h3>
              <p>For security reasons, <strong>all <code>&lt;script&gt;</code> tags are automatically stripped and will not execute</strong>. To build interactive elements like Tabs or Sliders, you must use Pure CSS techniques.</p>
              
              <div className="space-y-2 mt-4">
                <h4 className="font-bold text-foreground">The Radio Button Hack (For Tabs/Modals)</h4>
                <p>Use hidden HTML radio buttons combined with the CSS <code>:checked</code> pseudo-class to toggle visibility.</p>
                <div className="bg-zinc-950 text-zinc-300 p-4 rounded-xl border border-zinc-800 font-mono text-xs overflow-x-auto">
<pre>{`<!-- HTML -->
<input type="radio" id="tab1" name="tabs" class="hidden" checked>
<label for="tab1">Click Me</label>
<div id="content1" class="tab-content">Hello!</div>

/* CSS */
.hidden { display: none; }
.tab-content { display: none; }
#tab1:checked ~ #content1 { display: block; }`}</pre>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <h4 className="font-bold text-foreground">CSS Scroll Snap (For Sliders)</h4>
                <p>Use native CSS <code>scroll-snap-type: x mandatory;</code> to create perfectly locked horizontal sliding physics without external slider libraries.</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b pb-2">
                <span className="text-primary">4.</span> Third-Party Widgets (Iframes)
              </h3>
              <p>If you need complex functionality (like a Calendly booking widget, a Spotify player, or a Google Map), use standard <code>&lt;iframe&gt;</code> tags. The platform safely allows iframe embeds.</p>
              <p><strong>Pro Tip for Responsive Iframes:</strong> Wrap your iframe in a container with a percentage-based <code>padding-bottom</code> (e.g., 56.25% for 16:9 aspect ratio) and use absolute positioning to make it scale perfectly on mobile.</p>
            </section>

            <section className="space-y-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle size={16} /> Danger: Unclosed Tags
              </h3>
              <p className="text-red-800 dark:text-red-200 text-xs">
                Meticulously check that every <code>&lt;div&gt;</code> you open is properly closed with a <code>&lt;/div&gt;</code>. Because your HTML is injected into the middle of the React component tree, an unclosed tag will swallow the rest of the website below it and completely break the layout!
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b pb-2">
                <span className="text-primary">5.</span> Sandboxed JavaScript & SDK 🚀
              </h3>
              <p>When you enable <strong>Sandboxed JavaScript</strong>, your code is executed safely in an isolated <code>&lt;iframe&gt;</code>. This allows you to write custom <code>&lt;script&gt;</code> tags without compromising platform security!</p>
              <h4 className="font-bold text-foreground mt-4">The UCP SDK</h4>
              <p>Your sandboxed code automatically receives access to the global <code>window.UCP</code> object. Use it to trigger native platform actions from your custom HTML buttons!</p>
              <div className="bg-zinc-950 text-zinc-300 p-4 rounded-xl border border-zinc-800 font-mono text-xs overflow-x-auto space-y-2">
                <div className="text-emerald-400">/* 1. Add a product to the native cart */</div>
                <div>window.UCP.addToCart('prod_123', 1);</div>
                <br />
                <div className="text-emerald-400">/* 2. Open the checkout for a Pricing Plan */</div>
                <div>window.UCP.checkout('plan_456');</div>
              </div>
              
              <h4 className="font-bold text-foreground mt-4">Tailwind Support</h4>
              <p>When the Tailwind toggle is active, you can use standard utility classes (e.g. <code>&lt;div class="bg-blue-500 p-4 rounded-xl"&gt;</code>). This makes it incredibly easy to copy and paste code directly from AI tools like ChatGPT or Claude!</p>

              <h4 className="font-bold text-foreground mt-4">External Libraries (CDNs)</h4>
              <p>Because your code runs in an isolated environment, you can safely import external libraries like <strong>GSAP, Three.js, or jQuery</strong> using standard script tags inside your code block: <br/><code className="text-primary mt-2 inline-block bg-muted/50 p-1.5 rounded">&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"&gt;&lt;/script&gt;</code></p>
            </section>

          </div>
          <DialogFooter className="px-6 py-4 border-t bg-muted/30 shrink-0">
            <Button onClick={() => setIsHtmlDocsOpen(false)} className="w-full sm:w-auto font-bold">
              Got it! Let's build.
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🚀 HTML TEMPLATE LIBRARY MODAL */}
      <Dialog open={isTemplateLibraryOpen} onOpenChange={setIsTemplateLibraryOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30 shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <LayoutTemplate className="text-primary" /> Template Library
            </DialogTitle>
            <DialogDescription>
              Choose a starting point. Loading a template will configure your Sandbox settings automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HTML_TEMPLATES.map((template) => (
              <div 
                key={template.id} 
                className="border rounded-xl p-4 bg-muted/20 hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all flex flex-col h-full"
                onClick={() => handleApplyTemplate(template)}
              >
                <h4 className="font-bold text-foreground mb-2">{template.name}</h4>
                <p className="text-xs text-muted-foreground mb-4 flex-grow">{template.description}</p>
                <div className="flex gap-2">
                  {template.allowJavascript && <Badge variant="secondary" className="text-[9px]">JS Enabled</Badge>}
                  {template.useTailwind && <Badge variant="secondary" className="text-[9px]">Tailwind Inject</Badge>}
                  {!template.allowJavascript && <Badge variant="outline" className="text-[9px]">Pure CSS</Badge>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SectionEditor;