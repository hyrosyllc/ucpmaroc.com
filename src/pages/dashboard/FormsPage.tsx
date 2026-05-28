import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import FormManager from "../../components/builder/FormManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Settings } from "lucide-react";

export default function FormsPage() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [isFormManagerOpen, setIsFormManagerOpen] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forms & Checkout</h1>
        <p className="text-muted-foreground mt-1">Manage your lead capture and checkout fields.</p>
      </div>
      
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText size={20}/> Form Templates</CardTitle>
          <CardDescription>Customize the fields required when customers contact you or buy a product.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground border-t border-dashed mt-4 bg-muted/10 rounded-b-xl space-y-4">
          <p className="text-center">Launch the Form Manager to edit your templates.</p>
          <Button onClick={() => setIsFormManagerOpen(true)}>
            <Settings className="w-4 h-4 mr-2" /> Open Form Manager
          </Button>
        </CardContent>
      </Card>

      {actorData?.id && (
        <FormManager isOpen={isFormManagerOpen} onClose={() => setIsFormManagerOpen(false)} actorId={actorData.id} portfolioId="global" />
      )}
    </div>
  );
}