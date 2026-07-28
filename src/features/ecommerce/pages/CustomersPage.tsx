import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, Mail, Phone, Calendar, ArrowUpRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SiteFilter from "@/components/dashboard/SiteFilter";

export default function CustomersPage() {
  const { actorData, selectedSiteId, setSelectedSiteId } = useOutletContext<ActorDashboardContextType>();
  const [customers, setCustomers] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!actorData?.id) return;
      setLoading(true);

      // First fetch sites to know which portfolios belong to this actor
      const { data: mySites } = await supabase.from("portfolios").select("id, site_name, public_slug").eq("actor_id", actorData.id);
      if (mySites) setSites(mySites);

      if (!mySites || mySites.length === 0) {
        setLoading(false);
        return;
      }

      const siteIds = mySites.map(s => s.id);

      let query = supabase
        .from("pro_customers")
        .select("*, pro_orders(id, amount_cents, product_price, status)")
        .in("portfolio_id", siteIds)
        .order("created_at", { ascending: false });

      const { data } = await query;
      if (data) setCustomers(data);
      setLoading(false);
    };

    fetchCustomers();
  }, [actorData?.id]);

  const calculateLTV = (orders: any[]) => {
    if (!orders || orders.length === 0) return 0;
    return orders.reduce((sum, o) => {
      if (o.status === "cancelled" || o.status === "refunded") return sum;
      if (o.amount_cents) return sum + (o.amount_cents / 100);
      const parsed = parseFloat(o.product_price?.replace(/[^0-9.]/g, "") || "0");
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);
  };

  const filteredCustomers = customers.filter(c => selectedSiteId === "all" || c.portfolio_id === selectedSiteId);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your registered client accounts and lifetime value.</p>
        </div>
        <div className="flex items-center gap-3">
          <SiteFilter
            sites={sites}
            selectedSiteId={selectedSiteId}
            onChange={setSelectedSiteId}
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-xl bg-muted/10">
          <Users className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">No Customers Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Once customers create an account to track their orders, they will appear here.</p>
        </div>
      ) : (
        <Card className="rounded-xl shadow-sm border-border overflow-hidden animate-in fade-in">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Customer</TableHead>
                  <TableHead className="font-bold">Store</TableHead>
                  <TableHead className="font-bold">Joined</TableHead>
                  <TableHead className="font-bold text-center">Orders</TableHead>
                  <TableHead className="font-bold text-right">Lifetime Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => {
                  const port = sites.find(s => s.id === c.portfolio_id);
                  const ltv = calculateLTV(c.pro_orders);
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-bold text-foreground flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                            {(c.name || "C")[0].toUpperCase()}
                          </div>
                          {c.name || "Customer"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <Mail size={12}/> {c.email}
                        </div>
                        {c.phone && (
                          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <Phone size={12}/> {c.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">
                        {port?.site_name || port?.public_slug || "Global"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(c.created_at).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {c.pro_orders?.length || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold font-mono text-primary flex items-center justify-end gap-1">
                          ${ltv.toFixed(2)} <ArrowUpRight size={14}/>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}