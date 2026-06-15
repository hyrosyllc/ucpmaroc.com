// In src/components/TalentCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Define the shape of the Actor data this card needs
// This is based on your 'actors_rows (1).csv' file
interface Actor {
  slug: string;
  HeadshotURL: string | null;
  ActorName: string;
  bio: string | null;
  service_scriptwriting: boolean;
  service_videoediting: boolean;
  // We'll assume all actors offer Voice Over by default
}

interface TalentCardProps {
  actor: Actor;
}

const TalentCard: React.FC<TalentCardProps> = ({ actor }) => {
  const { 
    slug, 
    HeadshotURL, 
    ActorName, 
    bio, 
    service_scriptwriting, 
    service_videoediting 
  } = actor;

  // Get initials for fallback
  const initials = ActorName?.split(' ').map(n => n[0]).join('') || '?';

  return (
    <Link 
      to={`/actor/${slug}`} 
      className="group block rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl aspect-[3/4] relative"
    >
      {/* Background Image (if it exists) */}
      {HeadshotURL ? (
        <img
          src={HeadshotURL}
          alt={ActorName}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      ) : (
        // Fallback for missing Headshot
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
          <span className="text-7xl font-bold text-slate-700">{initials}</span>
        </div>
      )}

      {/* Scrim (Gradient Overlay) */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 text-white flex flex-col justify-end h-full">
        <h3 className="text-2xl font-bold mb-1">{ActorName}</h3>
        
        {bio && (
          <p className="text-sm text-white/80 font-light line-clamp-2 mb-3">
            {bio}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Voice Over</Badge>
          {service_scriptwriting && (
            <Badge variant="secondary">Scriptwriting</Badge>
          )}
          {service_videoediting && (
            <Badge variant="secondary">Video Editing</Badge>
          )}
          {/* Your "Pro Member" badge can be added here later */}
        </div>
      </div>
    </Link>
  );
};

export default TalentCard;