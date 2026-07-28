import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerMessagesPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
        <MessageSquare size={32} />
      </div>
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Order Chat</h2>
      <p className="text-muted-foreground max-w-sm mb-8 font-medium">
        Messages and support are directly tied to your purchases. To chat with the store owner, please open a specific order from your history.
      </p>
      <Button onClick={() => navigate("../orders")} className="h-12 px-8 rounded-xl font-bold shadow-sm">
        <Package className="w-4 h-4 mr-2" /> Go to Order History
      </Button>
    </div>
  );
}