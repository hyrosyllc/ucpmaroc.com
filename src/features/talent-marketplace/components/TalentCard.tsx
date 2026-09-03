// In src/components/TalentCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { getMarketplaceServiceDefinitions } from '@/features/talent-marketplace/serviceCatalog';

interface Actor {
  slug: string;
  HeadshotURL: string | null;
  ActorName: string;
  bio: string | null;
  service_voiceover?: boolean;
  service_scriptwriting?: boolean;
  service_videoediting?: boolean;
  [key: string]: any;
}

interface TalentCardProps {
  actor: Actor;
}

const TalentCard: React.FC<TalentCardProps> = ({ actor }) => {
  const { slug, HeadshotURL, ActorName, bio } = actor;
  const initials = ActorName?.split(' ').map((n) => n[0]).join('') || '?';
  const visibleServices = getMarketplaceServiceDefinitions(actor)
    .filter((service) => service.enabled)
    .slice(0, 4);

  return (
    <Link
      to={`/actor/${slug}`}
      className='group block rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl aspect-[3/4] relative'
    >
      {HeadshotURL ? (
        <img
          src={HeadshotURL}
          alt={ActorName}
          className='absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110'
        />
      ) : (
        <div className='absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center'>
          <span className='text-7xl font-bold text-slate-700'>{initials}</span>
        </div>
      )}

      <div className='absolute inset-0 w-full h-full bg-gradient-to-t from-black/80 via-black/40 to-transparent' />

      <div className='absolute bottom-0 left-0 right-0 p-5 text-white flex flex-col justify-end h-full'>
        <h3 className='text-2xl font-bold mb-1'>{ActorName}</h3>

        {bio && (
          <p className='text-sm text-white/80 font-light line-clamp-2 mb-3'>
            {bio}
          </p>
        )}

        <div className='flex flex-wrap gap-2'>
          {visibleServices.map((service) => (
            <Badge key={service.id} variant='secondary'>
              {service.shortLabel}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
};

export default TalentCard;