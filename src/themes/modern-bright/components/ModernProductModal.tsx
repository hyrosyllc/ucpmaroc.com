// src/themes/modern/components/ModernProductModal.tsx
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  MessageCircle,
  X,
  ChevronLeft,
  ExternalLink,
  User,
  Phone,
  MapPin,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModernProductModal({
  product,
  isOpen,
  onClose,
  onExternalLink,
  onWhatsAppOrder,
  onDirectOrder,
}: any) {
  const [step, setStep] = useState<"details" | "form" | "success">("details");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [clientInfo, setClientInfo] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!product) return null;

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [];
  const variants = product.variants || [];
  const actionType = product.actionType || "whatsapp";

  const handleMainAction = () => {
    if (actionType === "link") {
      onExternalLink();
      return;
    }
    if (variants.length > 0) {
      const missing = variants.find((v: any) => !selectedVariants[v.name]);
      if (missing) return alert(`Please select a ${missing.name}`);
    }
    setStep("form");
  };

  const handleConfirmOrder = async () => {
    if (!clientInfo.name || !clientInfo.phone)
      return alert("Please provide your name and phone number.");

    if (actionType === "whatsapp") {
      onWhatsAppOrder(clientInfo, quantity, selectedVariants);
    } else if (actionType === "form_order") {
      setIsSubmitting(true);
      const success = await onDirectOrder(
        clientInfo,
        quantity,
        selectedVariants
      );
      setIsSubmitting(false);
      if (success) setStep("success");
    }
  };

  const handleClose = () => {
    setStep("details");
    setActiveImgIndex(0);
    setQuantity(1);
    setSelectedVariants({});
    setClientInfo({ name: "", address: "", phone: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-neutral-50 text-neutral-900 border-black/10 md:h-[600px] flex flex-col md:flex-row z-[99999]">
        {/* ... All your exact same UI code from before goes here ... */}
        {/* Just replace your old handleConfirmOrder with the logic above */}
      </DialogContent>
    </Dialog>
  );
}
