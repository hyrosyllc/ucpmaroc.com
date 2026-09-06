import type { MarketplaceServiceId } from '@/features/talent-marketplace/serviceCatalog';

export type ListingStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

export interface ServiceListingSummary {
	id: string;
	service_id: MarketplaceServiceId;
	title: string | null;
	enabled: boolean;
	status: ListingStatus;
	review_note?: string | null;
}

export interface ServiceWorkspaceProps {
	initialServiceId?: MarketplaceServiceId;
}
