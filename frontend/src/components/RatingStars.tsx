import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function RatingStars({ 
  rating, 
  size = 'md', 
  interactive = false,
  onChange 
}: RatingStarsProps) {
  const starSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const renderStar = (index: number) => {
    const StarComponent = index < rating ? StarSolidIcon : StarOutlineIcon;
    return (
      <button
        key={index}
        onClick={() => interactive && onChange?.(index + 1)}
        className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!interactive}
      >
        <StarComponent 
          className={`${starSizes[size]} ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
        />
      </button>
    );
  };

  return (
    <div className="flex space-x-1">
      {[...Array(5)].map((_, index) => renderStar(index))}
    </div>
  );
} 