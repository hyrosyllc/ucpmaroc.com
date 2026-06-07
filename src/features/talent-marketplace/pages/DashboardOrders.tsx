import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/supabaseClient";
import { useOutletContext, Link } from "react-router-dom";
import { OrderDetailsModal } from '@/features/talent-marketplace';
import { ActorDashboardContextType } from "@/layouts/ActorDashboardLayout";
import emailjs from "@emailjs/browser";

// --- shadcn/ui Imports ---
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ---

// --- ENHANCEMENT: Import new icons ---
import { Mic, PencilLine, Video, Inbox, Package } from "lucide-react";

// --- Interface (Unchanged) ---
interface Order {
  actor_id: any;
  id: string;
  order_id_string: string;
  client_name: string;
  client_email: string;
  status: string;
  script: string;
  final_audio_url?: string;
  actors: {
    ActorName: string;
    ActorEmail?: string;
  };
  service_type: "voice_over" | "scriptwriting" | "video_editing";
  total_price: number | null;
  deliveries: {
    id: string;
    created_at: string;
    file_url: string;
    version_number: number;
  }[];
  last_message_content: string | null;
  last_message_timestamp: string | null;
  actor_has_unread_messages: boolean;
  client_has_unread_messages: boolean;
  from_chat_offer: boolean;
  material_file_urls: string[] | null; // <-- ADD THIS
  last_message_sender_role: "client" | "actor" | null;
  project_notes: string | null; // <-- ADD THIS
}

// --- ENHANCEMENT: Helper map for service icons ---
const serviceIcons = {
  voice_over: <Mic className="h-5 w-5" />,
  scriptwriting: <PencilLine className="h-5 w-5" />,
  video_editing: <Video className="h-5 w-5" />,
};

const DashboardOrders: React.FC = () => {
  const { actorData } = useOutletContext<ActorDashboardContextType>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [activeOrderTab, setActiveOrderTab] = useState<
    "quotes" | "active" | "completed"
  >("quotes");

  const fetchOrders = useCallback(async () => {
    if (!actorData.id) return;
    setLoading(true);

    const { data: orderData } = await supabase
      .from("orders")
      .select("*, actors(ActorName, ActorEmail), deliveries(*)")
      .eq("actor_id", actorData.id)
      .order("created_at", { ascending: false });

    if (orderData) {
      const sortedOrderData = orderData.map((order) => ({
        ...order,
        deliveries: order.deliveries.sort(
          (
            a: { created_at: string | number | Date },
            b: { created_at: string | number | Date }
          ) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));

      setOrders(sortedOrderData as Order[]);
    }
    setLoading(false);
  }, [actorData.id]); // <-- Add selectedOrder as a dependency

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // --- NEW: Realtime Subscription ---

  // ... after your existing useEffect ...

  useEffect(() => {
    // 1. Only subscribe if we have an actor ID
    if (!actorData.id) return; // 2. Create a channel to listen for changes

    const channel = supabase
      .channel(`public:orders:actor_id=eq.${actorData.id}`) // A unique name for this channel
      .on(
        "postgres_changes", // Listen for any database change
        {
          event: "INSERT", // Specifically for new orders/quotes
          schema: "public",
          table: "orders",
          filter: `actor_id=eq.${actorData.id}`, // **IMPORTANT: Only listen for orders for THIS actor**
        },
        (payload) => {
          console.log("New order received!", payload); // Set a message and refresh the list
          setMessage("A new order or quote request has arrived!");
          fetchOrders();
        }
      )
      .subscribe(); // 3. The cleanup function: Unsubscribe when the component unmounts

    return () => {
      supabase.removeChannel(channel);
    };
  }, [actorData.id, fetchOrders, setMessage]); // Re-run if actor or fetch function changes

  // 1. CREATE THE FUNCTION that does the actual work
  const handleActorConfirmPayment = async (
    orderId: string,
    clientEmail: string,
    clientName: string,
    orderIdString: string
  ) => {
    // This is the logic that was missing

    // 1. Update the order status in Supabase
    const { error } = await supabase
      .from("orders")
      .update({ status: "In Progress" })
      .eq("id", orderId)
      .select() // <-- ADD .select()
      .single(); // <-- ADD .single()

    if (error) {
      console.error("Failed to update order status:", error);
      throw new Error(error.message);
    }

    // 2. Send notification email to Client
    const emailParams = {
      clientName: clientName,
      clientEmail: clientEmail,
      orderIdString: orderIdString,
    };

    // Use your "Actor Confirmed" email template
    //await emailjs.send('service_r3pvt1s', 'YOUR_ACTOR_CONFIRMED_TEMPLATE_ID', emailParams, 'I51tDIHsXYKncMQpO');

    await fetchOrders();

    // 4. Manually update the selectedOrder state
    setSelectedOrder((prev) =>
      prev ? { ...prev, status: "In Progress" } : null
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (activeOrderTab === "quotes") {
      return order.status === "awaiting_offer";
    }
    if (activeOrderTab === "active") {
      return !["Completed", "Cancelled", "awaiting_offer"].includes(
        order.status
      );
    }
    return order.status === "Completed";
  });

  // --- ENHANCEMENT: Helper component for the "Empty" state ---
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
      <Inbox className="h-16 w-16 mb-4" />
      <h3 className="text-lg font-semibold text-foreground">
        No {activeOrderTab} orders
      </h3>
      <p className="text-sm">
        {activeOrderTab === "quotes" &&
          "When a client requests a quote, it will appear here."}
        {activeOrderTab === "active" &&
          "When a client accepts an offer, the order will move here."}
        {activeOrderTab === "completed" &&
          "After you deliver and get paid, orders will live here."}
      </p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-8xl mx-auto ">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Orders</h1>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-card border rounded-lg text-center text-sm">
          {message}
        </div>
      )}

      <Card>
        <CardContent className="p-0 sm:p-6">
          <Tabs
            value={activeOrderTab}
            onValueChange={(value) =>
              setActiveOrderTab(value as "quotes" | "active" | "completed")
            }
          >
            <TabsList className="grid w-full grid-cols-3 rounded-none sm:rounded-lg border-b sm:border-0">
              <TabsTrigger value="quotes">
                Quotes
                {orders.filter((o) => o.status === "awaiting_offer").length >
                  0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {orders.filter((o) => o.status === "awaiting_offer").length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4 mt-6 p-6 sm:p-0">
            {loading ? (
              <p className="text-muted-foreground text-center py-4">
                Loading orders...
              </p>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                // --- ENHANCEMENT: Replaced Button with a clickable Card ---
                <Card
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 transition-all hover:shadow-md hover:bg-accent cursor-pointer ${
                    order.status === "awaiting_offer"
                      ? "border-l-4 border-primary"
                      : order.status === "Awaiting Actor Confirmation"
                      ? "border-l-4 border-green-500"
                      : "border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    {/* --- Left Side: Order Info --- */}
                    <div className="flex items-center gap-4">
                      <span className="p-3 bg-muted rounded-full text-muted-foreground hidden sm:flex">
                        {/* --- ENHANCEMENT: Show service icon --- */}
                        {serviceIcons[order.service_type] || (
                          <Package className="h-5 w-5" />
                        )}
                      </span>
                      <div className="flex-grow">
                        <p className="font-bold text-base text-foreground">
                          {order.service_type === "voice_over"
                            ? `Order #${order.order_id_string}`
                            : `Quote #${order.order_id_string}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Client: {order.client_name}
                        </p>
                      </div>
                    </div>

                    {/* --- Right Side: Status & Price --- */}
                    <div className="flex flex-row-reverse sm:flex-col items-center sm:items-end justify-between mt-4 sm:mt-0">
                      <span
                        className={`flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full ${
                          order.status === "Completed"
                            ? "bg-green-500/20 text-green-300"
                            : order.status === "Awaiting Actor Confirmation"
                            ? "bg-green-500/20 text-green-300 animate-pulse"
                            : order.status === "awaiting_offer"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : order.status === "offer_made"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {order.status === "awaiting_offer"
                          ? "Awaiting Offer"
                          : order.status}
                      </span>
                      {/* --- ENHANCEMENT: Show price --- */}
                      {order.total_price &&
                        order.status !== "awaiting_offer" && (
                          <p className="text-sm font-semibold text-foreground mt-0 sm:mt-1.5">
                            {order.total_price} MAD
                          </p>
                        )}
                    </div>
                  </div>
                </Card>
                // --- END ENHANCEMENT ---
              ))
            ) : (
              // --- ENHANCEMENT: Use new EmptyState component ---
              <EmptyState />
            )}
          </div>
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={fetchOrders}
          onActorConfirmPayment={handleActorConfirmPayment}
        />
      )}
    </div>
  );
};

export default DashboardOrders;
