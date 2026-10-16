import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookOpen, Code2, ShieldCheck, Zap } from "lucide-react";

interface SdkDocsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SdkDocsModal({
  isOpen,
  onOpenChange,
}: SdkDocsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] bg-zinc-950 border-zinc-800 flex flex-col p-0 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <BookOpen className="text-indigo-400" size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white">
                Actor Pro Studio: Theme Developer SDK
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-1">
                Everything you need to build top-tier SaaS portfolios.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto p-6 space-y-10 custom-scrollbar text-zinc-300 text-sm leading-relaxed">
          {/* INTRO */}
          <section>
            <p className="mb-4">
              Welcome to the Actor Pro Studio developer ecosystem. To guarantee
              blazing-fast load times, zero-dependency breakage, and absolute
              security for our users, the Studio operates as a curated{" "}
              <strong className="text-white">Walled Garden</strong>.
            </p>
            <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-indigo-200">
              <ShieldCheck className="shrink-0 mt-0.5" size={18} />
              <p>
                You do not need a terminal, a{" "}
                <code className="bg-indigo-950 px-1 rounded text-indigo-300">
                  package.json
                </code>
                , or a build step. Everything you need is pre-loaded, globally
                cached, and instantly available.
              </p>
            </div>
          </section>

          {/* 1. STYLING & CSS */}
          <section>
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">1.</span> Styling & CSS
            </h3>
            <p className="mb-4">
              We natively support <strong>Tailwind CSS</strong>. You do not need
              to write or import custom{" "}
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200 text-xs font-mono">
                .css
              </code>{" "}
              files.
            </p>
            <h4 className="text-white font-semibold mb-2">
              Class Merging (cn)
            </h4>
            <p className="mb-3">
              To handle dynamic classes without conflicts, use our
              pre-configured Tailwind Merge utility.
            </p>
            <div className="bg-[#0d0d0f] border border-zinc-800 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-zinc-300">
                <span className="text-pink-400">import</span> {`{ cn }`}{" "}
                <span className="text-pink-400">from</span>{" "}
                <span className="text-emerald-300">"@/lib/utils"</span>;{`\n\n`}
                <span className="text-zinc-500">// Example</span>
                {`\n`}
                &lt;<span className="text-blue-400">div</span>{" "}
                <span className="text-indigo-300">className</span>={"{cn("}
                <span className="text-emerald-300">\"p-4 bg-black\"</span>
                {", isScrolled ? "}
                <span className="text-emerald-300">\"bg-white\"</span>
                {" : "}
                <span className="text-emerald-300">\"\"</span>
                {")}"} /&gt;
              </pre>
            </div>
          </section>

          {/* 2. APPROVED IMPORTS */}
          <section>
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">2.</span> Approved Core Imports
            </h3>
            <p className="mb-4">
              You cannot import random packages from NPM. However, the following
              industry-standard libraries are securely pre-loaded and available
              for immediate use:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
                  Core UI & Animation
                </h4>
                <ul className="space-y-3">
                  <li>
                    <code className="text-xs font-mono text-indigo-300 bg-black/40 px-1.5 py-0.5 rounded">
                      react
                    </code>{" "}
                    <br />
                    <span className="text-xs text-zinc-500">
                      Full support for useState, useEffect, useRef, etc.
                    </span>
                  </li>
                  <li>
                    <code className="text-xs font-mono text-indigo-300 bg-black/40 px-1.5 py-0.5 rounded">
                      framer-motion
                    </code>{" "}
                    <br />
                    <span className="text-xs text-zinc-500">
                      The gold standard for React animations.
                    </span>
                  </li>
                  <li>
                    <code className="text-xs font-mono text-indigo-300 bg-black/40 px-1.5 py-0.5 rounded">
                      lucide-react
                    </code>{" "}
                    <br />
                    <span className="text-xs text-zinc-500">
                      Massive library of beautiful icons.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">
                  The Expansion Pack
                </h4>
                <ul className="space-y-3">
                  <li>
                    <code className="text-xs font-mono text-pink-300 bg-black/40 px-1.5 py-0.5 rounded">
                      recharts
                    </code>{" "}
                    <br />
                    <span className="text-xs text-zinc-500">
                      Build stunning, responsive charts.
                    </span>
                  </li>
                  <li>
                    <code className="text-xs font-mono text-amber-300 bg-black/40 px-1.5 py-0.5 rounded">
                      @/components/ui/*
                    </code>{" "}
                    <br />
                    <span className="text-xs text-zinc-500">
                      Platform UI kit: button, input, dialog, tabs, select,
                      accordion, carousel and more.
                    </span>
                  </li>
                  <li>
                    <code className="text-xs font-mono text-lime-300 bg-black/40 px-1.5 py-0.5 rounded">
                      react-router-dom
                    </code>{" "}
                    <br />
                    <span className="text-xs text-zinc-500">
                      Only <code>Link</code>. Navigation and redirects are handled by
                      the platform.
                    </span>
                  </li>
                  <li>
                    <code className="text-xs font-mono text-orange-300 bg-black/40 px-1.5 py-0.5 rounded">
                      canvas-confetti
                    </code>{" "}
                    <br />
                    <span className="text-xs text-zinc-500">
                      High-impact particle explosions.
                    </span>
                  </li>
                  <li>
                    <code className="text-xs font-mono text-cyan-300 bg-black/40 px-1.5 py-0.5 rounded">
                      date-fns
                    </code>{" "}
                    <br />
                    <span className="text-xs text-zinc-500">
                      Powerful utility for formatting dates.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. PLATFORM SDK */}
          <section>
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">3.</span> The Platform SDK
              (@ucp/sdk)
            </h3>
            <p className="mb-4">
              To allow end-users to edit text directly on the canvas without
              touching code, you <strong>must</strong> wrap your editable text
              in the{" "}
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200 text-xs font-mono">
                &lt;UCP.Text /&gt;
              </code>{" "}
              component.
            </p>

            <div className="bg-[#0d0d0f] border border-zinc-800 rounded-xl p-4 overflow-x-auto mb-6">
              <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                <span className="text-pink-400">import</span> {`{ UCP }`}{" "}
                <span className="text-pink-400">from</span>{" "}
                <span className="text-emerald-300">"@ucp/sdk"</span>;{`\n\n`}
                <span className="text-pink-400">
                  export default function
                </span>{" "}
                <span className="text-blue-400">MyHero</span>(
                {`{ id, isPreview }`}) {`{\n`}
                <span className="text-pink-400">return</span> {`(\n`}
                &lt;<span className="text-blue-400">UCP.Text</span>
                <span className="text-indigo-300">as</span>=
                <span className="text-emerald-300">"h1"</span>{" "}
                <span className="text-zinc-500">
                  // Renders as an &lt;h1&gt; tag
                </span>
                <span className="text-indigo-300">field</span>=
                <span className="text-emerald-300">"headline"</span>{" "}
                <span className="text-zinc-500">
                  // The database key it saves to
                </span>
                <span className="text-indigo-300">default</span>=
                <span className="text-emerald-300">"Hello World"</span>{" "}
                <span className="text-zinc-500">// Fallback if empty</span>
                <span className="text-indigo-300">sectionId</span>={"{"}id{"}"}{" "}
                <span className="text-zinc-500">
                  // Required: Passed from props
                </span>
                <span className="text-indigo-300">isPreview</span>={"{"}
                isPreview{"}"}{" "}
                <span className="text-zinc-500">
                  // Required: Passed from props
                </span>
                <span className="text-indigo-300">className</span>=
                <span className="text-emerald-300">"text-4xl font-bold"</span>
                /&gt;
                {`);\n}`}
              </pre>
            </div>

            <h4 className="text-white font-semibold mb-3">
              Props for UCP.Text:
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <code className="text-white font-mono bg-zinc-800 px-1 rounded">
                  as
                </code>{" "}
                (string): The HTML tag to render (e.g., "h1", "p", "span").
                Defaults to "span".
              </li>
              <li>
                <code className="text-white font-mono bg-zinc-800 px-1 rounded">
                  field
                </code>{" "}
                (string): The unique key this text maps to in your Schema.
              </li>
              <li>
                <code className="text-white font-mono bg-zinc-800 px-1 rounded">
                  default
                </code>{" "}
                (string): The placeholder text to show before the user edits it.
              </li>
              <li>
                <code className="text-white font-mono bg-zinc-800 px-1 rounded">
                  sectionId
                </code>{" "}
                (string): Pass the <code className="text-indigo-300">id</code>{" "}
                prop received by your main component.
              </li>
              <li>
                <code className="text-white font-mono bg-zinc-800 px-1 rounded">
                  isPreview
                </code>{" "}
                (boolean): Pass the{" "}
                <code className="text-indigo-300">isPreview</code> prop received
                by your main component.
              </li>
              <li>
                <code className="text-white font-mono bg-zinc-800 px-1 rounded">
                  className
                </code>{" "}
                (string): Standard Tailwind classes for styling.
              </li>
            </ul>
          </section>

          {/* 4. SCHEMAS */}
          <section>
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">4.</span> Building the UI Editor
              (Schemas)
            </h3>
            <p className="mb-4">
              To generate the sidebar settings panel for the user, you must
              attach a{" "}
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200 text-xs font-mono">
                schema
              </code>{" "}
              array to your component's default export. The Studio automatically
              reads this array and builds the UI controls.
            </p>

            <h4 className="text-white font-semibold mb-3">
              Supported Schema Types:
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400 mb-6">
              <li>
                <code className="text-indigo-300 font-mono">string</code>: A
                standard text input field.
              </li>
              <li>
                <code className="text-indigo-300 font-mono">color</code>: A
                visual color picker. Returns a hex code (e.g., "#FF0000").
              </li>
              <li>
                <code className="text-indigo-300 font-mono">toggle</code>: A
                switch. Returns a boolean (true or false).
              </li>
              <li>
                <code className="text-indigo-300 font-mono">select</code>: A
                dropdown menu. Requires an{" "}
                <code className="text-white bg-zinc-800 px-1 rounded">
                  options
                </code>{" "}
                array.
              </li>
              <li>
                <code className="text-indigo-300 font-mono">slider</code>: A
                range slider. Requires{" "}
                <code className="text-white bg-zinc-800 px-1 rounded">min</code>{" "}
                and{" "}
                <code className="text-white bg-zinc-800 px-1 rounded">max</code>{" "}
                integers.
              </li>
            </ul>

            <div className="bg-[#0d0d0f] border border-zinc-800 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                <span className="text-pink-400">export default function</span>{" "}
                <span className="text-blue-400">PricingCard</span>({`{ data }`}){" "}
                {`{\n`}
                <span className="text-pink-400">return</span> {`(\n`}
                &lt;<span className="text-blue-400">div</span>{" "}
                <span className="text-indigo-300">style</span>=
                {`{{ backgroundColor: data.bgColor }}`} className="p-4"&gt;
                {`{data.showBadge && `}&lt;
                <span className="text-blue-400">span</span>&gt;Most Popular&lt;/
                <span className="text-blue-400">span</span>&gt;{`}`}
                {`\n`}
                &lt;<span className="text-blue-400">h3</span>&gt;
                {`{data.title}`}&lt;/<span className="text-blue-400">h3</span>
                &gt; &lt;/<span className="text-blue-400">div</span>&gt;
                {`);\n}`}
                <span className="text-zinc-500">
                  // Attach schema to the default export
                </span>
                PricingCard.schema = [{`{ id: `}
                <span className="text-emerald-300">'title'</span>
                {`, type: `}
                <span className="text-emerald-300">'string'</span>
                {`, label: `}
                <span className="text-emerald-300">'Card Title'</span>
                {`, defaultValue: `}
                <span className="text-emerald-300">'Pro Plan'</span>
                {` },`}
                {`{ id: `}
                <span className="text-emerald-300">'bgColor'</span>
                {`, type: `}
                <span className="text-emerald-300">'color'</span>
                {`, label: `}
                <span className="text-emerald-300">'Background Color'</span>
                {`, defaultValue: `}
                <span className="text-emerald-300">'#ffffff'</span>
                {` },`}
                {`{ id: `}
                <span className="text-emerald-300">'showBadge'</span>
                {`, type: `}
                <span className="text-emerald-300">'toggle'</span>
                {`, label: `}
                <span className="text-emerald-300">'Show Badge'</span>
                {`, defaultValue: `}
                <span className="text-orange-300">true</span>
                {` }`}
                ];
              </pre>
            </div>
          </section>

          {/* 5. GLOBAL PROPS */}
          <section>
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">5.</span> Global Props &
              Navigation
            </h3>
            <p className="mb-4">
              Your component will automatically receive several props from the
              platform engine:
            </p>
            <ul className="space-y-4">
              <li className="bg-zinc-900/50 p-3 rounded border border-zinc-800">
                <code className="text-indigo-400 font-bold mb-1 block">
                  data
                </code>
                <span className="text-zinc-400">
                  An object containing all the user's saved values (matching
                  your schema).
                </span>
              </li>
              <li className="bg-zinc-900/50 p-3 rounded border border-zinc-800">
                <code className="text-indigo-400 font-bold mb-1 block">id</code>
                <span className="text-zinc-400">
                  The unique database ID of this specific section.
                </span>
              </li>
              <li className="bg-zinc-900/50 p-3 rounded border border-zinc-800">
                <code className="text-indigo-400 font-bold mb-1 block">
                  isPreview
                </code>
                <span className="text-zinc-400">
                  A boolean. If <code className="text-white">true</code>, the
                  component is rendering inside the builder canvas. Use this to
                  disable destructive actions (like smooth scrolling to other
                  sections) while the user is editing.
                </span>
              </li>
              <li className="bg-zinc-900/50 p-3 rounded border border-zinc-800">
                <code className="text-indigo-400 font-bold mb-1 block">
                  data.customLinks
                </code>
                <span className="text-zinc-400">
                  An array of{" "}
                  <code className="text-white">{`{ label: string, url: string }`}</code>{" "}
                  generated by the platform. If you are building a Header or
                  Footer component, map over this array to build your navigation
                  menus.
                </span>
              </li>
            </ul>
          </section>

          {/* 6. SECTION SDK REFERENCE */}
          <section>
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">6.</span> Section Hooks &amp;
              Components
            </h3>
            <p className="text-zinc-400 mb-3">
              Themes never fetch data or touch carts, bookings, or payments
              themselves. Use these from{" "}
              <code className="text-white bg-zinc-800 px-1 rounded">
                @ucp/sdk
              </code>{" "}
              and style the result. Full signatures autocomplete in the editor.
            </p>
            <ul className="space-y-2 text-zinc-400">
              {[
                ["useFaq(items, { allowMultiple, firstOpen })", "Accordion and category state plus FAQPage JSON-LD."],
                ["useCountUp(value, animate)", "Animated statistic; attach ref to the element."],
                ["useSlider(count, { intervalSeconds })", "Slideshow index with autoplay."],
                ["useVideoGallery(videos, isPreview)", "Carousel, lightbox, YouTube helpers."],
                ["useReviews({ portfolioId, isPreview })", "Published reviews and the visitor submission flow."],
                ["useBookingFlow({ portfolioId, isPreview })", "Services, calendar, slots, form, payment hand-off. Render <UCP.BookingPayment /> when payment is set."],
                ["useStoreProducts / useProductCard / useProductSpotlight", "Store section data, card actions, featured-product configurator."],
                ["useHeaderChrome({ data, settings })", "Mobile menu, hide on scroll, announcement rotation."],
                ["useAccordion()", "Open/closed state for any disclosure list."],
                ["useCartDrawer({ username, isPreview })", "Cart drawer: items, quantity, coupon, totals, close, checkout. Render only when isOpen."],
                ["useCheckout(portfolio)", "Checkout: step, items, totals, shipping rates, coupon, plus slots.contact and slots.payment."],
                ["useThankYou(portfolio)", "Order confirmation: order, downloads, display fields, URLs, print."],
                ["<UCP.HtmlSandbox />", "Isolated renderer for owner-authored HTML."],
              ].map(([name, text]) => (
                <li key={name} className="flex flex-col gap-0.5">
                  <code className="text-indigo-300 text-xs">{name}</code>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <p className="text-zinc-400 mt-4">
              <strong className="text-white">Multi-file themes:</strong> import
              helpers with{" "}
              <code className="text-white bg-zinc-800 px-1 rounded">
                ./SectionTitle
              </code>
              . Only the modules listed in the SDK typings are available; any
              other import blocks submission. Export{" "}
              <code className="text-white bg-zinc-800 px-1 rounded">schema</code>{" "}
              as an array of{" "}
              <code className="text-white bg-zinc-800 px-1 rounded">{`{ id, type, label, defaultValue, options }`}</code>{" "}
              to expose design settings (types: text, textarea, number, toggle,
              select, color, slider, image, link).
            </p>
          </section>

          {/* 7. COMMERCE VIEWS */}
          <section>
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">7.</span> Styling the Store
            </h3>
            <p className="text-zinc-400 mb-3">
              You can restyle every store page. Add a file with one of these names
              (default export) and the platform uses it instead of the built-in
              page. If your view is missing or crashes, the built-in page is shown.
            </p>
            <ul className="space-y-2 text-zinc-400 mb-4">
              {[
                ["ShopLayout", "Product grid, search, collections. Props: products, collections, filters."],
                ["ProductLayout", "Product page. Props carry state and actions (quantity, variants, add to cart)."],
                ["LoginLayout", "Customer sign in and sign up. Props carry form state and handleAuth."],
                ["CartDrawer", "Slide-over cart. Uses UCP.useCartDrawer()."],
                ["CheckoutView", "Uses UCP.useCheckout(portfolio). Place slots.contact and slots.payment."],
                ["ThankYouView", "Uses UCP.useThankYou(portfolio)."],
              ].map(([name, text]) => (
                <li key={name} className="flex flex-col gap-0.5">
                  <code className="text-indigo-300 text-xs">{name}</code>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-indigo-200">
              <ShieldCheck className="shrink-0 mt-0.5" size={18} />
              <p>
                <strong>Logic never lives in a theme.</strong> Carts, prices, coupons,
                shipping, payments, orders and sign-in run in the platform. Your
                code lays out and styles what the hooks return. Card fields and the
                contact form are platform components you position with{" "}
                <code>slots</code>; you cannot replace or read them. Start from the
                Cupertino files; Studio previews each view with sample data.
              </p>
            </div>
          </section>

          {/* 8. BEST PRACTICES */}
          <section className="pb-8">
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-2 mb-4 flex items-center gap-2">
              <span className="text-indigo-500">8.</span> Developer Best
              Practices
            </h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="text-white block mb-1">
                    Always Provide Fallback Data
                  </strong>
                  <p className="text-zinc-400">
                    If you build a Gallery or Testimonial section that expects
                    an array of images/data, always write a fallback array in
                    your code. If the user hasn't uploaded images yet, your
                    section should still look stunning with dummy data in the
                    preview.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="text-white block mb-1">
                    Respect isPreview
                  </strong>
                  <p className="text-zinc-400">
                    Do not trigger{" "}
                    <code className="text-white bg-zinc-800 px-1 rounded">
                      window.scrollTo
                    </code>{" "}
                    or complex external redirects if{" "}
                    <code className="text-white bg-zinc-800 px-1 rounded">
                      isPreview
                    </code>{" "}
                    is true. Let the user edit in peace.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="text-white block mb-1">
                    Keep it Pure
                  </strong>
                  <p className="text-zinc-400">
                    Your component should rely entirely on{" "}
                    <code className="text-white bg-zinc-800 px-1 rounded">
                      data
                    </code>{" "}
                    and local{" "}
                    <code className="text-white bg-zinc-800 px-1 rounded">
                      useState
                    </code>
                    . Do not attempt to query external APIs or access global
                    browser states outside of the provided SDK.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
