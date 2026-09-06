import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ShoppingBag, Printer, MapPin, Mail, Phone, Loader2, FileDown, FileText, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "../store/useCartStore";
import { supabase } from "@/supabaseClient";

const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
  "psychic-cod-r74vrp5xx9gq2ppr7-5173.app.github.dev",
  "laughing-succotash-wrxrgrqvpj75hv99q-5173.app.github.dev",
];


const PublicThankYouPage = () => {
  const { portfolio } = useOutletContext<{ portfolio: any }>();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order');
  const [order, setOrder] = useState<any>(null);
  const [digitalProducts, setDigitalProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🚀 Ensure we are wiping the CORRECT store's cart
    if (portfolio?.id) {
      useCartStore.getState().validateStoreContext(portfolio.id);
    }
    clearCart();
    
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('pro_orders').select('*').eq('id', orderId).maybeSingle();
      if (data && !error) {
        setOrder(data);
        
        // Fetch digital products if any
        if (data.items && data.items.length > 0) {
           const itemIds = data.items.map((i: any) => i.id);
           const { data: prods } = await supabase
              .from('pro_products')
              .select('id, title, digital_files, digital_message, delivery_type')
              .in('id', itemIds);
           if (prods) {
              setDigitalProducts(prods.filter(p => p.delivery_type === 'digital' || (p.digital_files && p.digital_files.length > 0)));
           }
        }
      }
      setLoading(false);
    };
    
    fetchOrder();
  }, [clearCart, orderId]);

  const isCustomDomain = !MAIN_DOMAINS.some((domain) => window.location.hostname.includes(domain));
  const homeUrl = isCustomDomain ? '/' : `/pro/${portfolio.public_slug}`;
  const shopUrl = isCustomDomain ? '/shop' : `/pro/${portfolio.public_slug}/shop`;
  const ordersUrl = isCustomDomain ? '/dashboard/orders' : `/pro/${portfolio.public_slug}/dashboard/orders`;

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
    <div className="w-full flex flex-col items-center pt-12 pb-16 lg:pt-16 px-4 sm:px-6 font-sans selection:bg-primary/20 selection:text-primary-foreground animate-in fade-in duration-500 bg-transparent text-foreground print:bg-white print:text-black print:p-0">
      
      <div className="max-w-2xl w-full">
        
        {/* PRINT ONLY: Invoice Header */}
        {order && (
          <div className="hidden print:block border-b border-neutral-300 pb-8 mb-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-black tracking-tighter uppercase">Receipt</h1>
                <p className="text-neutral-500 mt-1 font-mono text-sm">#{order.id.split('-')[0].toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-black text-lg">{portfolio?.site_name || portfolio?.public_slug || 'Store'}</p>
                <p className="text-neutral-500 text-sm mt-1">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Header */}
        <div className="flex flex-col items-start gap-4 mb-8 print:hidden">
          <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-500 delay-150" />
          <div className="space-y-1">
            {order && <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Order #{order.id.split('-')[0].toUpperCase()}</p>}
            <h1 className="text-3xl sm:text-4xl font-normal text-foreground tracking-tight">
              Thank you{order ? `, ${order.customer_name.split(' ')[0]}` : ''}!
            </h1>
          </div>
        </div>

      {order && (
        <>
          {/* Confirmation Box */}
          <div className="rounded-lg border border-border p-6 mb-6 bg-card shadow-sm print:hidden">
            <h2 className="text-lg font-medium text-foreground mb-2">Your order is confirmed</h2>
            <p className="text-sm text-muted-foreground">You'll receive a confirmation email with your order details shortly.</p>
          </div>

          {/* Digital Downloads Box */}
          {digitalProducts.length > 0 && (
            <div className="rounded-lg border border-primary/30 p-6 mb-6 bg-primary/5 shadow-sm print:shadow-none print:border-neutral-200 print:bg-transparent print:p-0 print:mb-8">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 print:text-black">
                <FileDown className="text-primary print:text-black" size={20}/> Digital Downloads
              </h2>
              <div className="space-y-6">
                {digitalProducts.map(dp => (
                  <div key={dp.id} className="space-y-3">
                    <h3 className="font-semibold text-foreground print:text-black">{dp.title}</h3>
                    {dp.digital_message && (
                      <p className="text-sm text-foreground/80 print:text-neutral-600 bg-background/50 p-3 rounded-md border border-border/50">{dp.digital_message}</p>
                    )}
                    <div className="flex flex-col gap-2">
                      {dp.digital_files?.map((file: any, idx: number) => (
                        <a key={idx} href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors group print:border-neutral-300 print:bg-transparent">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary/10 text-primary rounded-md print:bg-transparent print:p-0 print:text-black"><FileText size={16}/></div>
                            <span className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors print:text-black">{file.name}</span>
                          </div>
                          <Button size="sm" variant="secondary" className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground print:hidden">Download</Button>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Information Box */}
          <div className="rounded-lg border border-border p-6 mb-6 bg-card shadow-sm print:shadow-none print:border-neutral-200 print:bg-transparent print:p-0 print:mb-8">
            <h2 className="text-lg font-medium text-foreground mb-4 print:hidden">Customer information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
               <div>
                 <h3 className="font-medium text-foreground mb-1 print:text-neutral-500 print:text-xs print:uppercase print:tracking-widest">Billed To</h3>
                 {displayName && <p className="text-muted-foreground print:text-black print:font-bold mb-1">{displayName}</p>}
                 <p className="text-muted-foreground print:text-neutral-600">{displayEmail}</p>
                 {displayPhone && <p className="text-muted-foreground print:text-neutral-600 mt-1">{displayPhone}</p>}
               </div>
               <div>
                 <h3 className="font-medium text-foreground mb-1 print:text-neutral-500 print:text-xs print:uppercase print:tracking-widest">Payment method</h3>
                 <p className="text-muted-foreground print:text-black print:font-bold">{getPaymentMethodDisplay()}</p>
                 {coreExtra.bankName && (
                   <div className="mt-3 p-3 bg-background rounded-md border border-border print:border-neutral-200 print:bg-transparent print:p-0 print:mt-2">
                     <p className="text-xs font-semibold text-foreground print:text-black mb-1.5 print:mb-0.5">Bank Transfer Details</p>
                     <p className="text-xs text-muted-foreground print:text-neutral-600"><span className="font-medium print:text-black">Bank:</span> {coreExtra.bankName}</p>
                     <p className="text-xs text-muted-foreground print:text-neutral-600"><span className="font-medium print:text-black">Holder:</span> {coreExtra.bankHolder}</p>
                     <p className="text-xs text-muted-foreground print:text-neutral-600"><span className="font-medium print:text-black">IBAN:</span> {coreExtra.bankIban}</p>
                   </div>
                 )}
               </div>
               {displayAddress && (
                 <div className="sm:col-span-2 pt-2 border-t border-border/50 print:border-neutral-200">
                   <h3 className="font-medium text-foreground mb-1 print:text-neutral-500 print:text-xs print:uppercase print:tracking-widest">Shipping address</h3>
                   <p className="text-muted-foreground print:text-black">{displayAddress}</p>
                 </div>
               )}
               {coreExtra.shipping && (
                 <div className="sm:col-span-2 pt-2 border-t border-border/50 print:border-neutral-200">
                   <h3 className="font-medium text-foreground mb-1 print:text-neutral-500 print:text-xs print:uppercase print:tracking-widest">Shipping method</h3>
                   <p className="text-muted-foreground print:text-black">{coreExtra.shipping}</p>
                 </div>
               )}
            </div>
          </div>

          {/* Order Summary Box */}
          <div className="rounded-lg border border-border p-6 mb-8 bg-card shadow-sm print:shadow-none print:border-none print:bg-transparent print:p-0">
            <h2 className="text-lg font-medium text-foreground mb-4 print:text-neutral-500 print:text-xs print:uppercase print:tracking-widest print:border-b print:border-neutral-300 print:pb-2">Order summary</h2>
            <div className="space-y-5 print:space-y-3">
              {/* --- IMPROVEMENT: Read from structured 'items' array --- */}
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 print:border-b print:border-neutral-100 print:pb-3 print:items-start">
                    {item.image && (
                      <div className="relative w-16 h-16 bg-background border border-border rounded-lg flex items-center justify-center shrink-0 print:hidden">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                        <span className="absolute -top-2 -right-2 bg-foreground/90 backdrop-blur-sm text-background text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                          {item.quantity}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-medium text-foreground print:text-black leading-tight text-sm truncate print:text-base print:whitespace-normal">{item.title}</p>
                      {item.variant && item.variant !== 'default' && (
                         <p className="text-xs text-muted-foreground/70 print:text-neutral-600 mt-0.5 truncate print:whitespace-normal">
                           <span className="print:hidden">{item.variant}</span>
                           <span className="hidden print:inline">Qty: {item.quantity} • {item.variant}</span>
                         </p>
                      )}
                      {(!item.variant || item.variant === 'default') && (
                         <p className="hidden print:block text-xs text-muted-foreground/50 mt-0.5">Qty: {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-medium text-foreground print:text-black text-sm whitespace-nowrap ml-4 print:mt-0 print:text-base">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))
              ) : (
                // Fallback for old orders without the 'items' array
                <div className="flex justify-between items-center">
                  <p className="font-medium text-foreground print:text-black text-sm">{order.product_name}</p>
                  <p className="font-medium text-foreground print:text-black text-sm">{order.product_price}</p>
                </div>
              )}
            </div>

            <div className="border-t border-border print:border-neutral-300 mt-6 pt-5 flex justify-between items-center">
              <span className="text-base font-semibold text-foreground print:text-black print:uppercase print:text-xs print:tracking-widest">Total Paid</span>
              <div className="flex items-end gap-2">
                <span className="text-xs text-muted-foreground print:hidden mb-1">USD</span>
                <span className="text-2xl font-bold text-foreground print:text-black tracking-tight">
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
            onClick={() => navigate(ordersUrl)}
            className="h-12 px-8 font-medium text-base hover:bg-foreground/5 bg-card border-border text-foreground rounded-md shadow-sm transition-all"
          >
            <Package className="w-4 h-4 mr-2" /> Track Order
          </Button>
        )}
        {order && (
          <Button
            variant="outline"
            onClick={handlePrint}
            className="h-12 px-8 font-medium text-base hover:bg-foreground/5 bg-card border-border text-foreground rounded-md shadow-sm transition-all"
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