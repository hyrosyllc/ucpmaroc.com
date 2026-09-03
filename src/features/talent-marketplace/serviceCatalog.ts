import {
  AudioLines,
  Briefcase,
  CalendarRange,
  GraduationCap,
  HeartPulse,
  Home,
  Mic,
  Palette,
  PackageCheck,
  PencilLine,
  Truck,
  Video,
  Wrench,
} from 'lucide-react';
import { supabase } from '@/supabaseClient';

export type MarketplaceServiceId =
  | 'voice_over'
  | 'scriptwriting'
  | 'video_editing'
  | 'delivery'
  | 'transportation'
  | 'tutoring'
  | 'home_services'
  | 'wellness'
  | 'repair'
  | 'events'
  | 'marketing'
  | 'design';

export interface MarketplaceServiceDefinition {
  id: MarketplaceServiceId;
  label: string;
  shortLabel: string;
  description: string;
  defaultEnabled: boolean;
  toggleField?: string;
  quoteOnly?: boolean;
  pricingHint?: string;
}

export const MARKETPLACE_SERVICE_CATALOG: MarketplaceServiceDefinition[] = [
  {
    id: 'voice_over',
    label: 'Voice Over',
    shortLabel: 'Voice',
    description: 'Professional narration, ads, podcast reads and brand audio.',
    defaultEnabled: true,
    toggleField: 'service_voiceover',
    pricingHint: 'MAD / word',
  },
  {
    id: 'scriptwriting',
    label: 'Script Writing',
    shortLabel: 'Script',
    description: 'Commercial scripts, explainers, and content writing for brands.',
    defaultEnabled: false,
    toggleField: 'service_scriptwriting',
    quoteOnly: true,
    pricingHint: 'Quote-based',
  },
  {
    id: 'video_editing',
    label: 'Video Editing',
    shortLabel: 'Video',
    description: 'Short-form edits, social videos, and branded montages.',
    defaultEnabled: false,
    toggleField: 'service_videoediting',
    quoteOnly: true,
    pricingHint: 'Quote-based',
  },
  {
    id: 'delivery',
    label: 'Delivery & Logistics',
    shortLabel: 'Delivery',
    description: 'Courier support, last-mile coordination, and local fulfillment.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'Quote-based',
  },
  {
    id: 'transportation',
    label: 'Transportation',
    shortLabel: 'Transport',
    description: 'Rides, route coordination, pickups, and on-demand mobility help.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'By route or time',
  },
  {
    id: 'tutoring',
    label: 'Tutoring & Lessons',
    shortLabel: 'Tutoring',
    description: 'Academic support, language coaching, and private instruction.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'By session',
  },
  {
    id: 'home_services',
    label: 'Home Services',
    shortLabel: 'Home',
    description: 'Cleaning, repairs, setup, maintenance and local helper tasks.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'By task or visit',
  },
  {
    id: 'wellness',
    label: 'Wellness & Personal Care',
    shortLabel: 'Wellness',
    description: 'Fitness sessions, personal care appointments and support.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'By session',
  },
  {
    id: 'repair',
    label: 'Repair & Setup',
    shortLabel: 'Repair',
    description: 'Electronics, appliances, devices, office or home equipment fixes.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'Quote-based',
  },
  {
    id: 'events',
    label: 'Events & Hosting',
    shortLabel: 'Events',
    description: 'Event support, staffing, setup and coordination for in-person needs.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'Quote-based',
  },
  {
    id: 'marketing',
    label: 'Marketing & Growth',
    shortLabel: 'Marketing',
    description: 'Campaign support, social strategy, funnel setup and outreach.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'Monthly or project',
  },
  {
    id: 'design',
    label: 'Design & Creative',
    shortLabel: 'Design',
    description: 'Branding, visual systems, landing pages and content design.',
    defaultEnabled: false,
    quoteOnly: true,
    pricingHint: 'Quote-based',
  },
];

export const MARKETPLACE_ALLOWLIST_STORAGE_KEY = 'ucp_marketplace_allowlist';

export const getMarketplaceAllowedServiceIds = (): MarketplaceServiceId[] => {
  const allIds = MARKETPLACE_SERVICE_CATALOG.map((service) => service.id);

  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(MARKETPLACE_ALLOWLIST_STORAGE_KEY) : null;
    if (!raw) return allIds;

    const parsed = JSON.parse(raw) as string[];
    const validIds = parsed.filter((id): id is MarketplaceServiceId => allIds.includes(id as MarketplaceServiceId));
    return validIds;
  } catch {
    return allIds;
  }
};

export const setMarketplaceAllowedServiceIds = (allowedIds: MarketplaceServiceId[]) => {
  const allIds = MARKETPLACE_SERVICE_CATALOG.map((service) => service.id);
  const sanitised = [...new Set(allowedIds.filter((id) => allIds.includes(id)))];

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MARKETPLACE_ALLOWLIST_STORAGE_KEY, JSON.stringify(sanitised));
    }
  } catch {
    // ignore localStorage failures gracefully
  }

  return sanitised;
};

export const loadMarketplaceAllowedServiceIds = async (): Promise<MarketplaceServiceId[]> => {
  const fallback = getMarketplaceAllowedServiceIds();
  const { data, error } = await supabase
    .from('marketplace_settings')
    .select('allowed_service_ids')
    .eq('id', true)
    .maybeSingle();

  if (error || !data?.allowed_service_ids) return fallback;

  const allowedIds = setMarketplaceAllowedServiceIds(data.allowed_service_ids as MarketplaceServiceId[]);
  return allowedIds;
};

export const saveMarketplaceAllowedServiceIds = async (allowedIds: MarketplaceServiceId[]) => {
  const sanitised = setMarketplaceAllowedServiceIds(allowedIds);
  const { error } = await supabase
    .from('marketplace_settings')
    .update({ allowed_service_ids: sanitised, updated_at: new Date().toISOString() })
    .eq('id', true);

  if (error) throw error;
  return sanitised;
};

export const resetMarketplaceAllowedServiceIds = () => {
  const allIds = MARKETPLACE_SERVICE_CATALOG.map((service) => service.id);
  setMarketplaceAllowedServiceIds(allIds);
  return allIds;
};

export const getMarketplaceServiceDefinitions = (
  actor?: Record<string, any> | null,
  allowedIds: MarketplaceServiceId[] = getMarketplaceAllowedServiceIds()
) => {
  return MARKETPLACE_SERVICE_CATALOG.filter((service) => allowedIds.includes(service.id)).map((service) => {
    const toggleField = service.toggleField || `service_${service.id}`;
    const normalizedService = actor?.actor_services?.find((item: { service_id: string }) => item.service_id === service.id);
    const enabled =
      service.id === 'voice_over'
        ? actor?.service_voiceover ?? service.defaultEnabled
        : Boolean(normalizedService?.enabled ?? actor?.[toggleField] ?? service.defaultEnabled);

    return {
      ...service,
      enabled,
      toggleField,
    };
  });
};

export const getServiceLabel = (serviceId: string) => {
  return (
    MARKETPLACE_SERVICE_CATALOG.find((service) => service.id === serviceId)?.label ||
    serviceId.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  );
};

export const getServiceIcon = (serviceId: string) => {
  const iconMap: Record<string, any> = {
    voice_over: Mic,
    scriptwriting: PencilLine,
    video_editing: Video,
    delivery: PackageCheck,
    transportation: Truck,
    tutoring: GraduationCap,
    home_services: Home,
    wellness: HeartPulse,
    repair: Wrench,
    events: CalendarRange,
    marketing: Briefcase,
    design: Palette,
  };

  return iconMap[serviceId] || AudioLines;
};
