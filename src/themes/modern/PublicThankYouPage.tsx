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

  return (
    <div className="w-full flex flex-col items-center pt-12 pb-16 lg:pt-16 px-4 sm:px-6 font-sans selection:bg-primary/20 selection:text-white animate-in fade-in duration-500 bg-transparent text-white">
      <div className="max-w-2xl w-full">
        
        {/* Success Header */}
        <div className="flex flex-col items-start gap-4 mb-8 print:items-center print:mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500 delay-150" />
          <div className="space-y-1">
            {order && <p className="text-sm text-neutral-400 font-medium tracking-wide uppercase">Order #{order.id.split('-')[0].toUpperCase()}</p>}
            <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
              Thank you{order ? `, ${order.customer_name.split(' ')[0]}` : ''}!
            </h1>
          </div>
        </div>
      {order && (
        <>
          {/* Confirmation Box */}
          <div className="rounded-lg border border-white/10 p-6 mb-6 bg-neutral-900 shadow-sm print:shadow-none">
            <h2 className="text-lg font-medium text-white mb-2">Your order is confirmed</h2>
            <p className="text-sm text-neutral-400">You'll receive a confirmation email with your order details shortly.</p>
          </div>
          {/* Customer Information Box */}
          <div className="rounded-lg border border-white/10 p-6 mb-6 bg-neutral-900 shadow-sm print:shadow-none">
            <h2 className="text-lg font-medium text-white mb-4">Customer information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
               <div>
                 <h3 className="font-medium text-white mb-1">Contact information</h3>
                 {order.customer_name && <p className="text-neutral-400 mb-1">{order.customer_name}</p>}
                 <p className="text-neutral-400">{order.customer_email || order.customer_address}</p>
                 {order.customer_phone && order.customer_phone !== "No Phone" && <p className="text-neutral-400 mt-1">{order.customer_phone}</p>}
               </div>
               <div>
                 <h3 className="font-medium text-white mb-1">Payment method</h3>
                 <p className="text-neutral-400">{order.stripe_payment_intent_id?.startsWith('cod_') ? 'Cash on Delivery' : 'Credit Card (Stripe)'}</p>
               </div>
               {order.customer_address && order.customer_address !== "No Address Provided" && !order.customer_address.includes('@') && (
                 <div className="sm:col-span-2 pt-2 border-t border-white/5">
                   <h3 className="font-medium text-white mb-1">Shipping address</h3>
                   <p className="text-neutral-400">{order.customer_address}</p>
                 </div>
               )}
            </div>
          </div>
          {/* Order Summary Box */}
          <div className="rounded-lg border border-white/10 p-6 mb-8 bg-neutral-900 shadow-sm print:shadow-none">
            <h2 className="text-lg font-medium text-white mb-4">Order summary</h2>
            <div className="space-y-3">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  {item.image && (
                    <div className="relative w-16 h-16 bg-neutral-950 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                      <span className="absolute -top-2 -right-2 bg-neutral-700/90 backdrop-blur-sm text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                        {item.quantity}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-white leading-tight text-sm truncate">{item.title}</p>
                    {item.variant && item.variant !== 'default' && (
                       <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.variant}</p>
                    )}
                  </div>
                  <p className="font-medium text-white text-sm whitespace-nowrap ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 mt-6 pt-5 flex justify-between items-center">
              <span className="text-base font-semibold text-white">Total</span>
              <div className="flex items-end gap-2">
                <span className="text-xs text-neutral-500 mb-1">USD</span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  ${order.amount_cents ? (order.amount_cents / 100).toFixed(2) : order.product_price.replace('$', '')}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Next Steps CTA */}
      <div className="flex flex-col sm:flex-row justify-start gap-3 print:hidden">
        <Button
          onClick={() => navigate(homeUrl)}
          className="h-12 px-8 font-medium text-base bg-primary text-primary-foreground hover:brightness-110 rounded-md shadow-sm transition-all"
        >
          Continue shopping
        </Button>
        {order && (
          <Button
            variant="outline"
            onClick={handlePrint}
            className="h-12 px-8 font-medium text-base hover:bg-neutral-800 bg-neutral-900 border-white/10 text-white rounded-md shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 mr-2" /> Print receipt
          </Button>
        )}
      </div>

      </div>
    </div>
  );
};

export default PublicThankYouPage;