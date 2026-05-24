import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import PortfolioMediaManager from "../dashboard/PortfolioMediaManager";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Trash2,
  Plus,
  GripVertical,
  ChevronLeft,
  Save,
  FileText,
  Settings,
  LayoutList,
  Loader2,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  ShoppingCart,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/supabaseClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface FormManagerProps {
  isOpen: boolean;
  onClose: () => void;
  actorId?: string;
  portfolioId: string;
  onFormsChange?: () => void;
}

import { ALL_COUNTRIES_STRING } from "../../lib/countries";

// --- TEMPLATES ---
const defaultContactTemplate = {
  name: "New Contact Form",
  type: "contact",
  title: "Let's get started",
  subheadline: "Fill out the details below.",
  button_text: "Submit",
  success_title: "Request Sent!",
  success_message: "We'll be in touch soon.",
  image: "",
  fields: [
    {
      id: "name",
      label: "Full Name",
      type: "text",
      required: true,
      width: "full",
    },
    {
      id: "email",
      label: "Email Address",
      type: "email",
      required: true,
      width: "full",
    },
    {
      id: "message",
      label: "Message",
      type: "textarea",
      required: true,
      width: "full",
    },
  ],
};

const defaultCheckoutTemplate = {
  name: "New Checkout Form",
  type: "checkout",
  title: "Complete Your Order",
  subheadline: "Please provide your details to finalize your purchase.",
  button_text: "Complete Order",
  success_title: "Order Received!",
  success_message: "Thank you for your purchase. We will process it shortly.",
  image: "",
  fields: [
    // 🚀 Locked Core Fields (Expanded with City, Zip, Country)
    {
      id: "checkout_name",
      label: "Full Name",
      type: "text",
      required: true,
      width: "full",
      locked: true,
      enabled: true,
    },
    {
      id: "checkout_email",
      label: "Email Address",
      type: "email",
      required: true,
      width: "full",
      locked: true,
      enabled: true,
    },
    {
      id: "checkout_phone",
      label: "Phone Number",
      type: "tel",
      required: false,
      width: "full",
      locked: true,
      enabled: true,
    },
    {
      id: "checkout_address",
      label: "Street Address",
      type: "text",
      required: false,
      width: "full",
      locked: true,
      enabled: true,
    },
    {
      id: "checkout_city",
      label: "City",
      type: "text",
      required: false,
      width: "third",
      locked: true,
      enabled: true,
    },
    {
      id: "checkout_zip",
      label: "Zip / Postal Code",
      type: "text",
      required: false,
      width: "third",
      locked: true,
      enabled: true,
    },
    {
      id: "checkout_country",
      label: "Country",
      type: "select",
      options: ALL_COUNTRIES_STRING,
      required: true,
      width: "third",
      locked: true,
      enabled: true,
    },
  ],
};

// --- DND SORTABLE FIELD ITEM (🚀 ACCORDION DESIGN) ---
const SortableFormField = ({ field, idx, updateField, removeField }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id || `field-${idx}` });

  // 🚀 Keep custom fields expanded by default, lock fields collapsed by default
  const [isExpanded, setIsExpanded] = useState(!field.locked);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  const needsOptions = field.type === "select" || field.type === "radio";
  const isLocked = field.locked;
  const isEnabled = field.enabled !== false;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-xl bg-background shadow-sm transition-all relative overflow-hidden group",
        isDragging && "ring-2 ring-primary shadow-2xl opacity-90 scale-[0.98]",
        isLocked && "border-blue-100",
        !isEnabled && "opacity-60 grayscale-[30%] bg-muted/30"
      )}
    >
      {/* 🚀 ACCORDION HEADER */}
      <div
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
          isLocked ? "bg-blue-50/20" : "bg-transparent",
          isExpanded && "border-b border-border bg-muted/10"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-primary p-1 touch-none"
            onClick={(e) => e.stopPropagation()} // Prevent dragging from toggling accordion
          >
            <GripVertical size={16} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold flex items-center gap-2 truncate">
              {field.label || "Unnamed Field"}
              {field.required && isEnabled && (
                <span className="text-red-500">*</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {field.type} {field.width === "half" && "• Half Width"}
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-3 pl-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {isLocked ? (
            <div
              className="flex items-center gap-2 mr-1"
              title="Core checkout field"
            >
              <Switch
                checked={isEnabled}
                onCheckedChange={(c) => updateField(idx, "enabled", c)}
                className="scale-90 data-[state=checked]:bg-blue-500"
              />
              <Lock size={14} className="text-blue-400 hidden sm:block" />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeField(idx)}
            >
              <Trash2 size={14} />
            </Button>
          )}
          <ChevronDown
            size={16}
            className={cn(
              "text-muted-foreground transition-transform duration-300",
              isExpanded && "rotate-180"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </div>

      {/* 🚀 ACCORDION BODY */}
      {isExpanded && (
        <div
          className={cn(
            "p-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200",
            !isEnabled && "pointer-events-none"
          )}
        >
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-6 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Field Label
              </Label>
              <Input
                value={field.label}
                onChange={(e) => updateField(idx, "label", e.target.value)}
                className="h-9 font-bold"
              />
            </div>
            <div className="col-span-6 sm:col-span-3 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Input Type
              </Label>
              <Select
                disabled={isLocked}
                value={field.type}
                onValueChange={(val) => updateField(idx, "type", val)}
              >
                <SelectTrigger
                  className={cn("h-9 bg-background", isLocked && "opacity-60")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Short Text</SelectItem>
                  <SelectItem value="textarea">
                    Long Text (Paragraph)
                  </SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tel">Phone</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Dropdown (Select)</SelectItem>
                  <SelectItem value="radio">Multiple Choice (Radio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-6 sm:col-span-3 space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Width
              </Label>
              <Select
                value={field.width || "full"}
                onValueChange={(val) => updateField(idx, "width", val)}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="half">Half (50%)</SelectItem>
                  <SelectItem value="third">One Third (33%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsOptions && (
            <div className="space-y-1.5 pt-1 animate-in fade-in p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Label className="text-[10px] uppercase tracking-widest text-primary font-bold">
                Choices (Comma Separated)
              </Label>
              <Input
                placeholder="e.g. Red, Blue, Green"
                value={field.options || ""}
                onChange={(e) => updateField(idx, "options", e.target.value)}
                className="h-9 text-xs bg-background"
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
                  : "e.g. Enter your details here..."
              }
              value={field.placeholder || ""}
              onChange={(e) => updateField(idx, "placeholder", e.target.value)}
              className="h-9 text-xs bg-muted/50"
              disabled={needsOptions}
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-dashed">
            <Switch
              id={`req-${field.id}`}
              checked={field.required}
              onCheckedChange={(c) => updateField(idx, "required", c)}
              disabled={!isEnabled}
            />
            <Label
              htmlFor={`req-${field.id}`}
              className="text-[11px] cursor-pointer font-medium"
            >
              Required Field
            </Label>
            {isLocked && (
              <span className="text-[10px] text-blue-500 ml-auto italic">
                Core checkout field
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function FormManager({
  isOpen,
  onClose,
  actorId,
  portfolioId,
  onFormsChange,
}: FormManagerProps) {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeForm, setActiveForm] = useState<any | null>(null);

  // Modals & Tabs
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isTypeSelectorOpen, setIsTypeSelectorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"setup" | "fields">("fields");
  const [siteName, setSiteName] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchForms = async () => {
    if (!portfolioId) return;
    setLoading(true);

    // Fetch the site name for context
    const { data: portData } = await supabase
      .from("portfolios")
      .select("site_name, public_slug")
      .eq("id", portfolioId)
      .maybeSingle();
    if (portData) {
      setSiteName(portData.site_name || portData.public_slug || "Unknown Site");
    }

    const { data } = await supabase
      .from("forms")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .order("created_at", { ascending: false });

    if (data) setForms(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) fetchForms();
  }, [isOpen, portfolioId]);

  const handleCreateNew = (type: "contact" | "checkout") => {
    const template =
      type === "checkout" ? defaultCheckoutTemplate : defaultContactTemplate;
    setActiveForm({ ...template });
    setActiveTab("fields");
    setIsTypeSelectorOpen(false);
  };

  const handleEdit = (form: any) => {
    setActiveForm({ ...form });
    setActiveTab("fields");
  };

  const handleDuplicate = async (form: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newForm = { ...form };
    delete newForm.id;
    delete newForm.created_at;
    newForm.name = `${newForm.name} (Copy)`;

    const { data, error } = await supabase
      .from("forms")
      .insert(newForm)
      .select()
      .single();

    if (!error && data) {
      setForms([data, ...forms]);
      if (onFormsChange) onFormsChange();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this form? Sections using it will fallback to a default configuration."
      )
    )
      return;
    setForms(forms.filter((f) => f.id !== id));
    await supabase.from("forms").delete().eq("id", id);
    if (onFormsChange) onFormsChange();
  };

  const handleSave = async () => {
    if (!activeForm || !portfolioId) return;
    setSaving(true);

    const payload = { ...activeForm, portfolio_id: portfolioId };
    delete payload.actor_id;

    let res;
    if (payload.id) {
      res = await supabase
        .from("forms")
        .update(payload)
        .eq("id", payload.id)
        .select()
        .single();
    } else {
      res = await supabase.from("forms").insert(payload).select().single();
    }

    if (res.data) {
      setActiveForm(null);
      await fetchForms();
      if (onFormsChange) onFormsChange();
    } else {
      alert("Failed to save form.");
    }
    setSaving(false);
  };

  const updateActiveForm = (key: string, value: any) => {
    setActiveForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`, // 🚀 Stable ID! Never mutates on keystroke.
      label: "New Field",
      type: "text",
      required: false,
      width: "full",
      locked: false,
      enabled: true,
    };
    updateActiveForm("fields", [...(activeForm.fields || []), newField]);
  };

  const updateField = (idx: number, key: string, value: any) => {
    const newFields = [...activeForm.fields];
    newFields[idx][key] = value;
    // 🚀 Bug fixed: Removed the auto-id mutation code that destroyed focus!
    updateActiveForm("fields", newFields);
  };

  const removeField = (idx: number) => {
    const newFields = [...activeForm.fields];
    newFields.splice(idx, 1);
    updateActiveForm("fields", newFields);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:w-[600px] sm:max-w-[100vw] overflow-y-auto p-0 flex flex-col border-l border-border/50">
          {!activeForm ? (
            <>
              <div className="p-6 border-b bg-muted/10">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="text-primary" /> Form Templates
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground">
                  Create and manage forms for <strong className="text-foreground">{siteName || "your site"}</strong>.
                  </p>
                </SheetHeader>
              </div>
              <div className="p-6 flex-grow space-y-4">
                <Button
                  className="w-full h-12 shadow-sm font-bold text-sm"
                  onClick={() => setIsTypeSelectorOpen(true)}
                >
                  <Plus className="mr-2 w-4 h-4" /> Create New Form
                </Button>

                {loading ? (
                  <div className="py-12 flex justify-center">
                    <Loader2 className="animate-spin text-primary" />
                  </div>
                ) : forms.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto opacity-20 mb-3" />
                    <p>No forms created yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {forms.map((form) => (
                      <div
                        key={form.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:border-primary/50 bg-background shadow-sm transition-colors cursor-pointer group"
                        onClick={() => handleEdit(form)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm">{form.name}</h4>
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                form.type === "checkout"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-600"
                              )}
                            >
                              {form.type === "checkout"
                                ? "Checkout"
                                : "Contact"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <LayoutList size={12} /> {form.fields?.length || 0}{" "}
                            fields
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDuplicate(form, e)}
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(form.id, e)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b bg-muted/10 sticky top-0 z-10 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveForm(null)}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      Form Builder
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-full",
                          activeForm.type === "checkout"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-700"
                        )}
                      >
                        {activeForm.type === "checkout"
                          ? "CHECKOUT"
                          : "CONTACT"}
                      </span>
                    </div>
                    <Input
                      value={activeForm.name}
                      onChange={(e) => updateActiveForm("name", e.target.value)}
                      className="h-6 w-48 text-sm font-bold px-1 bg-transparent border-transparent hover:bg-muted/50 focus:bg-background focus:border-border"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="shadow-sm font-bold"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}{" "}
                  Save
                </Button>
              </div>

              <div className="flex border-b bg-muted/5">
                <button
                  className={cn(
                    "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
                    activeTab === "fields"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("fields")}
                >
                  <LayoutList className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />{" "}
                  Form Fields
                </button>
                <button
                  className={cn(
                    "flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
                    activeTab === "setup"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab("setup")}
                >
                  <Settings className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />{" "}
                  Setup & Success
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow bg-muted/5 pb-24">
                {activeTab === "fields" && (
                  <div className="space-y-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        if (over && active.id !== over.id) {
                          const oldIndex = activeForm.fields.findIndex(
                            (f: any) => f.id === active.id
                          );
                          const newIndex = activeForm.fields.findIndex(
                            (f: any) => f.id === over.id
                          );
                          updateActiveForm(
                            "fields",
                            arrayMove(activeForm.fields, oldIndex, newIndex)
                          );
                        }
                      }}
                    >
                      <SortableContext
                        items={(activeForm.fields || []).map((f: any) => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {(activeForm.fields || []).map(
                          (field: any, idx: number) => (
                            <SortableFormField
                              key={field.id}
                              field={field}
                              idx={idx}
                              updateField={updateField}
                              removeField={removeField}
                            />
                          )
                        )}
                      </SortableContext>
                    </DndContext>

                    <Button
                      variant="outline"
                      className="w-full border-dashed h-12 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors bg-transparent"
                      onClick={addField}
                    >
                      <Plus className="mr-2 w-4 h-4" /> Add Custom Field
                    </Button>
                  </div>
                )}

                {activeTab === "setup" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="space-y-4 p-5 border rounded-xl bg-background shadow-sm">
                      <h3 className="text-sm font-bold flex items-center gap-2 border-b pb-2">
                        <FileText size={16} className="text-primary" /> Customer
                        Facing Text
                      </h3>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Form Title
                        </Label>
                        <Input
                          value={activeForm.title || ""}
                          onChange={(e) =>
                            updateActiveForm("title", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Subheadline
                        </Label>
                        <Textarea
                          value={activeForm.subheadline || ""}
                          onChange={(e) =>
                            updateActiveForm("subheadline", e.target.value)
                          }
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Submit Button Text
                        </Label>
                        <Input
                          value={activeForm.button_text || ""}
                          onChange={(e) =>
                            updateActiveForm("button_text", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Side Image URL (Desktop Only)
                        </Label>
                        <div className="flex gap-2 items-center">
                          {activeForm.image && (
                            <div className="h-9 w-9 rounded border overflow-hidden shrink-0 bg-muted">
                              <img
                                src={activeForm.image}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 bg-background"
                            onClick={() => setIsMediaPickerOpen(true)}
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            {activeForm.image
                              ? "Change Image"
                              : "Select from Library"}
                          </Button>
                          {activeForm.image && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => updateActiveForm("image", "")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-5 border rounded-xl bg-green-500/5 shadow-sm border-green-500/20">
                      <h3 className="text-sm font-bold flex items-center gap-2 border-b border-green-500/20 pb-2 text-green-700">
                        <CheckCircle2 size={16} /> Success State
                      </h3>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-green-700">
                          Success Title
                        </Label>
                        <Input
                          value={activeForm.success_title || ""}
                          onChange={(e) =>
                            updateActiveForm("success_title", e.target.value)
                          }
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest text-green-700">
                          Success Message
                        </Label>
                        <Textarea
                          value={activeForm.success_message || ""}
                          onChange={(e) =>
                            updateActiveForm("success_message", e.target.value)
                          }
                          rows={2}
                          className="resize-none bg-background"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>

        {/* 🚀 FORM TYPE SELECTOR MODAL */}
        <Dialog open={isTypeSelectorOpen} onOpenChange={setIsTypeSelectorOpen}>
          <DialogContent className="max-w-md z-[100000]">
            <DialogTitle>Choose Form Type</DialogTitle>
            <DialogDescription>
              What kind of form do you want to build?
            </DialogDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-3 items-center hover:border-primary/50 hover:bg-primary/5"
                onClick={() => handleCreateNew("contact")}
              >
                <div className="p-3 bg-muted rounded-full text-foreground">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-sm">Lead / Contact Form</div>
                  <div className="text-xs text-muted-foreground font-normal whitespace-normal">
                    Perfect for contact pages, inquiries, and pricing requests.
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col gap-3 items-center hover:border-blue-500/50 hover:bg-blue-500/5"
                onClick={() => handleCreateNew("checkout")}
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-sm">Shop Checkout Form</div>
                  <div className="text-xs text-muted-foreground font-normal whitespace-normal">
                    Includes locked shipping & detail fields for processing
                    orders.
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* NESTED MEDIA PICKER DIALOG */}
        <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 z-[100000]">
            <DialogTitle className="sr-only">Media Library</DialogTitle>
            <DialogDescription className="sr-only">
              Select media for form
            </DialogDescription>
            <div className="p-6 flex-grow overflow-hidden">
              <PortfolioMediaManager
                actorId={actorId || ""}
                onSelect={(item) => {
                  updateActiveForm("image", item.url);
                  setIsMediaPickerOpen(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </Sheet>
    </>
  );
}
