import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, Printer, MapPin, Mail, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { supabase } from "@/supabaseClient";

const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
];

const PublicThankYouPage = () => {
  const { portfolio } = useOutletContext<{ portfolio: any }>();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearCart();
    
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('pro_orders').select('*').eq('id', orderId).maybeSingle();
      if (data && !error) setOrder(data);
      setLoading(false);
    };
    
    fetchOrder();
  }, [clearCart, orderId]);

  const isCustomDomain = !MAIN_DOMAINS.some((domain) => window.location.hostname.includes(domain));
  const homeUrl = isCustomDomain ? '/' : `/pro/${portfolio.public_slug}`;
  const shopUrl = isCustomDomain ? '/shop' : `/pro/${portfolio.public_slug}/shop`;

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
     return (
       <div className="flex items-center justify-center min-h-[40vh]">
         <Loader2 className="animate-spin text-primary w-8 h-8" />
       </div>
     );
  }

  const extractDetails = () => {
    const coreExtra: any = {};
    const customData: { key: string; value: string }[] = [];
    
    if (!order?.notes) return { coreExtra, customData };

    const redundantKeys = [
      "checkout_name", "name", "full name", 
      "checkout_email", "email", "email address", 
      "checkout_phone", "phone", "phone number", 
      "checkout_address", "address", "shipping address", "street address", 
      "checkout_city", "city", 
      "checkout_zip", "zip", "zip code", "postal code", "zip / postal code", 
      "checkout_country", "country", "payment intent"
    ];

    const lines = order.notes.split('\n')
      .filter((line: string) => line.includes(':') && !line.trim().startsWith('Cart Items:') && !line.trim().startsWith('Form Details:'));
      
    lines.forEach((line: string) => {
      const [key, ...rest] = line.split(':');
      const k = key.trim().toLowerCase();
      const v = rest.join(':').trim();
      
      if (k === "checkout_email" || k === "email" || k === "email address") coreExtra.email = v;
      else if (k === "checkout_city" || k === "city") coreExtra.city = v;
      else if (k === "checkout_zip" || k === "zip" || k === "zip code" || k === "zip / postal code") coreExtra.zip = v;
      else if (k === "checkout_country" || k === "country") coreExtra.country = v;
      else if (k === "checkout_address" || k === "street address" || (k === "address" && !k.includes("email"))) coreExtra.address = v;
      else if (!redundantKeys.includes(k) && !k.startsWith("field_")) {
        customData.push({ key: key.trim(), value: v });
      }
    });

    return { coreExtra, customData };
  };

  const { coreExtra, customData } = extractDetails();

  // Fallback handlers for legacy bugs
  const displayEmail = coreExtra.email || (order?.customer_address?.includes('@') ? order.customer_address : 'No Email Provided');
  
  const formatAddress = () => {
     const parts = [];
     if (order?.customer_address && order.customer_address !== "No Address Provided" && !order.customer_address.includes('@')) {
         parts.push(order.customer_address);
     } else if (coreExtra.address) {
         parts.push(coreExtra.address);
     }
     
     const cityZipCountry = [coreExtra.city, coreExtra.zip, coreExtra.country].filter(Boolean).join(', ');
     if (cityZipCountry) parts.push(cityZipCountry);
     
     return parts.length > 0 ? parts.join(' - ') : null;
  };
  
  const displayAddress = formatAddress();

  return (
    <div className="max-w-3xl mx-auto mt-8 md:mt-12 pt-8 md:pt-12 px-4 md:px-8 text-center space-y-8 animate-in fade-in zoom-in duration-500 print:m-0 print:p-0 print:shadow-none">
      
      <div className="print:hidden">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto ring-1 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
          <CheckCircle2 size={48} className="animate-in zoom-in duration-500 delay-150" />
        </div>
        
        <div className="space-y-3 mt-8">
          <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
            Order Confirmed!
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Thank you for your purchase. A receipt has been sent to your email, and the seller has been notified.
          </p>
        </div>
      </div>

      {order && (
        <div className="bg-card/50 border border-border/40 backdrop-blur-sm rounded-[2rem] p-6 md:p-10 shadow-2xl print:bg-white print:text-black print:border-neutral-200 print:shadow-none text-left relative overflow-hidden mt-12 print:mt-0">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-500 print:hidden" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/40 print:border-neutral-300 pb-6 mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black text-foreground print:text-black tracking-tight">RECEIPT</h2>
              <p className="text-muted-foreground print:text-neutral-500 font-mono mt-1 text-sm">Order #{order.id.split('-')[0].toUpperCase()}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-bold text-foreground print:text-black text-lg">{portfolio.site_name || portfolio.public_slug}</p>
              <p className="text-sm text-muted-foreground print:text-neutral-500">{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground print:text-neutral-400 mb-2">Billed To</h3>
              <p className="font-semibold text-foreground print:text-black">{order.customer_name}</p>
              <p className="text-sm text-muted-foreground print:text-neutral-600 flex items-center gap-2"><Mail size={14}/> {displayEmail}</p>
              {order.customer_phone && order.customer_phone !== "No Phone" && (
                <p className="text-sm text-muted-foreground print:text-neutral-600 flex items-center gap-2"><Phone size={14}/> {order.customer_phone}</p>
              )}
              {displayAddress && (
                <p className="text-sm text-muted-foreground print:text-neutral-600 flex items-start gap-2 mt-2"><MapPin size={14} className="mt-0.5 shrink-0"/> {displayAddress}</p>
              )}
            </div>
            <div className="sm:text-right space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground print:text-neutral-400 mb-2">Payment Info</h3>
              <p className="font-semibold text-foreground print:text-black">
                {order.notes?.includes('Payment Intent:') ? 'Credit Card (Stripe)' : 'Cash on Delivery'}
              </p>
              <p className="text-sm text-muted-foreground print:text-neutral-600 capitalize flex items-center sm:justify-end gap-1.5">
                Status: <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.status === 'paid' ? 'bg-green-500/20 text-green-500 print:text-green-700 print:bg-green-50' : 'bg-amber-500/20 text-amber-500 print:text-amber-700 print:bg-amber-50'}`}>{order.status}</span>
              </p>
            </div>
          </div>

        {customData.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground print:text-neutral-400 mb-4">Additional Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 print:bg-neutral-50 p-4 rounded-2xl border border-border/40 print:border-neutral-200">
              {customData.map((detail: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <p className="text-xs text-muted-foreground print:text-neutral-500">{detail.key}</p>
                  <p className="text-sm font-medium text-foreground print:text-black whitespace-pre-wrap">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground print:text-neutral-400 mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-muted/20 print:bg-neutral-50 p-4 rounded-2xl border border-border/40 print:border-neutral-200">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-bold text-foreground print:text-black leading-tight">{order.product_name}</p>
                    {order.variants && Object.keys(order.variants).length > 0 ? (
                      <div className="mt-1 space-y-0.5">
                        {Object.entries(order.variants).map(([k, v]: any) => (
                          <p key={k} className="text-xs text-muted-foreground print:text-neutral-500">
                            {k.startsWith('Item') ? v : `${k}: ${v.label || v}`}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground print:text-neutral-500 mt-1">
                        Qty: {order.quantity}
                      </p>
                    )}
                  </div>
                </div>
                <p className="font-mono font-bold text-foreground print:text-black whitespace-nowrap ml-4">{order.product_price}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/40 print:border-neutral-300 pt-6 flex justify-between items-end">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground print:text-neutral-400 mb-1">Total Paid</span>
            <span className="text-4xl font-black text-primary print:text-black">{order.product_price}</span>
          </div>
        </div>
      )}

      <div className="p-8 bg-muted/10 border border-border/40 rounded-3xl mt-8 shadow-inner print:hidden">
        <p className="text-sm font-bold text-muted-foreground mb-5 uppercase tracking-widest">What's next?</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            onClick={() => navigate(homeUrl)}
            className="h-14 px-8 font-bold text-base bg-primary text-primary-foreground hover:brightness-110 transition-all hover:scale-[1.02] shadow-lg shadow-primary/25 rounded-xl"
          >
            Return Home
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(shopUrl)}
            className="h-14 px-8 font-bold text-base hover:bg-muted/50 transition-all rounded-xl bg-card border-border/40 shadow-sm"
          >
            <ShoppingBag className="w-5 h-5 mr-2" /> Browse Shop
          </Button>
          {order && (
            <Button
              variant="outline"
              onClick={handlePrint}
              className="h-14 px-8 font-bold text-base hover:bg-muted/50 transition-all rounded-xl bg-card border-dashed border-border/60 shadow-sm"
            >
              <Printer className="w-5 h-5 mr-2 text-muted-foreground" /> Download PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicThankYouPage;