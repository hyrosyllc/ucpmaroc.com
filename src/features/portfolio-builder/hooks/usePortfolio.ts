import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabaseClient';

interface UsePortfolioParams {
  slug?: string;
  customDomain?: string;
  enabled?: boolean; // We might want to disable fetching sometimes
}

export const usePortfolio = ({ slug, customDomain, enabled = true }: UsePortfolioParams) => {
  return useQuery({
    // The "Key" uniquely identifies this data in the cache.
    // If slug or customDomain changes, React Query refetches automatically.
    queryKey: ['portfolio', { slug, customDomain }],
    
    // The "Fetcher" function
    queryFn: async () => {
      console.log("Fetching portfolio...", { slug, customDomain });

      let query = supabase
        .from('portfolios')
        .select('*')
        .eq('is_published', true);

      if (customDomain) {
        query = query.eq('custom_domain', customDomain);
      } else if (slug) {
        query = query.eq('public_slug', slug);
      } else {
        throw new Error("No identifier provided");
      }

      const { data: portfolio, error } = await query.single();

      if (error || !portfolio) {
        throw new Error("Portfolio not found");
      }

      // Fetch Actor Data separately (or you could use a Join if configured)
      const { data: actor } = await supabase
        .from('actors')
        .select('id, ActorName, HeadshotURL, bio')
        .eq('id', portfolio.actor_id)
        .single();

      // Return both combined
      return { 
        portfolio, 
        actorProfile: actor 
      };
    },
    // Only run this query if we have an identifier AND enabled is true
    enabled: enabled && (!!slug || !!customDomain),
    // Don't refetch when window gets focus (optional, keeps UI calm)
    refetchOnWindowFocus: false 
  });
};