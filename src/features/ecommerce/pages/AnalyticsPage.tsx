import React, { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout"; "@/features/talent-marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Eye,
  MousePointerClick,
  TrendingUp,
  Users,
  ShoppingBag,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import SiteFilter from "@/components/dashboard/SiteFilter";

// Simple Badge Helper
const Badge = ({ children, variant, className }: any) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted ${className}`}
  >
    {children}
  </span>
);
const MessageCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-green-500"
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

const AnalyticsPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [loading, setLoading] = useState(true);

  // Filter State
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");

  // Raw Data (Fetched Once)
  const [allEvents, setAllEvents] = useState<any[]>([]);

  // Computed Stats (Derived from Filter)
  const [stats, setStats] = useState({
    totalViews: 0,
    totalClicks: 0,
    viewsTrend: [] as any[],
    recentEvents: [] as any[],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!actorData.id) return;
      setLoading(true);

      // 1. Fetch Sites for Filter
      const { data: mySites } = await supabase
        .from("portfolios")
        .select("id, site_name")
        .eq("actor_id", actorData.id);
      if (mySites) setSites(mySites);

      // 2. Fetch ALL Analytics Events (Last 30 days)
      // We fetch all and filter locally for speed and flexibility
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: events } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("actor_id", actorData.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (events) {
        setAllEvents(events);
      }
      setLoading(false);
    };

    fetchData();
  }, [actorData.id]);

  // Recalculate when Filter or Data changes
  useEffect(() => {
    if (loading) return;

    // 1. Filter Events
    const filtered =
      selectedSiteId === "all"
        ? allEvents
        : allEvents.filter((e) => e.portfolio_id === selectedSiteId);

    // 2. Compute KPI Totals
    const views = filtered.filter((e) => e.event_type === "page_view");
    const clicks = filtered.filter((e) => e.event_type !== "page_view");

    // 3. Compute Chart Data (Group by Date)
    const dailyMap = new Map<string, number>();

    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().split("T")[0], 0);
    }

    views.forEach((v) => {
      const dateKey = v.created_at.split("T")[0];
      if (dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1);
      }
    });

    const trendData = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      view_count: count,
    }));

    // 4. Update State
    setStats({
      totalViews: views.length,
      totalClicks: clicks.length,
      viewsTrend: trendData,
      recentEvents: clicks.slice(0, 10), // Show last 10 interactions
    });
  }, [selectedSiteId, allEvents, loading]);

  if (loading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-8xl mx-auto ">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            Track your portfolio performance and shop engagement.
          </p>
        </div>
        <SiteFilter
          sites={sites}
          selectedSiteId={selectedSiteId}
          onChange={setSelectedSiteId}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">Last 30 Days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Clicks on Shop/Links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conv. Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalViews > 0
                ? ((stats.totalClicks / stats.totalViews) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Page View to Click</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {stats.viewsTrend.some((d) => d.view_count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.viewsTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#333"
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) =>
                      new Date(val).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                      })
                    }
                    stroke="#888888"
                    fontSize={12}
                    minTickGap={30}
                  />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    labelFormatter={(val) =>
                      new Date(val).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    }
                  />
                  <Bar
                    dataKey="view_count"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                No traffic data yet. Share your link!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.recentEvents.length > 0 ? (
                stats.recentEvents.map((event, i) => (
                  <div key={event.id || i} className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full mt-1">
                      {event.event_type.includes("whatsapp") ? (
                        <MessageCircleIcon />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {event.event_type === "whatsapp_click"
                          ? "Started WhatsApp Order"
                          : "Clicked Product Link"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString()} at{" "}
                        {new Date(event.created_at).toLocaleTimeString()}
                      </p>
                      {event.metadata?.product_name && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {event.metadata.product_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent interactions.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
