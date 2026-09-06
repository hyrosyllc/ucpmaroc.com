import React from 'react';
import { useParams } from 'react-router-dom';
import { MARKETPLACE_SERVICE_CATALOG, type MarketplaceServiceId } from '@/features/talent-marketplace/serviceCatalog';
import DashboardServices from '../DashboardServices';
import type { ServiceWorkspaceProps } from './types';

const ServiceWorkspacePage: React.FC<ServiceWorkspaceProps> = ({ initialServiceId }) => {
	const { serviceId } = useParams<{ serviceId: MarketplaceServiceId }>();
	const resolvedServiceId = initialServiceId || serviceId;
	const isKnownService = MARKETPLACE_SERVICE_CATALOG.some((service) => service.id === resolvedServiceId);

	return <DashboardServices initialServiceId={isKnownService ? resolvedServiceId : undefined} />;
};

export default ServiceWorkspacePage;
