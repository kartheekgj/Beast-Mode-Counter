import React from 'react';
import { Dumbbell, Flame, Zap, Heart, Footprints, Shield, TrendingUp } from 'lucide-react';

interface ExerciseIconProps {
  name: string;
  className?: string;
}

export default function ExerciseIcon({ name, className = "h-5 w-5" }: ExerciseIconProps) {
  switch (name) {
    case 'dumbbell':
      return <Dumbbell className={className} id={`icon-db-${name}`} />;
    case 'flame':
      return <Flame className={className} id={`icon-flame-${name}`} />;
    case 'zap':
      return <Zap className={className} id={`icon-zap-${name}`} />;
    case 'heart':
      return <Heart className={className} id={`icon-heart-${name}`} />;
    case 'footprints':
      return <Footprints className={className} id={`icon-foot-${name}`} />;
    case 'shield':
      return <Shield className={className} id={`icon-shield-${name}`} />;
    case 'trending-up':
      return <TrendingUp className={className} id={`icon-trend-${name}`} />;
    default:
      return <Dumbbell className={className} id={`icon-default-${name}`} />;
  }
}

export const EXERCISE_ICONS = [
  { id: 'dumbbell', label: 'Dumbbell (Weights)', icon: Dumbbell },
  { id: 'flame', label: 'Flame (HIIT/Burpees)', icon: Flame },
  { id: 'zap', label: 'Zap (Cardio/Speed)', icon: Zap },
  { id: 'heart', label: 'Heart (Cardio/BPM)', icon: Heart },
  { id: 'footprints', label: 'Footprints (Run/Speed)', icon: Footprints },
  { id: 'shield', label: 'Shield (Core/Plank)', icon: Shield },
  { id: 'trending-up', label: 'Trend (Progress/Scale)', icon: TrendingUp },
];
