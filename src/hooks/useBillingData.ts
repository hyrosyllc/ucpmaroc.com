import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

export interface BillingData {
  portfolios: any[];
  subscriptions: Record<string, any>;
  transactions: any[];
  paymentAttempts: any[];
  usageRecords: any[];
  todayUsageRecords: any[];
  paymentMethods: any[];
  autoTopUpSettings: {
    enabled: boolean;
    threshold: number;
    amount: number;
  };
}

export const useBillingData = (actorId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingData>({
    portfolios: [],
    subscriptions: {},
    transactions: [],
    paymentAttempts: [],
    usageRecords: [],
    todayUsageRecords: [],
    paymentMethods: [],
    autoTopUpSettings: {
      enabled: false,
      threshold: 50,
      amount: 20,
    },
  });

  const fetchBillingData = useCallback(async () => {
    if (!actorId) return;
    setLoading(true);

    try {
      // Portfolios
      const { data: sites } = await supabase
        .from("portfolios")
        .select("*")
        .eq("actor_id", actorId)
        .order("created_at", { ascending: false });

      // Subscriptions
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("actor_id", actorId);

      const subMap: Record<string, any> = {};
      if (subs) {
        subs.forEach((s) => {
          if (s.status === "active" && new Date(s.current_period_end) > new Date()) {
            subMap[s.portfolio_id] = s;
          } else if (!subMap[s.portfolio_id]) {
            subMap[s.portfolio_id] = s;
          }
        });
      }

      // Transactions
      const { data: txs } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("actor_id", actorId)
        .order("created_at", { ascending: false })
        .limit(50);

      // Payment attempts
      const { data: attempts } = await supabase
        .from("billing_payment_attempts")
        .select("id, provider, purpose, status, expected_amount_cents, currency, credits_amount, plan_id, provider_reference, created_at")
        .eq("actor_id", actorId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Usage records (30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: usage } = await supabase
        .from("billing_usage_records")
        .select("product_id, quantity, credits_charged")
        .eq("actor_id", actorId)
        .is("reversed_at", null)
        .gte("occurred_at", thirtyDaysAgo);

      // Today's usage records
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayUsage } = await supabase
        .from("billing_usage_records")
        .select("product_id, quantity, credits_charged")
        .eq("actor_id", actorId)
        .is("reversed_at", null)
        .gte("occurred_at", todayStart.toISOString());

      // Auto top-up settings
      const { data: actor } = await supabase
        .from("actors")
        .select("auto_topup_enabled, auto_topup_threshold, auto_topup_amount")
        .eq("id", actorId)
        .single();

      // Payment methods
      const { data: methodsData } = await supabase.functions.invoke("stripe-billing", {
        body: { action: "list_payment_methods", actorId },
      });

      setData({
        portfolios: sites || [],
        subscriptions: subMap,
        transactions: txs || [],
        paymentAttempts: attempts || [],
        usageRecords: usage || [],
        todayUsageRecords: todayUsage || [],
        paymentMethods: methodsData?.paymentMethods || [],
        autoTopUpSettings: {
          enabled: actor?.auto_topup_enabled || false,
          threshold: actor?.auto_topup_threshold || 50,
          amount: actor?.auto_topup_amount || 20,
        },
      });
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  }, [actorId]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  return {
    loading,
    data,
    refetch: fetchBillingData,
  };
};
