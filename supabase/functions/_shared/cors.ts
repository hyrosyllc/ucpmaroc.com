// CORS headers for all edge functions.
// Uses wildcard (*) for origin to allow requests from any origin calling from browser.
// For production, add specific origin validation if needed.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
