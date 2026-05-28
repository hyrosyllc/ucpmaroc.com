// src/themes/modern-bright/lib/utils.ts

/**
 * Extracts the YouTube video ID from a URL.
 * @param url The YouTube URL.
 * @returns The video ID or null if not found.
 */
export const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

/**
 * Checks if the current site is running on a custom domain.
 * It reads the main domains from an environment variable VITE_MAIN_DOMAINS,
 * which should be a comma-separated string.
 * @returns True if the hostname is not one of the main domains.
 */
export const isCustomDomain = (): boolean => {
  // Default domains for development and the primary production domain.
  // VITE_MAIN_DOMAINS should be a comma-separated string in your .env file.
  // e.g., VITE_MAIN_DOMAINS=ucpmaroc.com,www.ucpmaroc.com,symmetrical-acorn-....app.github.dev
  const defaultDomains = "localhost,127.0.0.1,ucpmaroc.com,www.ucpmaroc.com";
  const mainDomainsStr = import.meta.env.VITE_MAIN_DOMAINS || defaultDomains;
  
  const mainDomains = mainDomainsStr.split(',').map(d => d.trim()).filter(Boolean);
  const currentHostname = window.location.hostname;

  return !mainDomains.some((domain) => currentHostname.includes(domain));
};