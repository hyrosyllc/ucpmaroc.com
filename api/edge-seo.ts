// api/edge-seo.ts
import { createClient } from "@supabase/supabase-js";

// Vercel Edge configuration
export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const hostname = req.headers.get("host") || "";

  // Define your main app domains
  const MAIN_DOMAINS = [
    "ucpmaroc.com",
    "www.ucpmaroc.com",
    "localhost",
    "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
    "psychic-cod-r74vrp5xx9gq2ppr7-5173.app.github.dev",
  ];
  const isCustomDomain = !MAIN_DOMAINS.some((domain) =>
    hostname.includes(domain)
  );

  // Extract the slug (either from the custom domain, or from the URL path)
  let slug = "";
  if (isCustomDomain) {
    slug = hostname; // We will use the custom domain to look up the portfolio
  } else {
    const pathParts = url.pathname.split("/");
    // 🚀 FIX: Handle both /pro/username AND /username gracefully
    if (pathParts[1] === "pro" && pathParts[2]) {
      slug = pathParts[2];
    } else if (pathParts[1] && pathParts[1] !== "api") {
      slug = pathParts[1];
    }
  }

  // Default SEO fallback
  let seoTitle = "UCPMAROC | The Modern Portfolio Builder";
  let seoDescription =
    "Create stunning, high-converting portfolios and stores.";
  let seoImage = "https://ucpmaroc.com/default-og-image.jpg"; // Replace with your actual default image

  if (slug) {
    // Connect to Supabase directly from the Edge
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      try {
        // 🚀 FIX: Use the extracted 'slug' variable instead of the non-existent 'params.slug'
        // 🚀 FIX: Added actor_profiles(*) so Supabase actually fetches the joined table data!
        const { data: portfolio } = await supabase
          .from("portfolios")
          .select("*, actor_profiles(*)")
          .or(`public_slug.eq.${slug},id.eq.${slug}`) // Safely checks both slug and ID
          .eq("is_published", true)
          .single();

        if (portfolio) {
          seoTitle =
            portfolio.site_name ||
            portfolio.actor_profiles?.ActorName ||
            seoTitle;
          seoDescription =
            portfolio.actor_profiles?.bio ||
            `Check out the professional portfolio of ${seoTitle}.`;
          seoImage = portfolio.actor_profiles?.HeadshotURL || seoImage;

          // 🚀 NEW: Check if this is a Product Page!
          let productSlug = "";
          const pathParts = url.pathname.split("/");
          const productIndex = pathParts.indexOf("product");
          
          if (productIndex !== -1 && pathParts.length > productIndex + 1) {
            productSlug = pathParts[productIndex + 1];
          }

          if (productSlug) {
            const { data: product } = await supabase
              .from("pro_products")
              .select("title, seo_title, short_description, seo_description, description, images")
              .eq("slug", productSlug)
              .eq("actor_id", portfolio.actor_id) 
              .maybeSingle();

            if (product) {
              seoTitle = product.seo_title || product.title || seoTitle;
              seoDescription = product.seo_description || product.short_description || product.description?.substring(0, 160) || seoDescription;
              seoImage = (product.images && product.images.length > 0) ? product.images[0] : seoImage;
            }
          }
        }
      } catch (e) {
        console.error("Edge SEO Supabase Error:", e);
      }
    }
  }

  // Construct the raw HTML shell with exactly what social bots are looking for
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${seoTitle}</title>
        <meta name="description" content="${seoDescription}" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="${seoTitle}" />
        <meta property="og:description" content="${seoDescription}" />
        <meta property="og:image" content="${seoImage}" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${seoTitle}" />
        <meta name="twitter:description" content="${seoDescription}" />
        <meta name="twitter:image" content="${seoImage}" />
      </head>
      <body>
        <h1>${seoTitle}</h1>
        <p>${seoDescription}</p>
      </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400", // Cache at the Edge for 1 hour!
    },
  });
}
