import React from 'react';
import { ArrowUpRight, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getServiceIcon } from '@/features/talent-marketplace/serviceCatalog';

interface ServiceOfferCardProps {
  actor: {
    slug: string;
    ActorName: string;
    HeadshotURL: string | null;
    bio?: string | null;
    Language?: string;
    actor_services?: Array<{ service_id: string; description?: string | null; rate?: number | null }>;
  };
  service: {
    id: string;
    label: string;
    shortLabel: string;
    description: string;
    pricingHint?: string;
  };
}

const ServiceOfferCard: React.FC<ServiceOfferCardProps> = ({ actor, service }) => {
  const Icon = getServiceIcon(service.id);
  const offer = actor.actor_services?.find((item) => item.service_id === service.id);
  const description = offer?.description || service.description;
  const rate = offer?.rate ? `From ${offer.rate} MAD` : service.pricingHint || 'Request a quote';
  const initials = actor.ActorName?.split(' ').map((name) => name[0]).join('').slice(0, 2) || '?';

  return (
    <article className='group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl'>
      <Link to={`/market/service/${actor.slug}/${service.id}`} className='block relative aspect-[16/10] overflow-hidden bg-muted'>
        {actor.HeadshotURL ? (
          <img src={actor.HeadshotURL} alt={actor.ActorName} className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-105' />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-primary/10 text-5xl font-black text-primary'>{initials}</div>
        )}
        <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12'>
          <Badge className='border-0 bg-white/90 text-slate-900'>{service.label}</Badge>
        </div>
      </Link>
      <div className='space-y-4 p-5'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <Link to={`/market/service/${actor.slug}/${service.id}`} className='font-bold text-foreground hover:text-primary'>{actor.ActorName}</Link>
            <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
              <MapPin className='h-3.5 w-3.5' /> {actor.Language || 'Available online'}
              <span className='text-yellow-500'>
                <Star className='inline h-3.5 w-3.5 fill-current' /> New
              </span>
            </div>
          </div>
          <Icon className='h-5 w-5 shrink-0 text-primary' />
        </div>
        <p className='line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground'>{description}</p>
        <div className='flex items-center justify-between gap-3 border-t border-border pt-4'>
          <span className='text-sm font-semibold text-foreground'>{rate}</span>
          <Button asChild size='sm' className='gap-1'>
            <Link to={`/market/service/${actor.slug}/${service.id}`}>
              View offer <ArrowUpRight className='h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ServiceOfferCard;
