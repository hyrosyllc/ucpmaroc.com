import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Plus, Settings2 } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { ActorDashboardContextType } from '@/layouts/ActorDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMarketplaceAllowedServiceIds, loadMarketplaceAllowedServiceIds, MARKETPLACE_SERVICE_CATALOG, getServiceIcon, type MarketplaceServiceId } from '@/features/talent-marketplace/serviceCatalog';
import { getServiceWorkspacePath } from './serviceRegistry';
import type { ServiceListingSummary } from './types';

const statusLabels = {
	draft: 'Draft',
	pending_review: 'In review',
	approved: 'Published',
	rejected: 'Changes requested',
	archived: 'Archived',
} as const;

const ServicesHubPage: React.FC = () => {
	const { actorData } = useOutletContext<ActorDashboardContextType>();
	const [listings, setListings] = useState<ServiceListingSummary[]>([]);
	const [allowedIds, setAllowedIds] = useState<MarketplaceServiceId[]>(getMarketplaceAllowedServiceIds());
	const [newServiceId, setNewServiceId] = useState<MarketplaceServiceId | ''>('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');

	const availableServices = useMemo(
		() => MARKETPLACE_SERVICE_CATALOG.filter((service) => allowedIds.includes(service.id)),
		[allowedIds],
	);
	const availableToApply = availableServices.filter((service) => !listings.some((listing) => listing.service_id === service.id));

	const fetchServices = useCallback(async () => {
		if (!actorData.id) return;
		setLoading(true);
		const [allowed, result] = await Promise.all([
			loadMarketplaceAllowedServiceIds(),
			supabase.from('actor_services').select('id, service_id, title, enabled, status, review_note').eq('actor_id', actorData.id).neq('status', 'archived').order('created_at', { ascending: true }),
		]);
		setAllowedIds(allowed);
		if (result.error) setMessage(`Could not load services: ${result.error.message}`);
		else setListings((result.data || []) as ServiceListingSummary[]);
		setLoading(false);
	}, [actorData.id]);

	useEffect(() => { fetchServices(); }, [fetchServices]);

	const applyForService = async () => {
		if (!actorData.id || !newServiceId) return;
		const service = MARKETPLACE_SERVICE_CATALOG.find((item) => item.id === newServiceId);
		if (!service) return;
		setSaving(true);
		const { error } = await supabase.from('actor_services').insert({
			actor_id: actorData.id,
			service_id: service.id,
			title: service.label,
			description: service.description,
			enabled: false,
			status: 'draft',
			offers: [],
			media_urls: [],
			media_assets: [],
			audio_urls: [],
		});
		if (error) setMessage(`Could not apply for service: ${error.message}`);
		else { setNewServiceId(''); setMessage(`${service.label} added as a draft.`); await fetchServices(); }
		setSaving(false);
	};

	if (loading) return <div className='p-8 text-center text-muted-foreground'>Loading marketplace services...</div>;

	return <div className='mx-auto w-full max-w-6xl px-4 pb-16 pt-8 md:px-8'>
		<div className='mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
			<div><p className='mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary'>Marketplace workspace</p><h1 className='text-4xl font-black tracking-tight'>Services</h1><p className='mt-2 max-w-2xl text-muted-foreground'>Activate your marketplace services, apply for new categories, and manage each offer in its own workspace.</p></div>
			<div className='flex items-center gap-2'><Select value={newServiceId} onValueChange={(value) => setNewServiceId(value as MarketplaceServiceId)}><SelectTrigger className='w-56'><SelectValue placeholder='Apply for a service' /></SelectTrigger><SelectContent>{availableToApply.map((service) => <SelectItem key={service.id} value={service.id}>{service.label}</SelectItem>)}</SelectContent></Select><Button onClick={applyForService} disabled={!newServiceId || saving} className='gap-2'><Plus className='h-4 w-4' /> Apply</Button></div>
		</div>
		{message && <div className='mb-6 rounded-xl border border-primary/20 bg-primary/5 p-3 text-center text-sm font-medium'>{message}</div>}
		<div className='mb-8 grid gap-4 sm:grid-cols-3'><Card><CardContent className='p-5'><p className='text-sm text-muted-foreground'>Configured services</p><p className='mt-2 text-3xl font-black'>{listings.length}</p></CardContent></Card><Card><CardContent className='p-5'><p className='text-sm text-muted-foreground'>Published</p><p className='mt-2 text-3xl font-black'>{listings.filter((listing) => listing.status === 'approved' && listing.enabled).length}</p></CardContent></Card><Card><CardContent className='p-5'><p className='text-sm text-muted-foreground'>In review</p><p className='mt-2 text-3xl font-black'>{listings.filter((listing) => listing.status === 'pending_review').length}</p></CardContent></Card></div>
		<section><div className='mb-4 flex items-center justify-between'><div><h2 className='text-2xl font-bold'>Your marketplace services</h2><p className='text-sm text-muted-foreground'>Each service can grow its own workflow while remaining connected to the shared marketplace.</p></div><Button variant='outline' asChild><Link to='/market'>View marketplace <ArrowRight className='ml-2 h-4 w-4' /></Link></Button></div>
			{listings.length === 0 ? <Card className='border-dashed'><CardContent className='flex flex-col items-center gap-3 p-12 text-center'><Settings2 className='h-10 w-10 text-primary' /><h3 className='text-xl font-bold'>No services configured</h3><p className='max-w-md text-muted-foreground'>Apply for a marketplace category to create your first service workspace.</p></CardContent></Card> : <div className='grid gap-4 md:grid-cols-2'>{listings.map((listing) => { const service = MARKETPLACE_SERVICE_CATALOG.find((item) => item.id === listing.service_id); const Icon = getServiceIcon(listing.service_id); return <Card key={listing.id}><CardHeader><div className='flex items-start justify-between gap-3'><div className='flex items-center gap-3'><div className='rounded-lg bg-primary/10 p-2'><Icon className='h-5 w-5 text-primary' /></div><div><CardTitle>{listing.title || service?.label || listing.service_id}</CardTitle><CardDescription>{service?.description}</CardDescription></div></div>{listing.status === 'approved' ? <CheckCircle2 className='h-5 w-5 text-emerald-600' /> : <Clock3 className='h-5 w-5 text-muted-foreground' />}</div></CardHeader><CardContent className='flex items-center justify-between gap-3'><span className='text-sm font-medium text-muted-foreground'>{statusLabels[listing.status]}{listing.status === 'approved' ? ` · ${listing.enabled ? 'Visible in market' : 'Hidden'}` : ''}</span><Button asChild><Link to={getServiceWorkspacePath(listing.service_id)}>Manage <ArrowRight className='ml-2 h-4 w-4' /></Link></Button></CardContent></Card>; })}</div>}
		</section>
	</div>;
};

export default ServicesHubPage;
