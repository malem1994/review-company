import React from 'react';
import { RATING_CATEGORIES } from '../../types';

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const starSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6'
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showLabel = true
}) => {
  const stars = [1, 2, 3, 4, 5];

  const getStarColor = (starValue: number): string => {
    if (starValue <= value) {
      return 'text-yellow-400 fill-current';
    }
    return 'text-gray-300';
  };

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={readonly}
          className={`
            ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            transition-transform duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded
          `}
          aria-label={`Rate ${star} out of 5 stars`}
          aria-pressed={value === star}
        >
          <svg
            className={`${starSizes[size]} ${getStarColor(star)}`}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      {showLabel && onChange && (
        <span className="ml-2 text-sm font-medium text-gray-700">{value}/5</span>
      )}
      {readonly && showLabel && (
        <span className="ml-2 text-sm font-medium text-gray-600">{value.toFixed(1)}</span>
      )}
    </div>
  );
};

interface CategoryRatingProps {
  category: keyof typeof RATING_CATEGORIES;
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export const CategoryRating: React.FC<CategoryRatingProps> = ({
  category,
  value,
  onChange,
  readonly = false
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700">
        {RATING_CATEGORIES[category]}
      </span>
      <RatingStars
        value={value}
        onChange={onChange}
        readonly={readonly}
        size="sm"
        showLabel={!readonly}
      />
    </div>
  );
};
