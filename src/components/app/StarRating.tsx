
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
    const currentClickedValue = index + 1;
    // If clicking the same star that is already selected, toggle between half and full
    if (rating === currentClickedValue) {
      onRatingChange(currentClickedValue - 0.5);
    } else if (rating === currentClickedValue - 0.5) {
      onRatingChange(currentClickedValue);
    } else {
      onRatingChange(currentClickedValue);
    }
  };

  return (
    <div className="flex items-center" onMouseLeave={() => !disabled && setHoverRating(0)}>
      {[...Array(starCount)].map((_, index) => {
        const starValue = index + 1;
        const displayRating = hoverRating || rating;
        
        let isFull = displayRating >= starValue;
        let isHalf = displayRating >= starValue - 0.5 && displayRating < starValue;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(index)}
            onMouseEnter={() => !disabled && setHoverRating(starValue)}
            disabled={disabled}
            className={cn(
              "p-1 transition-transform duration-200",
              !disabled && "hover:scale-125 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
            )}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <div className="relative">
              <Star 
                className={cn(
                  "w-8 h-8 text-yellow-400 transition-colors",
                  (isFull || isHalf) ? 'fill-current' : 'text-gray-300'
                )} 
              />
              {isHalf && (
                <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                   <Star className="w-8 h-8 text-yellow-400 fill-current" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
