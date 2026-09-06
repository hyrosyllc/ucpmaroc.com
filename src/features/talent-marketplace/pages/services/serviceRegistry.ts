import type { ComponentType } from 'react';
import type { MarketplaceServiceId } from '@/features/talent-marketplace/serviceCatalog';
import VoiceOverServicePage from './VoiceOverServicePage';
import ScriptwritingServicePage from './ScriptwritingServicePage';
import VideoEditingServicePage from './VideoEditingServicePage';
import DeliveryServicePage from './DeliveryServicePage';

export interface ServiceRegistryEntry {
	id: MarketplaceServiceId;
	workspace: ComponentType;
	path: string;
}

export const SERVICE_WORKSPACES: ServiceRegistryEntry[] = [
	{ id: 'voice_over', workspace: VoiceOverServicePage, path: '/dashboard/services/voice-over' },
	{ id: 'scriptwriting', workspace: ScriptwritingServicePage, path: '/dashboard/services/scriptwriting' },
	{ id: 'video_editing', workspace: VideoEditingServicePage, path: '/dashboard/services/video-editing' },
	{ id: 'delivery', workspace: DeliveryServicePage, path: '/dashboard/services/delivery' },
];

export const getServiceWorkspace = (serviceId: MarketplaceServiceId) =>
	SERVICE_WORKSPACES.find((service) => service.id === serviceId)?.workspace;

export const getServiceWorkspacePath = (serviceId: MarketplaceServiceId) =>
	SERVICE_WORKSPACES.find((service) => service.id === serviceId)?.path || `/dashboard/services/${serviceId}`;
