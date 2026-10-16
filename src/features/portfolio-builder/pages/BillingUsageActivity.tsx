import React from "react";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowDownRight,
  Gift,
  RotateCcw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBillingData } from "@/hooks/useBillingData";
import { USAGE_CREDIT_PRODUCTS } from "@/config/plans";

const TXN_TYPE_META: Record<string, { label: string; icon: any; tone: string }> = {
  purchase: { label: "Purchase", icon: ArrowDownRight, tone: "text-foreground" },
  redeem_code: { label: "Redeemed code", icon: Gift, tone: "text-emerald-600" },
  chargeback: { label: "Chargeback", icon: RotateCcw, tone: "text-destructive" },
  usage: { label: "Usage", icon: Zap, tone: "text-foreground" },
  usage_reversal: { label: "Usage refund", icon: RotateCcw, tone: "text-emerald-600" },
};

export default function BillingUsageActivity() {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const { loading, data } = useBillingData(actorData?.id);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  const usageByProduct = data.usageRecords.reduce<Record<string, { quantity: number; credits: number }>>(
    (acc, record) => {
      const bucket = acc[record.product_id] || { quantity: 0, credits: 0 };
      bucket.quantity += record.quantity;
      bucket.credits += record.credits_charged;
      acc[record.product_id] = bucket;
      return acc;
    },
    {}
  );

  return (
    <div className="w-full max-w-8xl md:p-4">
      <div className="px-4 py-6 md:py-8">
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Usage & Activity</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Track your AI usage and transaction history.
          </p>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* AI Usage */}
      {USAGE_CREDIT_PRODUCTS.some((product) => usageByProduct[product.id]) && (
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI usage (last 30 days)</CardTitle>
            <CardDescription>Metered Bot+ actions charged against your Platform Credits.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {USAGE_CREDIT_PRODUCTS.filter((product) => usageByProduct[product.id]).map((product) => {
              const bucket = usageByProduct[product.id];
              return (
                <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {bucket.quantity.toLocaleString()} × {product.unitLabel}
                    </div>
                  </div>
                  <div className="text-sm font-semibold whitespace-nowrap">
                    {bucket.credits.toLocaleString()} credits
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card className="rounded-xl shadow-sm border-border/60 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transaction history</CardTitle>
          <CardDescription>Purchases, redemptions, usage, and chargebacks.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {data.transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No transactions yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((tx) => {
                  const meta = TXN_TYPE_META[tx.type] || TXN_TYPE_META.purchase;
                  const Icon = meta.icon;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={meta.tone} />
                          <span className="text-sm font-medium">{meta.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tx.description}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {tx.status || "completed"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold whitespace-nowrap",
                          tx.amount > 0 ? "text-emerald-600" : "text-foreground"
                        )}
                      >
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
