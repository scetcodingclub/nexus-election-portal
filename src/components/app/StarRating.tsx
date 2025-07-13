
"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
  starCount?: number;
}

const StarRating = ({ 
  rating, 
  onRatingChange, 
  disabled = false,
  starCount = 5 
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (index: number) => {
    if (disabled) return;
    const clickedStarValue = index + 1;

    // If clicking the same star that represents the current half-star rating
    if (rating === clickedStarValue - 0.5) {
      onRatingChange(clickedStarValue); // Upgrade to full star
    } 
    // If clicking a star that is already fully selected (or any other case)
    else {
      onRatingChange(clickedStarValue - 0.5); // Default to half star on first/new click
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isOverHalf = (e.clientX - rect.left) > rect.width / 2;
    setHoverRating(index + (isOverHalf ? 1 : 0.5));
  };


  return (
    <div className="flex items-center" onMouseLeave={() => !disabled && setHoverRating(0)}>
      {[...Array(starCount)].map((_, index) => {
        const starValue = index + 1;
        const displayRating = hoverRating || rating;
        
        const isFull = displayRating >= starValue;
        const isHalf = displayRating === starValue - 0.5;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => !disabled && setHoverRating(starValue - 0.5)}
            onMouseMove={(e) => handleMouseMove(e, index)}
            disabled={disabled}
            className={cn(
              "p-1 transition-transform duration-200",
              !disabled && "hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
            )}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <div className="relative w-8 h-8">
              {/* Background empty star */}
              <Star className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              {/* Foreground filled star (potentially clipped) */}
              <div
                className={cn(
                  "absolute top-0 left-0 h-full overflow-hidden",
                  isFull ? "w-full" : isHalf ? "w-1/2" : "w-0"
                )}
              >
                <Star className="w-8 h-8 text-yellow-400 fill-current" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
