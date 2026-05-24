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
      else if (k === "checkout_phone" || k === "phone" || k === "phone number") coreExtra.phone = v;
      else if (k === "checkout_name" || k === "name" || k === "full name") coreExtra.name = v;
      else if (k === "shipping") coreExtra.shipping = v;
      else if (k === "bank name") coreExtra.bankName = v;
      else if (k === "account holder") coreExtra.bankHolder = v;
      else if (k === "iban" || k === "iban/account no") coreExtra.bankIban = v;
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
  const displayName = order?.customer_name && order.customer_name !== "Anonymous Buyer" ? order.customer_name : coreExtra.name;
  const displayPhone = order?.customer_phone && order.customer_phone !== "No Phone" ? order.customer_phone : coreExtra.phone;
  
  const formatAddress = () => {
     const parts = [];
     if (order?.customer_address && order.customer_address !== "No Address Provided" && !order.customer_address.includes('@')) {
         parts.push(order.customer_address);
     } else if (coreExtra.address) {
         parts.push(coreExtra.address);
     }
     
     const cityZipCountry = [coreExtra.city, coreExtra.zip, coreExtra.country].filter(Boolean).join(', ');
     if (cityZipCountry && (!order?.customer_address || !order.customer_address.includes(cityZipCountry))) {
         parts.push(cityZipCountry);
     }
     
     return parts.length > 0 ? parts.join(' - ') : null;
  };
  
  const getPaymentMethodDisplay = () => {
      if (order?.notes?.includes('Payment Method: BANK')) return 'Bank Transfer';
      if (order?.notes?.includes('Payment Method: CRYPTO')) return 'Crypto Transfer';
      if (order?.notes?.includes('Payment Method: COD')) return 'Cash on Delivery';
      if (order?.stripe_payment_intent_id?.startsWith('cod_')) return 'Cash on Delivery';
      return 'Credit Card (Stripe)';
  };

  const displayAddress = formatAddress();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center pt-24 pb-16 lg:pt-32 px-4 sm:px-6 font-sans selection:bg-primary/20 selection:text-gray-900 animate-in fade-in duration-500">
      
      <div className="max-w-2xl w-full">
        
        {/* Success Header */}
        <div className="flex flex-col items-start gap-4 mb-8 print:items-center print:mb-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500 delay-150" />
          <div className="space-y-1">
            {order && <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Order #{order.id.split('-')[0].toUpperCase()}</p>}
            <h1 className="text-3xl sm:text-4xl font-normal text-gray-900 tracking-tight">
              Thank you{order ? `, ${order.customer_name.split(' ')[0]}` : ''}!
            </h1>
          </div>
        </div>

      {order && (
        <>
          {/* Confirmation Box */}
          <div className="rounded-lg border border-gray-200 p-6 mb-6 bg-white shadow-sm print:shadow-none">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Your order is confirmed</h2>
            <p className="text-sm text-gray-600">You'll receive a confirmation email with your order details shortly.</p>
          </div>

          {/* Customer Information Box */}
          <div className="rounded-lg border border-gray-200 p-6 mb-6 bg-white shadow-sm print:shadow-none">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
               <div>
                 <h3 className="font-medium text-gray-900 mb-1">Contact information</h3>
                 {displayName && <p className="text-gray-600 mb-1">{displayName}</p>}
                 <p className="text-gray-600">{displayEmail}</p>
                 {displayPhone && <p className="text-gray-600 mt-1">{displayPhone}</p>}
               </div>
               <div>
                 <h3 className="font-medium text-gray-900 mb-1">Payment method</h3>
                 <p className="text-gray-600">{getPaymentMethodDisplay()}</p>
                 {coreExtra.bankName && (
                   <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                     <p className="text-xs font-semibold text-gray-900 mb-1.5">Bank Transfer Details</p>
                     <p className="text-xs text-gray-600"><span className="font-medium">Bank:</span> {coreExtra.bankName}</p>
                     <p className="text-xs text-gray-600"><span className="font-medium">Holder:</span> {coreExtra.bankHolder}</p>
                     <p className="text-xs text-gray-600"><span className="font-medium">IBAN:</span> {coreExtra.bankIban}</p>
                   </div>
                 )}
               </div>
               {displayAddress && (
                 <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                   <h3 className="font-medium text-gray-900 mb-1">Shipping address</h3>
                   <p className="text-gray-600">{displayAddress}</p>
                 </div>
               )}
               {coreExtra.shipping && (
                 <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                   <h3 className="font-medium text-gray-900 mb-1">Shipping method</h3>
                   <p className="text-gray-600">{coreExtra.shipping}</p>
                 </div>
               )}
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="rounded-lg border border-gray-200 p-6 mb-8 bg-white shadow-sm print:shadow-none">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Order summary</h2>
            <div className="space-y-5">
              {/* --- IMPROVEMENT: Read from structured 'items' array --- */}
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    {item.image && (
                      <div className="relative w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                        <span className="absolute -top-2 -right-2 bg-gray-500/90 backdrop-blur-sm text-white text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-gray-900 leading-tight text-sm truncate">{item.title}</p>
                      {item.variant && item.variant !== 'default' && (
                         <p className="text-xs text-gray-500 mt-0.5 truncate">{item.variant}</p>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 text-sm whitespace-nowrap ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))
              ) : (
                // Fallback for old orders without the 'items' array
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-900 text-sm">{order.product_name}</p>
                  <p className="font-medium text-gray-900 text-sm">{order.product_price}</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 mt-6 pt-5 flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <div className="flex items-end gap-2">
                <span className="text-xs text-gray-500 mb-1">USD</span>
                <span className="text-2xl font-bold text-gray-900 tracking-tight">
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
            className="h-12 px-8 font-medium text-base hover:bg-gray-50 bg-white border-gray-300 text-gray-700 rounded-md shadow-sm transition-all"
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