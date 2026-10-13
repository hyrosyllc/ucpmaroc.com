import React from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Globe,
  Receipt,
  Wallet,
} from "lucide-react";

interface BillingLayoutProps {
  children: React.ReactNode;
}

export const BillingLayout: React.FC<BillingLayoutProps> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  return (
    <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
      <div className="sticky top-[60px] md:top-14 z-40 bg-background/95 backdrop-blur-xl border-b border-border/60 px-4 md:px-8 transition-all">
        <TabsList className="h-auto bg-transparent p-0 gap-6 justify-start rounded-none overflow-x-auto no-scrollbar">
          <TabsTrigger
            value="dashboard"
            className="h-11 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
          >
            <LayoutDashboard size={16} className="mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="services"
            className="h-11 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
          >
            <Globe size={16} className="mr-2" /> Services & Subscriptions
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="h-11 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
          >
            <Receipt size={16} className="mr-2" /> Usage & Activity
          </TabsTrigger>
          <TabsTrigger
            value="payment-methods"
            className="h-11 px-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-semibold text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap"
          >
            <Wallet size={16} className="mr-2" /> Payment Methods
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="px-4 md:px-8 py-6">
        {children}
      </div>
    </Tabs>
  );
};
