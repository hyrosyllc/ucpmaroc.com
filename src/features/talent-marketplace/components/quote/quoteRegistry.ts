import type { MarketplaceServiceId } from '@/features/talent-marketplace/serviceCatalog';
import type { QuoteRequirements, QuoteServiceDefinition } from './quoteTypes';

const getDescription = (requirements: QuoteRequirements) =>
  [
    requirements.projectDescription,
    requirements.estimatedDuration && `Timeline: ${requirements.estimatedDuration}`,
    requirements.estimatedWordCount > 0 && `Estimated volume: ${requirements.estimatedWordCount}`,
    requirements.scriptFormat && `Format: ${requirements.scriptFormat}`,
    requirements.targetAudience && `Audience: ${requirements.targetAudience}`,
    requirements.videoType && `Video type: ${requirements.videoType}`,
    requirements.footageChoice && `Footage: ${requirements.footageChoice}`,
  ].filter(Boolean).join('\n');

export const QUOTE_SERVICE_REGISTRY: Record<MarketplaceServiceId, QuoteServiceDefinition> = {
  voice_over: {
    serviceId: 'voice_over',
    pricingMode: 'instant',
    title: 'Voice-over project',
    description: 'Describe the script and usage rights to receive an instant estimate.',
    requiredFields: [],
    getSummary: (requirements) => [requirements.projectDescription],
  },
  scriptwriting: {
    serviceId: 'scriptwriting',
    pricingMode: 'quote_only',
    title: 'Scriptwriting brief',
    description: 'Give the writer enough context to shape the format, audience, and delivery plan.',
    requiredFields: ['projectDescription', 'scriptFormat', 'targetAudience'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  video_editing: {
    serviceId: 'video_editing',
    pricingMode: 'quote_only',
    title: 'Video editing brief',
    description: 'Share the intended format, footage situation, and expected turnaround.',
    requiredFields: ['projectDescription', 'videoType', 'footageChoice'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  delivery: {
    serviceId: 'delivery',
    pricingMode: 'quote_only',
    title: 'Delivery request',
    description: 'Describe the route, timing, package, and handling requirements.',
    requiredFields: ['projectDescription', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  transportation: {
    serviceId: 'transportation',
    pricingMode: 'quote_only',
    title: 'Transportation request',
    description: 'Describe the route, timing, and mobility requirements.',
    requiredFields: ['projectDescription', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  tutoring: {
    serviceId: 'tutoring',
    pricingMode: 'quote_only',
    title: 'Tutoring request',
    description: 'Share the subject, level, schedule, and learning goals.',
    requiredFields: ['projectDescription', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  home_services: {
    serviceId: 'home_services',
    pricingMode: 'quote_only',
    title: 'Home service request',
    description: 'Describe the task, location, urgency, and materials involved.',
    requiredFields: ['projectDescription', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  wellness: {
    serviceId: 'wellness',
    pricingMode: 'quote_only',
    title: 'Wellness request',
    description: 'Share the session goals, timing, and any relevant preferences.',
    requiredFields: ['projectDescription', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  repair: {
    serviceId: 'repair',
    pricingMode: 'quote_only',
    title: 'Repair request',
    description: 'Describe the equipment, symptoms, location, and urgency.',
    requiredFields: ['projectDescription', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  events: {
    serviceId: 'events',
    pricingMode: 'quote_only',
    title: 'Event support request',
    description: 'Share the event date, scale, location, and staffing needs.',
    requiredFields: ['projectDescription', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  marketing: {
    serviceId: 'marketing',
    pricingMode: 'quote_only',
    title: 'Marketing brief',
    description: 'Share the campaign goal, audience, channels, and expected timeline.',
    requiredFields: ['projectDescription', 'targetAudience', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
  design: {
    serviceId: 'design',
    pricingMode: 'quote_only',
    title: 'Design brief',
    description: 'Describe the deliverables, audience, references, and timeline.',
    requiredFields: ['projectDescription', 'targetAudience', 'estimatedDuration'],
    getSummary: (requirements) => [getDescription(requirements)],
  },
};

export const getQuoteServiceDefinition = (serviceId: string | null) =>
  QUOTE_SERVICE_REGISTRY[serviceId as MarketplaceServiceId] || null;
