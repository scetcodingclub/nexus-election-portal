
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

    // If clicking the same star that is currently a half-star rating
    if (rating === clickedStarValue - 0.5) {
      onRatingChange(clickedStarValue); // Upgrade to full star
    } 
    // If the star is already full, clicking it again will reset it to a half star
    else if (rating === clickedStarValue) {
      onRatingChange(clickedStarValue - 0.5);
    }
    // Otherwise, it's a new click, so set to a half star
    else {
      onRatingChange(clickedStarValue - 0.5);
    }
  };
  
  return (
    <div className="flex items-center" onMouseLeave={() => !disabled && setHoverRating(0)}>
      {[...Array(starCount)].map((_, index) => {
        const starValue = index + 1;
        // Use the actual rating for display, hover is disabled to simplify interaction
        const displayRating = rating; 
        
        const isFull = displayRating >= starValue;
        const isHalf = displayRating === starValue - 0.5;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => !disabled && setHoverRating(starValue)}
            disabled={disabled}
            className={cn(
              "p-1 transition-transform duration-200 focus:outline-none focus:ring-0",
              !disabled && "hover:scale-125"
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
