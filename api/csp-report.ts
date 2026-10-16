// Receives CSP violation reports (report-only phase) and writes them to the Vercel function log.
export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method !== "POST") return new Response(null, { status: 405 });
  try {
    const text = (await req.text()).slice(0, 4000);
    console.warn("[csp-report]", text);
  } catch {
    // Reports are best effort.
  }
  return new Response(null, { status: 204 });
}
