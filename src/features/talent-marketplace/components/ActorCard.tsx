import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Heart, Users, Repeat, DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// A more detailed interface for the data this card now needs
export interface Actor {
  id: string;
  slug: string | null;
  ActorName: string;
  Gender: string;
  Language: string;
  HeadshotURL: string;
  MainDemoURL: string;
  actor_followers: { count: number }[];
  demo_likes: { count: number }[];
  revisions_allowed: number;
  BaseRate_per_Word: number;
  IsActive: boolean;
}

interface ActorCardProps {
  actor: Actor;
  onPlayClick: (actor: Actor) => void;
  isCurrentlyPlaying: boolean;
}

const ActorCard: React.FC<ActorCardProps> = ({ actor, onPlayClick, isCurrentlyPlaying }) => {
  const handlePlayButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the Link from navigating
    e.preventDefault();
    onPlayClick(actor);
  };

  return (
    <Link
      to={`/actor/${actor.slug}`}
      className="group relative bg-card/50 p-4 rounded-lg hover:bg-accent/50 transition-colors duration-300 block flex flex-col h-full"
    >
      {/* Image & Play Button */}
      <div className="relative mb-4">
        <Avatar className="w-full h-auto aspect-square rounded-md">
        <AvatarImage 
          src={actor.HeadshotURL} 
          alt={actor.ActorName} 
          className="object-cover"
        />
        <AvatarFallback className="text-3xl">
          {/* This creates the initials, e.g., "HK" */}
          {actor.ActorName?.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
        <button
          onClick={handlePlayButtonClick}
          className={`absolute bottom-2 right-2 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center
                      shadow-lg opacity-0 group-hover:opacity-100 group-hover:bottom-4 transition-all duration-300
                      ${isCurrentlyPlaying ? 'opacity-100 bottom-4' : ''}`}
        >
          {isCurrentlyPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>
      </div>
      
      {/* Name - This div will grow, pushing stats to the bottom */}
      <div className="flex-grow">
        {/* THIS IS THE FIX: text-white -> text-foreground */}
        <h3 className="font-bold text-foreground truncate text-lg">{actor.ActorName}</h3>
      </div>

      {/* Stats Section - This part was already correct */}
      <div className="mt-2 pt-3 border-t space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" title={`${actor.demo_likes[0]?.count || 0} Likes`}>
              <Heart size={12} className="text-pink-400"/>
              <span>{actor.demo_likes[0]?.count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5" title={`${actor.actor_followers[0]?.count || 0} Followers`}>
              <Users size={12} className="text-blue-400"/>
              <span>{actor.actor_followers[0]?.count || 0}</span>
            </div>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" title={`From ${actor.BaseRate_per_Word} MAD/word`}>
              <DollarSign size={12} className="text-green-400"/>
              <span>From {actor.BaseRate_per_Word} MAD/word</span>
            </div>
            <div className="flex items-center gap-1.5" title={`${actor.revisions_allowed} Revisions`}>
              <Repeat size={12} className="text-yellow-400"/>
              <span>{actor.revisions_allowed} Revisions</span>
            </div>
        </div>
      </div>
    </Link>
  );
};

export default ActorCard;