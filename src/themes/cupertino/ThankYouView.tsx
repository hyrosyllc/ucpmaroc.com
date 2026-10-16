import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileDown, FileText, Loader2, Package, Printer } from "lucide-react";
import { UCP } from "@ucp/sdk";

const Card = ({ title, children, className = "" }: any) => (
  <section className={`rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8 print:shadow-none ${className}`}>
    <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h2>
    {children}
  </section>
);

export default function CupertinoThankYouView({ portfolio }: any) {
  const m = UCP.useThankYou(portfolio);
  if (m.loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-20 pt-24 font-sans text-slate-900 print:bg-white print:pt-0">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="mb-8 flex flex-col items-start gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-white print:hidden"><CheckCircle2 size={32} /></span>
          {m.orderNumber && <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Order #{m.orderNumber}</p>}
          <h1 className="text-4xl font-[800] tracking-tighter sm:text-5xl">Thank you{m.firstName ? `, ${m.firstName}` : ""}.</h1>
          {m.order && <p className="font-medium text-slate-500">A confirmation email with your order details is on its way.</p>}
        </header>

        {m.order && (
          <>
            {m.digitalProducts.length > 0 && (
              <Card title="Digital downloads">
                <div className="space-y-6">
                  {m.digitalProducts.map((dp: any) => (
                    <div key={dp.id} className="space-y-3">
                      <h3 className="flex items-center gap-2 font-bold"><FileDown size={18} /> {dp.title}</h3>
                      {dp.digital_message && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-600">{dp.digital_message}</p>}
                      <div className="flex flex-col gap-2">
                        {dp.digital_files?.map((file: any, i: number) => (
                          <a key={i} href={file.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-full bg-slate-50 px-5 py-3 text-sm font-bold transition hover:bg-slate-100">
                            <span className="flex min-w-0 items-center gap-3"><FileText size={16} className="shrink-0" /><span className="truncate">{file.name}</span></span>
                            <span className="shrink-0 rounded-full bg-slate-900 px-4 py-1.5 text-xs text-white print:hidden">Download</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card title="Customer">
              <div className="grid gap-6 text-sm sm:grid-cols-2">
                <div>
                  <h3 className="mb-1 font-bold">Billed to</h3>
                  {m.displayName && <p className="text-slate-600">{m.displayName}</p>}
                  <p className="text-slate-600">{m.displayEmail}</p>
                  {m.displayPhone && <p className="text-slate-600">{m.displayPhone}</p>}
                </div>
                <div>
                  <h3 className="mb-1 font-bold">Payment</h3>
                  <p className="text-slate-600">{m.paymentMethod}</p>
                  {m.bank && (
                    <div className="mt-3 space-y-0.5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                      <p className="font-bold text-slate-900">Bank transfer details</p>
                      <p>Bank: {m.bank.name}</p>
                      <p>Holder: {m.bank.holder}</p>
                      <p>IBAN: {m.bank.iban}</p>
                    </div>
                  )}
                </div>
                {m.displayAddress && <div className="sm:col-span-2"><h3 className="mb-1 font-bold">Shipping address</h3><p className="text-slate-600">{m.displayAddress}</p></div>}
                {m.shippingMethod && <div className="sm:col-span-2"><h3 className="mb-1 font-bold">Shipping method</h3><p className="text-slate-600">{m.shippingMethod}</p></div>}
              </div>
            </Card>

            <Card title="Order summary">
              <ul className="space-y-4">
                {m.items ? (
                  m.items.map((item: any, i: number) => (
                    <li key={i} className="flex items-center gap-4">
                      {item.image && (
                        <div className="relative h-16 w-16 shrink-0 print:hidden">
                          <img src={item.image} alt="" className="h-full w-full rounded-2xl object-cover" />
                          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">{item.quantity}</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{item.title}</p>
                        <p className="text-xs font-medium text-slate-500">Qty {item.quantity}{item.variant && item.variant !== "default" ? ` · ${item.variant}` : ""}</p>
                      </div>
                      <span className="text-sm font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex justify-between text-sm font-bold"><span>{m.order.product_name}</span><span>{m.order.product_price}</span></li>
                )}
              </ul>
              <div className="mt-6 flex items-end justify-between border-t border-slate-100 pt-5">
                <span className="font-bold">Total paid</span>
                <span className="text-3xl font-[800] tracking-tighter">${m.totalDisplay}</span>
              </div>
            </Card>
          </>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row print:hidden">
          <Link to={m.homeUrl} className="flex h-14 items-center justify-center rounded-full bg-slate-900 px-8 text-base font-bold text-white transition hover:scale-[1.02] active:scale-95">Continue shopping</Link>
          {m.order && (
            <>
              <Link to={m.ordersUrl} className="flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold shadow-sm transition hover:bg-slate-100"><Package size={18} /> Track order</Link>
              <button type="button" onClick={m.handlePrint} className="flex h-14 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-bold shadow-sm transition hover:bg-slate-100"><Printer size={18} /> Print receipt</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
