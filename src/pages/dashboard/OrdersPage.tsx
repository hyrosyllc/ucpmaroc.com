import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { useOutletContext } from "react-router-dom";
import { ActorDashboardContextType } from "../../layouts/ActorDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Package,
  Phone,
  ShoppingBag,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  Search,
  Download,
  RotateCcw,
  PlayCircle,
  X as CloseIcon,
  Trash2,
  Mail,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SiteFilter from "../../components/dashboard/SiteFilter";
import { cn } from "@/lib/utils";

// --- UNIVERSAL STATUS MAP ---
const STATUS_MAP = {
  pending: {
    label: "Pending",
    icon: Clock,
    color:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  in_progress: {
    label: "In Progress",
    icon: PlayCircle,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  refunded: {
    label: "Refunded",
    icon: RotateCcw,
    color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
  },
};

type OrderStatus = keyof typeof STATUS_MAP;

interface ProOrder {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  product_name: string;
  product_price: string;
  quantity: number;
  variants: Record<string, any>;
  status: OrderStatus;
  notes: string | null;
  portfolio_id?: string;
  items?: any[];
}

const OrdersPage = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();
  const [allOrders, setAllOrders] = useState<ProOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  // Bulk Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set()
  );
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Sheet State
  const [selectedOrder, setSelectedOrder] = useState<ProOrder | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    if (!actorData.id) return;
    setLoading(true);

    const { data: mySites } = await supabase
      .from("portfolios")
      .select("id, site_name")
      .eq("actor_id", actorData.id);
    if (mySites) setSites(mySites);

    const { data, error } = await supabase
      .from("pro_orders")
      .select("*")
      .eq("actor_id", actorData.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const normalizedData = data.map((o: any) => ({
        ...o,
        status: o.status === "processing" ? "in_progress" : o.status,
      }));
      setAllOrders(normalizedData);
    }
    setLoading(false);
    setSelectedOrderIds(new Set());
  };

  useEffect(() => {
    fetchData();
  }, [actorData.id]);

  // --- FILTERING LOGIC ---
  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      if (selectedSiteId !== "all" && order.portfolio_id !== selectedSiteId)
        return false;
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const shortId = order.id.substring(0, 6).toLowerCase();
        if (
          !order.customer_name?.toLowerCase().includes(q) &&
          !order.customer_phone?.toLowerCase().includes(q) &&
          !shortId.includes(q) &&
          !order.product_name?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allOrders, selectedSiteId, statusFilter, searchQuery]);

  // --- METRICS CALCULATION ---
  const metrics = useMemo(() => {
    let revenue = 0;
    let pending = 0;
    allOrders.forEach((order) => {
      if (order.portfolio_id !== selectedSiteId && selectedSiteId !== "all")
        return;
      if (order.status === "pending") pending++;
      if (order.status !== "cancelled" && order.status !== "refunded") {
        const amount = parseFloat(
          order.product_price?.replace(/[^0-9.]/g, "") || "0"
        );
        revenue += isNaN(amount) ? 0 : amount;
      }
    });
    return { revenue, total: allOrders.length, pending };
  }, [allOrders, selectedSiteId]);

  // --- ACTIONS ---
  const handleRowClick = (order: ProOrder) => {
    if (selectedOrderIds.size > 0) {
      toggleOrderSelection(order.id);
      return;
    }
    setSelectedOrder(order);
    setInternalNotes(order.notes || "");
    setIsSheetOpen(true);
  };

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const updater = (prev: ProOrder[]) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
    setAllOrders(updater);

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
    await supabase
      .from("pro_orders")
      .update({ status: newStatus })
      .eq("id", orderId);
  };

  const handleBulkUpdateStatus = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.size === 0) return;
    setIsBulkUpdating(true);
    const idsToUpdate = Array.from(selectedOrderIds);

    setAllOrders((prev) =>
      prev.map((o) =>
        idsToUpdate.includes(o.id) ? { ...o, status: newStatus } : o
      )
    );
    await supabase
      .from("pro_orders")
      .update({ status: newStatus })
      .in("id", idsToUpdate);
    setIsBulkUpdating(false);
    setSelectedOrderIds(new Set());
  };

  // 🚀 BULK DELETE LOGIC
  const handleBulkDelete = async () => {
    if (selectedOrderIds.size === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedOrderIds.size} orders? This cannot be undone.`
      )
    )
      return;

    setIsBulkUpdating(true);
    const idsToDelete = Array.from(selectedOrderIds);

    const { error } = await supabase
      .from("pro_orders")
      .delete()
      .in("id", idsToDelete);
    if (!error) {
      setAllOrders((prev) => prev.filter((o) => !idsToDelete.includes(o.id)));
      setSelectedOrderIds(new Set());
    } else {
      alert("Failed to delete orders.");
    }
    setIsBulkUpdating(false);
  };

  const toggleOrderSelection = (id: string) => {
    const next = new Set(selectedOrderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrderIds(next);
  };

  const toggleAllSelection = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const saveNotes = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("pro_orders")
      .update({ notes: internalNotes })
      .eq("id", selectedOrder.id);
    if (!error) {
      setAllOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, notes: internalNotes } : o
        )
      );
    }
    setIsSaving(false);
  };

  const getSiteName = (id?: string) => {
    if (!id) return "Unknown Site";
    return sites.find((s) => s.id === id)?.site_name || "Portfolio";
  };

  // --- HELPERS FOR PARSING & EXTRACTION ---
  const formatOrderId = (id: string) =>
    `#ORD-${id.substring(0, 6).toUpperCase()}`;

  const parseVariants = (variants: Record<string, any>, items?: any[]) => {
    if (items && items.length > 0) {
      return items.map((item: any) => `${item.quantity}x ${item.title}${item.variant && item.variant !== 'default' ? ` (${item.variant})` : ''}`).join(' • ');
    }
    if (!variants || Object.keys(variants).length === 0) return null;
    return Object.entries(variants)
      .map(([key, val]) => `${key}: ${val?.label || val}`)
      .join(" • ");
  };

  const parseFormNotes = (notes: string | null) => {
    if (!notes) return [];
    return notes
      .split("\n")
      .filter((line) => line.includes(":") && !line.trim().startsWith("Cart Items:") && !line.trim().startsWith("Form Details:"))
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return { key: key.trim(), value: rest.join(":").trim() };
      });
  };

  // 🚀 INTELLIGENT EXTRACTION: Pulls Core info from notes, ignores duplicates
  const extractOrderDetails = (order: ProOrder) => {
    const parsedNotes = parseFormNotes(order.notes);
    const coreExtra: any = {};
    const customData: { key: string; value: string }[] = [];

    // All known core variations to prevent duplication
    const redundantKeys = [
      "checkout_name",
      "name",
      "full name",
      "checkout_email",
      "email",
      "email address",
      "checkout_phone",
      "phone",
      "phone number",
      "checkout_address",
      "address",
      "shipping address",
      "street address",
      "checkout_city",
      "city",
      "checkout_zip",
      "zip",
      "zip code",
      "postal code",
      "zip / postal code",
      "checkout_country",
      "country",
    ];

    parsedNotes.forEach((item) => {
      const k = item.key.toLowerCase();
      if (k === "checkout_email" || k === "email" || k === "email address")
        coreExtra.email = item.value;
      else if (k === "checkout_city" || k === "city")
        coreExtra.city = item.value;
      else if (
        k === "checkout_zip" ||
        k === "zip" ||
        k === "zip code" ||
        k === "zip / postal code"
      )
        coreExtra.zip = item.value;
      else if (k === "checkout_country" || k === "country")
        coreExtra.country = item.value;
      else if (!redundantKeys.includes(k) && !k.startsWith("field_")) {
        customData.push(item);
      }
    });

    return { coreExtra, customData };
  };

  // 🚀 CSV EXPORT (Zero Duplicates, Flawless Formatting)
  const exportToCSV = () => {
    if (filteredOrders.length === 0) return;

    const allExtracted = filteredOrders.map((o) => ({
      order: o,
      ...extractOrderDetails(o),
    }));

    // Dynamically find all unique custom keys to generate column headers
    const customKeys = new Set<string>();
    allExtracted.forEach((item) =>
      item.customData.forEach((c) => customKeys.add(c.key))
    );
    const customHeaders = Array.from(customKeys);

    const headers = [
      "Order ID",
      "Date",
      "Status",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Shipping Address",
      "City",
      "Zip",
      "Country",
      "Product",
      "Variants",
      "Quantity",
      "Total",
      ...customHeaders,
    ];

    const csvContent = [
      headers.join(","),
      ...allExtracted.map(({ order: o, coreExtra, customData }) => {
        const customMap = new Map(customData.map((c) => [c.key, c.value]));
        const customValues = customHeaders.map(
          (key) => `"${(customMap.get(key) || "").replace(/"/g, '""')}"`
        );

        return [
          formatOrderId(o.id),
          new Date(o.created_at).toLocaleDateString(),
          o.status,
          `"${(o.customer_name || "").replace(/"/g, '""')}"`,
          `"${(coreExtra.email || "").replace(/"/g, '""')}"`,
          `"${(o.customer_phone || "").replace(/"/g, '""')}"`,
          `"${(o.customer_address || "").replace(/"/g, '""')}"`,
          `"${(coreExtra.city || "").replace(/"/g, '""')}"`,
          `"${(coreExtra.zip || "").replace(/"/g, '""')}"`,
          `"${(coreExtra.country || "").replace(/"/g, '""')}"`,
          `"${(o.product_name || "").replace(/"/g, '""')}"`,
          `"${(parseVariants(o.variants, o.items) || "").replace(/"/g, '""')}"`,
          o.quantity,
          `"${(o.product_price || "").replace(/"/g, '""')}"`,
          ...customValues,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    );
  }

  // Pre-calculate details for Sheet
  const selectedOrderDetails = selectedOrder
    ? extractOrderDetails(selectedOrder)
    : null;

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-7xl mx-auto bg-muted/20 min-h-screen rounded-3xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Direct Orders
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Manage and fulfill your shop sales.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SiteFilter
            sites={sites}
            selectedSiteId={selectedSiteId}
            onChange={setSelectedSiteId}
          />
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="h-10 rounded-xl bg-background shadow-sm border-border"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button
            variant="default"
            onClick={fetchData}
            className="h-10 rounded-xl shadow-sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 🚀 METRICS DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-border shadow-sm bg-background overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Gross Volume
            </CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              $
              {metrics.revenue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Excluding cancelled/refunded
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm bg-background overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Total Orders
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              {metrics.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              All time orders
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border shadow-sm bg-background overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Action Needed
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              {metrics.pending}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Pending fulfillment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 🚀 UPGRADED SEARCH & FILTER BAR */}
      <div className="flex flex-col lg:flex-row justify-between gap-2 lg:gap-4 items-start lg:items-center bg-background p-2 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, names, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 border-none shadow-none focus-visible:ring-0 bg-transparent text-sm"
          />
        </div>

        <div className="h-px w-full bg-border lg:hidden" />

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto px-2 py-1 scrollbar-none snap-x">
          <Button
            variant={statusFilter === "all" ? "default" : "ghost"}
            className={cn(
              "rounded-full h-8 text-xs snap-start px-4",
              statusFilter !== "all" && "text-muted-foreground"
            )}
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          {Object.entries(STATUS_MAP).map(([key, info]) => {
            const count = allOrders.filter((o) => o.status === key).length;
            return (
              <Button
                key={key}
                variant={statusFilter === key ? "secondary" : "ghost"}
                className={cn(
                  "rounded-full h-8 text-xs snap-start gap-1.5 whitespace-nowrap",
                  statusFilter !== key &&
                    "text-muted-foreground hover:bg-muted/50"
                )}
                onClick={() => setStatusFilter(key as OrderStatus)}
              >
                <info.icon className="w-3 h-3" /> {info.label}
                <span
                  className={cn(
                    "ml-1 opacity-60 text-[10px]",
                    statusFilter === key && "font-bold"
                  )}
                >
                  ({count})
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* 🚀 BULK ACTIONS FLOATING BAR */}
      {selectedOrderIds.size > 0 && (
        <div className="bg-foreground text-background px-6 py-4 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-4 fade-in shadow-2xl sticky bottom-6 z-50 transition-all duration-300 border border-border">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedOrderIds(new Set())}
              className="h-8 w-8 text-background/60 hover:text-background hover:bg-background/20 rounded-full"
            >
              <CloseIcon className="w-4 h-4" />
            </Button>
            <div className="font-bold text-sm">
              {selectedOrderIds.size} order
              {selectedOrderIds.size > 1 ? "s" : ""} selected
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs opacity-80 hidden sm:inline-block font-medium">
              Update status to:
            </span>
            <Select
              onValueChange={(val: OrderStatus) => handleBulkUpdateStatus(val)}
            >
              <SelectTrigger className="h-9 w-[130px] sm:w-[150px] bg-background/10 border-background/20 text-background focus:ring-0 font-semibold rounded-lg">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="z-[100000] rounded-xl shadow-2xl">
                {Object.entries(STATUS_MAP).map(([key, info]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className="font-medium cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <info.icon className="w-4 h-4 opacity-50" /> {info.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-9 px-3 rounded-lg flex items-center gap-1.5 ml-1"
            >
              <Trash2 className="w-4 h-4" />{" "}
              <span className="hidden sm:inline-block">Delete</span>
            </Button>
            {isBulkUpdating && (
              <Loader2 className="w-4 h-4 animate-spin ml-2 text-background/50" />
            )}
          </div>
        </div>
      )}

      {/* MAIN TABLE */}
      <Card className="rounded-2xl border-border shadow-sm bg-background overflow-hidden">
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-muted/20">
              <div className="bg-background p-6 rounded-full mb-4 shadow-sm border border-border">
                <Search className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <p className="font-semibold text-lg text-foreground">
                No orders found.
              </p>
              <p className="text-sm mt-1 opacity-70">
                Try adjusting your filters or search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-12 pl-6">
                      <Checkbox
                        checked={
                          selectedOrderIds.size === filteredOrders.length &&
                          filteredOrders.length > 0
                        }
                        onCheckedChange={toggleAllSelection}
                      />
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                      Order
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                      Customer
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                      Product
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                      Total
                    </TableHead>
                    <TableHead className="py-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const variantsStr = parseVariants(order.variants, order.items);
                    const StatusIcon = STATUS_MAP[order.status]?.icon || Clock;
                    const isSelected = selectedOrderIds.has(order.id);

                    return (
                      <TableRow // eslint-disable-line
                        key={order.id}
                        className={cn(
                          "cursor-pointer transition-colors border-b border-border/50 group",
                          isSelected
                            ? "bg-primary/5 hover:bg-primary/10"
                            : "hover:bg-muted/30"
                        )}
                        onClick={() => handleRowClick(order)}
                      >
                        <TableCell
                          className="w-12 pl-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleOrderSelection(order.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="py-4 align-top">
                          <div className="font-mono font-bold text-foreground">
                            {formatOrderId(order.id)}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium mt-1">
                            {new Date(order.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {(order.customer_name || "G")[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                                {order.customer_name || "Guest Checkout"}
                              </div>
                              <div className="text-sm text-muted-foreground font-medium">
                                {order.customer_phone || "No phone"}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <div className="font-bold text-foreground flex items-center gap-2">
                            {/* --- IMPROVEMENT: Show quantity only for single-item orders --- */}
                            {order.items && order.items.length === 1 ? (
                              <span className="text-muted-foreground font-mono bg-muted px-1.5 rounded">{order.items[0].quantity}x</span>
                            ) : !order.items || order.items.length <= 1 ? (
                              <span className="text-muted-foreground font-mono bg-muted px-1.5 rounded">
                                {order.quantity}x
                              </span>
                            ) : null}
                            {order.product_name}
                          </div>
                          {variantsStr && (
                            <div className="text-xs text-muted-foreground mt-2 font-medium bg-muted inline-block px-2 py-0.5 rounded-md">
                              {variantsStr}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <div className="font-bold text-foreground font-mono px-2 py-1 rounded-md inline-block">
                            {/* --- IMPROVEMENT: Read from amount_cents if available --- */}
                            {order.amount_cents
                              ? `$${(order.amount_cents / 100).toFixed(2)}`
                              : order.product_price}
                          </div>
                        </TableCell>

                        <TableCell className="py-4 align-top">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-bold px-3 py-1 shadow-sm",
                              STATUS_MAP[order.status]?.color
                            )}
                          >
                            <StatusIcon className="w-3 h-3 mr-1.5" />{" "}
                            {STATUS_MAP[order.status]?.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 🚀 THE AAA+ ORDER SHEET */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-l border-border bg-background shadow-2xl">
          {selectedOrder && selectedOrderDetails && (
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="p-6 md:p-8 bg-muted/20 border-b border-border space-y-4 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge
                      variant="secondary"
                      className="bg-background text-muted-foreground border border-border font-bold mb-2 shadow-sm"
                    >
                      {getSiteName(selectedOrder.portfolio_id)}
                    </Badge>
                    <SheetTitle className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                      {formatOrderId(selectedOrder.id)}
                    </SheetTitle>
                    <div className="text-sm text-muted-foreground font-medium mt-1">
                      {new Date(selectedOrder.created_at).toLocaleString(
                        "en-US",
                        { dateStyle: "long", timeStyle: "short" }
                      )}
                    </div>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-bold px-3 py-1 text-sm shadow-sm bg-background",
                        STATUS_MAP[selectedOrder.status]?.color
                      )}
                    >
                      {React.createElement(
                        STATUS_MAP[selectedOrder.status]?.icon || Clock,
                        { className: "w-3 h-3 mr-1" }
                      )}
                      {STATUS_MAP[selectedOrder.status]?.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Sheet Body (Scrollable) */}
              <div className="p-6 md:p-8 space-y-6 flex-grow overflow-y-auto">
                {/* 1. Order Summary */}
                <div className="bg-background p-5 rounded-2xl border border-border shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                    <ShoppingBag size={14} /> Order Summary
                  </h4>

                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-4">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start justify-between gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                          <div className="flex gap-3 items-start">
                            {item.image ? (
                              <div className="w-12 h-12 rounded-lg border bg-muted overflow-hidden shrink-0">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg border bg-muted flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-muted-foreground opacity-50" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-foreground leading-tight">
                                {item.title}
                              </div>
                              <div className="text-muted-foreground font-medium mt-0.5 text-xs">
                                Qty: {item.quantity}
                              </div>
                              {item.variant && item.variant !== "default" && (
                                <div className="text-muted-foreground font-medium mt-1 text-[10px] flex items-center gap-1 bg-muted w-max px-2 py-0.5 rounded-md">
                                  <Tag size={10} /> {item.variant}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-black font-mono text-foreground mt-0.5">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-between items-center">
                        <span className="font-bold text-muted-foreground text-sm uppercase tracking-widest">Total</span>
                        <div className="text-xl font-black font-mono text-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
                          {selectedOrder.amount_cents ? `$${(selectedOrder.amount_cents / 100).toFixed(2)}` : selectedOrder.product_price}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-bold text-foreground text-lg">
                          {selectedOrder.product_name}
                        </div>
                        <div className="text-muted-foreground font-medium mt-1 text-sm">
                          Qty: {selectedOrder.quantity}
                        </div>
                        {parseVariants(selectedOrder.variants, selectedOrder.items) && (
                          <div className="text-muted-foreground font-medium mt-2 text-sm flex items-center gap-1.5 bg-muted w-max px-2 py-1 rounded-md">
                            <Tag size={12} />{" "}
                            {parseVariants(selectedOrder.variants, selectedOrder.items)}
                          </div>
                        )}
                      </div>
                      <div className="text-xl font-black font-mono text-foreground bg-muted px-3 py-1.5 rounded-lg border border-border">
                        {selectedOrder.product_price}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Customer Information (Now completely handles Email, City, Zip, Country!) */}
                <div className="bg-background p-5 rounded-2xl border border-border shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                    <User size={14} /> Customer
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {(selectedOrder.customer_name || "G")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-base">
                          {selectedOrder.customer_name || "Guest Checkout"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border">
                      {selectedOrderDetails.coreExtra.email && (
                        <div className="flex items-start gap-3">
                          <Mail
                            size={16}
                            className="text-muted-foreground mt-0.5"
                          />
                          <div>
                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              Email
                            </div>
                            <div className="font-medium text-foreground mt-0.5">
                              {selectedOrderDetails.coreExtra.email}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Phone
                          size={16}
                          className="text-muted-foreground mt-0.5"
                        />
                        <div>
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Phone
                          </div>
                          <div className="font-medium text-foreground mt-0.5">
                            {selectedOrder.customer_phone || "Not provided"}
                          </div>
                        </div>
                      </div>

                      {selectedOrder.customer_address &&
                        selectedOrder.customer_address !==
                          "No Address Provided" && (
                          <div className="flex items-start gap-3">
                            <MapPin
                              size={16}
                              className="text-muted-foreground mt-0.5"
                            />
                            <div>
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Address / Shipping
                              </div>
                              <div className="font-medium text-foreground mt-0.5 leading-relaxed">
                                {selectedOrder.customer_address}
                                {(selectedOrderDetails.coreExtra.city ||
                                  selectedOrderDetails.coreExtra.zip ||
                                  selectedOrderDetails.coreExtra.country) && (
                                  <div className="text-muted-foreground text-sm mt-1">
                                    {[
                                      selectedOrderDetails.coreExtra.city,
                                      selectedOrderDetails.coreExtra.zip,
                                      selectedOrderDetails.coreExtra.country,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* 3. Form Responses (Stripped of duplicated core fields) */}
                {selectedOrderDetails.customData.length > 0 && (
                  <div className="bg-background p-5 rounded-2xl border border-border shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-4">
                      <FileText size={14} /> Custom Form Data
                    </h4>
                    <div className="space-y-4">
                      {selectedOrderDetails.customData.map(
                        (item: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-muted/50 p-4 rounded-xl border border-border"
                          >
                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                              {item.key}
                            </div>
                            <div className="font-medium text-foreground whitespace-pre-wrap">
                              {item.value || "—"}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Internal Actions (Status & Notes) */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp size={14} /> Fulfillment Tracking
                  </h4>

                  <div className="space-y-2">
                    <Label className="font-bold text-foreground">
                      Update Order Status
                    </Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(val: OrderStatus) =>
                        updateStatus(selectedOrder.id, val)
                      }
                    >
                      <SelectTrigger className="h-12 bg-background border-border rounded-xl font-medium focus:ring-primary shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl z-[100000]">
                        {Object.entries(STATUS_MAP).map(([key, info]) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="font-medium cursor-pointer py-3"
                          >
                            <div className="flex items-center gap-2">
                              <info.icon className="w-4 h-4 opacity-50" />{" "}
                              {info.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="font-bold text-foreground">
                      Private Internal Notes
                    </Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Add tracking links, internal references, or private notes here..."
                      className="min-h-[100px] bg-background border-border rounded-xl resize-none focus:ring-primary shadow-sm"
                    />
                    <Button
                      onClick={saveNotes}
                      disabled={
                        isSaving || internalNotes === selectedOrder.notes
                      }
                      className="w-full h-12 rounded-xl font-bold mt-2 shadow-sm"
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                      ) : (
                        "Save Notes"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default OrdersPage;
