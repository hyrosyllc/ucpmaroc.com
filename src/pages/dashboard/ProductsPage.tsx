import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Package,
  Edit,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  X,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Settings,
  AlertTriangle,
} from "lucide-react";
import SiteFilter from "../../components/dashboard/SiteFilter";
import FormManager from "../../components/builder/FormManager";

// --- INTERFACES ---
interface ProductOptionValue {
  label: string;
  price?: number | "";
}

interface ProductOption {
  name: string;
  values: ProductOptionValue[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  product_type: string;
  status: string;
  price: number;
  compare_at_price?: number;
  track_inventory: boolean;
  stock_count: number;
  sku: string;
  images: string[];
  options: ProductOption[];
  requires_shipping: boolean;
  weight: number;
  category?: string;
  action_type?: string;
  checkout_url?: string;
  whatsapp_number?: string;
  collection_id?: string;
  portfolio_id?: string | null;
  form_id?: string | null;
  slug?: string;
}

export default function ProductsPage() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const actorId = actorData?.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<
    { id: string; title: string }[]
  >([]);
  const [savedForms, setSavedForms] = useState<any[]>([]);
  const [globalCartForms, setGlobalCartForms] = useState<Record<string, string | null>>({});
  const [portfolios, setPortfolios] = useState<{ id: string; public_slug: string; site_name?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFormManagerOpen, setIsFormManagerOpen] = useState(false);

  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({});
  const [initialDataString, setInitialDataString] = useState<string>("{}");
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DERIVE EXISTING PRODUCT TYPES FOR SMART AUTOCOMPLETE ---
  const existingTypes = Array.from(
    new Set(products.map((p) => p.product_type).filter(Boolean))
  );

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const fetchProducts = useCallback(async () => {
    if (!actorId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("pro_products")
      .select("*")
      .eq("actor_id", actorId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
      const cartForms: Record<string, string | null> = {};
      data.forEach(p => {
        if (p.action_type === "cart" && p.form_id) {
          const siteKey = p.portfolio_id || "global";
          if (!cartForms[siteKey]) cartForms[siteKey] = p.form_id;
        }
      });
      setGlobalCartForms(cartForms);
    }

    setIsLoading(false);
  }, [actorId]);

  const fetchForms = useCallback(() => {
    if (!actorId) return;
    supabase
      .from("forms")
      .select("id, name, type, portfolio_id")
      .eq("type", "checkout")
      .then(({ data }) => {
        if (data) setSavedForms(data);
      });
  }, [actorId]);

  useEffect(() => {
    fetchProducts();

    // Fetch Collections for the dropdown
    if (actorId) {
      supabase
        .from("pro_collections")
        .select("id, title")
        .eq("actor_id", actorId)
        .then(({ data }) => {
          if (data) setCollections(data);
        });

        supabase
          .from("portfolios")
          .select("id, public_slug, site_name")
          .eq("actor_id", actorId)
          .then(({ data }) => {
            if (data) setPortfolios(data);
          });

        fetchForms();
    }
  }, [fetchProducts, actorId, fetchForms]);

  const initForm = (prod?: Product) => {
    setEditingId(prod?.id || null);
    
    const initialActionType = prod?.action_type || "cart";
    const initialPortfolioId = prod?.portfolio_id || "";
    let initialFormId = prod?.form_id || "";
    if (!prod && initialActionType === "cart") {
      const siteKey = initialPortfolioId || "global";
      initialFormId = globalCartForms[siteKey] || "";
    }

    const initialData = {
      title: prod?.title || "",
      description: prod?.description || "",
      price: prod?.price || 0,
      compare_at_price: prod?.compare_at_price || 0,
      product_type: prod?.product_type || "",
      status: prod?.status || "active",
      images: prod?.images && prod.images.length > 0 ? prod.images : [],
      track_inventory: prod?.track_inventory ?? true,
      stock_count: prod?.stock_count ?? 0,
      sku: prod?.sku || "",
      options: prod?.options && prod.options.length > 0 ? prod.options : [],
      requires_shipping: prod?.requires_shipping ?? true,
      weight: prod?.weight ?? 0,
      category: prod?.category || "",
      action_type: initialActionType,
      checkout_url: prod?.checkout_url || "",
      whatsapp_number: prod?.whatsapp_number || "",
      collection_id: prod?.collection_id || "",
      portfolio_id: initialPortfolioId,
      form_id: initialFormId,
      slug: prod?.slug || "",
    };
    setFormData(initialData);
    setInitialDataString(JSON.stringify(initialData));
    setOptionInputs({});
    setView("form");
  };

  const isDirty = view === "form" && JSON.stringify(formData) !== initialDataString;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    const { error } = await supabase.from("pro_products").delete().eq("id", id);
    if (!error) fetchProducts();
  };

  const handleSave = async () => {
    if (!formData.title || formData.price === undefined) {
      alert("Title and Price are required.");
      return;
    }

    setIsSaving(true);

    const payload = {
      actor_id: actorId,
      title: formData.title,
      description: formData.description,
      product_type: formData.product_type || "Physical",
      status: formData.status,
      price: formData.price,
      compare_at_price: formData.compare_at_price || null,
      track_inventory: formData.track_inventory,
      stock_count: formData.stock_count,
      sku: formData.sku,
      images: formData.images || [],
      options: formData.options || [],
      requires_shipping: formData.requires_shipping,
      weight: formData.weight,
      category: formData.category,
      action_type: formData.action_type,
      checkout_url: formData.checkout_url,
      whatsapp_number: formData.whatsapp_number,
      collection_id: formData.collection_id || null, // Null if empty so FK doesn't break
      portfolio_id: formData.portfolio_id || null,
      form_id: (formData.action_type === "cart" || formData.action_type === "form_order") ? (formData.form_id || null) : null,
      slug: formData.slug || generateSlug(formData.title),
    };

    let error;
    if (editingId) {
      const { error: updateErr } = await supabase
        .from("pro_products")
        .update(payload)
        .eq("id", editingId);
      error = updateErr;
    } else {
      const { error: insertErr } = await supabase
        .from("pro_products")
        .insert([payload]);
      error = insertErr;
    }

    // Always sync the form_id across all cart items for this portfolio, even if it's being reset to null
    if (!error && payload.action_type === "cart") {
      let query = supabase.from("pro_products")
        .update({ form_id: payload.form_id })
        .eq("actor_id", actorId)
        .eq("action_type", "cart");
      if (payload.portfolio_id) query = query.eq("portfolio_id", payload.portfolio_id);
      else query = query.is("portfolio_id", null);
      await query;
    }

    if (error) {
      console.error("Error saving product:", error);
      alert(`Failed to save product.\n\nError: ${error.message}\n\n(If it mentions a missing column like 'form_id' or 'portfolio_id', make sure to add them to your pro_products table in Supabase!)`);
    } else {
      setView("list");
      fetchProducts();
    }
    setIsSaving(false);
  };

  // --- IMAGE UPLOAD HANDLER ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !actorId) return;
    setIsUploading(true);

    const newImages = [...(formData.images || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${actorId}/products/${fileName}`;

      const { error } = await supabase.storage
        .from("portfolio-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("portfolio-assets").getPublicUrl(filePath);
        newImages.push(publicUrl);
      }
    }

    setFormData({ ...formData, images: newImages });
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    const newImages = (formData.images || []).filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  // --- IMAGE RE-ORDERING ---
  const moveImageLeft = (index: number) => {
    if (index === 0) return;
    const newImages = [...(formData.images || [])];
    const temp = newImages[index];
    newImages[index] = newImages[index - 1];
    newImages[index - 1] = temp;
    setFormData({ ...formData, images: newImages });
  };

  const moveImageRight = (index: number) => {
    const newImages = [...(formData.images || [])];
    if (index === newImages.length - 1) return;
    const temp = newImages[index];
    newImages[index] = newImages[index + 1];
    newImages[index + 1] = temp;
    setFormData({ ...formData, images: newImages });
  };

  // --- DYNAMIC OPTION HANDLERS ---
  const addOptionGroup = () => {
    setFormData({
      ...formData,
      options: [...(formData.options || []), { name: "", values: [] }],
    });
  };

  const removeOptionGroup = (index: number) => {
    setFormData({
      ...formData,
      options: (formData.options || []).filter((_, i) => i !== index),
    });
  };

  const updateOptionName = (index: number, val: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index].name = val;
    setFormData({ ...formData, options: newOptions });
  };

  const addOptionValue = (index: number) => {
    const val = optionInputs[index]?.trim();
    if (!val) return;

    const newOptions = [...(formData.options || [])];
    if (!newOptions[index].values.find((v) => v.label === val)) {
      newOptions[index].values.push({ label: val, price: "" });
    }

    setFormData({ ...formData, options: newOptions });
    setOptionInputs({ ...optionInputs, [index]: "" });
  };

  const updateOptionValuePrice = (
    groupIndex: number,
    valueIndex: number,
    price: string
  ) => {
    const newOptions = [...(formData.options || [])];
    newOptions[groupIndex].values[valueIndex].price = price
      ? parseFloat(price)
      : "";
    setFormData({ ...formData, options: newOptions });
  };

  const removeOptionValue = (groupIndex: number, valueIndex: number) => {
    const newOptions = [...(formData.options || [])];
    newOptions[groupIndex].values.splice(valueIndex, 1);
    setFormData({ ...formData, options: newOptions });
  };

  const handleOptionKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOptionValue(index);
    }
  };

  const handleBack = () => {
    if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
      return;
    }
    setView("list");
  };

  if (!actorId) return null;

  return (
    <div className="p-4 md:p-8 max-w-8xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your inventory, variants, and collections.
          </p>
        </div>
        {view === "list" && (
          <div className="flex items-center gap-3 flex-wrap">
            <SiteFilter
              sites={portfolios.map(p => ({ id: p.id, site_name: p.site_name || p.public_slug }))}
              selectedSiteId={selectedSiteId}
              onChange={setSelectedSiteId}
            />
            <Button onClick={() => initForm()} className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : view === "form" ? (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="-ml-4 text-muted-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSaving}
              >
                Discard
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{" "}
                Save Product
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            {/* LEFT COLUMN: Main Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      placeholder="Short sleeve t-shirt"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      className="min-h-[150px]"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Media Gallery</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {(formData.images?.length ?? 0) > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
                      {formData.images?.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-md overflow-hidden border group bg-black"
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-40 transition-opacity"
                            alt={`Product ${idx}`}
                          />
                          {/* Overlay Controls */}
                          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx > 0 && (
                              <button type="button" onClick={() => moveImageLeft(idx)} className="bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded p-1.5 transition-colors">
                                <ChevronLeft size={16} />
                              </button>
                            )}
                            <button type="button" onClick={() => removeImage(idx)} className="bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white rounded p-1.5 transition-colors">
                              <X size={16} />
                            </button>
                            {idx < (formData.images?.length || 0) - 1 && (
                              <button type="button" onClick={() => moveImageRight(idx)} className="bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded p-1.5 transition-colors">
                                <ChevronRight size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        <p className="text-sm font-medium">
                          Uploading images...
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="bg-primary/10 p-3 rounded-full mb-3">
                          <UploadCloud className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-sm font-medium mb-1">
                          Click to upload files
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Pricing</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>
                      Price <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-7"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Compare at price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-7"
                        value={formData.compare_at_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            compare_at_price: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    Inventory & Shipping
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            weight: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex items-center justify-between">
                      <Label
                        className="text-base font-medium cursor-pointer"
                        htmlFor="track_inv"
                      >
                        Track quantity
                      </Label>
                      <Switch
                        id="track_inv"
                        checked={formData.track_inventory}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, track_inventory: c })
                        }
                      />
                    </div>
                    {formData.track_inventory && (
                      <div className="space-y-2">
                        <Label>Available Stock</Label>
                        <Input
                          type="number"
                          className="max-w-[200px]"
                          value={formData.stock_count}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stock_count: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t flex items-center justify-between">
                    <Label
                      className="text-base font-medium cursor-pointer"
                      htmlFor="req_ship"
                    >
                      This is a physical product
                    </Label>
                    <Switch
                      id="req_ship"
                      checked={formData.requires_shipping}
                      onCheckedChange={(c) =>
                        setFormData({ ...formData, requires_shipping: c })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Variants & Options</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-6">
                  {formData.options?.length === 0 ? (
                    <Button variant="outline" onClick={addOptionGroup}>
                      <Plus className="w-4 h-4 mr-2" /> Add options like size or
                      color
                    </Button>
                  ) : (
                    <div className="space-y-6">
                      {formData.options?.map((opt, groupIdx) => (
                        <div
                          key={groupIdx}
                          className="p-5 border rounded-lg bg-muted/10 space-y-4 relative"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOptionGroup(groupIdx)}
                            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="space-y-2 max-w-sm">
                            <Label>Option name</Label>
                            <Input
                              placeholder="e.g., Size, Color"
                              value={opt.name}
                              onChange={(e) =>
                                updateOptionName(groupIdx, e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-3">
                            <Label>Option values</Label>
                            {opt.values.length > 0 && (
                              <div className="flex flex-col gap-2 mb-3">
                                {opt.values.map((val, valIdx) => (
                                  <div
                                    key={valIdx}
                                    className="flex items-center gap-3 bg-background border rounded-md p-2 w-max"
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="px-2 py-1 text-sm"
                                    >
                                      {val.label}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-muted-foreground">
                                        $
                                      </span>
                                      <Input
                                        type="number"
                                        placeholder="Price (optional)"
                                        className="w-28 h-7 text-xs"
                                        value={val.price ?? ""}
                                        onChange={(e) =>
                                          updateOptionValuePrice(
                                            groupIdx,
                                            valIdx,
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <button
                                      className="text-muted-foreground hover:text-destructive ml-2"
                                      onClick={() =>
                                        removeOptionValue(groupIdx, valIdx)
                                      }
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2 max-w-sm">
                              <Input
                                placeholder="Type a value and press Enter"
                                value={optionInputs[groupIdx] || ""}
                                onChange={(e) =>
                                  setOptionInputs({
                                    ...optionInputs,
                                    [groupIdx]: e.target.value,
                                  })
                                }
                                onKeyDown={(e) =>
                                  handleOptionKeyDown(e, groupIdx)
                                }
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => addOptionValue(groupIdx)}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addOptionGroup}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add another option
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: Organization & Settings */}
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <select
                    className="w-full h-10 px-3 border rounded-md bg-background focus:ring-2"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Checkout Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm focus:ring-2"
                      value={formData.action_type}
                      onChange={(e) => {
                        const newActionType = e.target.value;
                        let newFormId = formData.form_id;
                        if (newActionType === "cart") {
                          const siteKey = formData.portfolio_id || "global";
                          newFormId = globalCartForms[siteKey] || "";
                        }
                        setFormData({
                          ...formData,
                          action_type: newActionType,
                          form_id: newFormId,
                        });
                      }}
                    >
                      <option value="cart">Standard Add to Cart</option>
                      <option value="whatsapp">Order via WhatsApp</option>
                      <option value="link">External Link</option>
                      <option value="form_order">Direct Order Form</option>
                    </select>
                  </div>

                  {formData.action_type === "whatsapp" && (
                    <div className="space-y-2 pt-2">
                      <Label>WhatsApp Number</Label>
                      <Input
                        placeholder="+1234567890"
                        value={formData.whatsapp_number || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            whatsapp_number: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Include country code.
                      </p>
                    </div>
                  )}

                  {formData.action_type === "form_order" && (
                    <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <Label>Select Checkout Form (Direct Order)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] border-dashed"
                          onClick={() => setIsFormManagerOpen(true)}
                        >
                          <Settings className="w-3 h-3 mr-1" /> Manage Forms
                        </Button>
                      </div>
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm focus:ring-2"
                        value={formData.form_id || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            form_id: e.target.value,
                          })
                        }
                      >
                        <option value="">Default Form (Name & Phone)</option>
                        {savedForms.filter(f => !formData.portfolio_id || f.portfolio_id === formData.portfolio_id).map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">Attach a custom form from your library to collect specific details.</p>
                    </div>
                  )}

                                    {formData.action_type === "cart" && (
                    <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-amber-600 dark:text-amber-500 font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> Global Cart Checkout Form</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] border-dashed"
                          onClick={() => setIsFormManagerOpen(true)}
                        >
                          <Settings className="w-3 h-3 mr-1" /> Manage Forms
                        </Button>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-amber-500/30 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/50"
                          value={formData.form_id || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              form_id: e.target.value,
                            })
                          }
                        >
                          <option value="">Default Cart Form (Name & Email)</option>
                          {savedForms.filter(f => !formData.portfolio_id || f.portfolio_id === formData.portfolio_id).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-amber-700 dark:text-amber-500 font-medium leading-relaxed">
                          ⚠️ <strong>Warning:</strong> This form is used globally for the entire cart during checkout. Changing this selection will automatically update the checkout form for <strong>all products</strong> set to "Add to Cart" on this website.
                        </p>
                      </div>
                    </div>
                  )}


                  {formData.action_type === "link" && (
                    <div className="space-y-2 pt-2">
                      <Label>External Checkout URL</Label>
                      <Input
                        placeholder="https://your-external-site.com"
                        value={formData.checkout_url || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            checkout_url: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SMART PRODUCT ORGANIZATION */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    Product Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Store / Website</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm focus:ring-2"
                      value={formData.portfolio_id || ""}
                      onChange={(e) => {
                        const newPortfolioId = e.target.value;
                        let newFormId = formData.form_id;
                        if (formData.action_type === "cart") {
                          const siteKey = newPortfolioId || "global";
                          newFormId = globalCartForms[siteKey] || "";
                        }
                        setFormData({
                          ...formData,
                          portfolio_id: newPortfolioId,
                          form_id: newFormId,
                        });
                      }}
                    >
                      <option value="">Global (All Sites)</option>
                      {portfolios.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.site_name || p.public_slug}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Product Type</Label>
                    <Input
                      list="product-types"
                      placeholder="e.g. Clothing, Service, Digital"
                      value={formData.product_type || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          product_type: e.target.value,
                        })
                      }
                    />
                    <datalist id="product-types">
                      <option value="Physical" />
                      <option value="Digital" />
                      <option value="Service" />
                      {existingTypes
                        .filter(
                          (t) => !["Physical", "Digital", "Service"].includes(t)
                        )
                        .map((t) => (
                          <option key={t} value={t} />
                        ))}
                    </datalist>
                    <p className="text-xs text-muted-foreground">
                      Select an existing type or type a new one.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Collection / Category</Label>
                    <select
                      className="flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm focus:ring-2"
                      value={formData.collection_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          collection_id: e.target.value,
                        })
                      }
                    >
                      <option value="">No Collection</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <Label>Product URL Slug</Label>
                    <Input
                      placeholder="e.g. awesome-tshirt"
                      value={formData.slug || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          slug: generateSlug(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground break-all">
                      Link: /pro/product/
                      <strong>{formData.slug || "product-name"}</strong>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 border border-dashed rounded-xl bg-muted/10">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Add your first product</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Start building your store by adding physical items, digital
            downloads, or services.
          </p>
          <Button onClick={() => initForm()}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      ) : (
        <div className="bg-card border rounded-xl shadow-sm overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Inventory</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.filter((p) => selectedSiteId === "all" || p.portfolio_id === selectedSiteId).map((product) => {
                  const productPortfolio = portfolios.find((p) => p.id === product.portfolio_id);
                  const siteSlug = productPortfolio ? productPortfolio.public_slug : (portfolios[0]?.public_slug || "portfolio");
                  const productUrl = `/pro/${siteSlug}/product/${product.slug || product.id}`;

                  return (
                  <tr
                    key={product.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-md border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground opacity-30" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-base">
                          {product.title}
                        </div>
                        <div className="text-muted-foreground">
                          ${product.price.toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          product.status === "active" ? "default" : "secondary"
                        }
                        className={
                          product.status === "active"
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none"
                            : ""
                        }
                      >
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {product.track_inventory ? (
                        <span
                          className={
                            product.stock_count <= 0
                              ? "text-destructive font-medium"
                              : ""
                          }
                        >
                          {product.stock_count} in stock
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Not tracked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">
                      {product.product_type}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          title="View Product Page"
                        >
                          <a href={productUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => initForm(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormManager
        isOpen={isFormManagerOpen}
        onClose={() => setIsFormManagerOpen(false)}
        actorId={actorId}
        portfolioId={formData.portfolio_id || portfolios[0]?.id || ""}
        onFormsChange={fetchForms}
      />
    </div>
  );
}
