import { CompanyRating } from '../types';

/**
 * Calculate the average rating from the three category scores
 * Returns a number with exactly 1 decimal place
 */
export function calculateAverageRating(rating: Pick<CompanyRating, 'benefits' | 'environment' | 'leadership'>): number {
  const sum = rating.benefits + rating.environment + rating.leadership;
  const average = sum / 3;
  // Round to 1 decimal place
  return Math.round(average * 10) / 10;
}

/**
 * Format a rating average for display (always 1 decimal place)
 */
export function formatRatingDisplay(average: number): string {
  return average.toFixed(1);
}

/**
 * Get the rating color class based on the average value
 */
export function getRatingColor(average: number): {
  bg: string;
  text: string;
} {
  if (average >= 4.0) {
    return { bg: 'bg-green-100', text: 'text-green-700' };
  }
  if (average >= 3.0) {
    return { bg: 'bg-amber-100', text: 'text-amber-700' };
  }
  return { bg: 'bg-red-100', text: 'text-red-700' };
}

/**
 * Validate rating value is between 1 and 5
 */
export function isValidRatingValue(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * Generate a unique key for tracking user ratings per company
 * For anonymous: companyId + nickname
 * For authenticated: companyId + userId
 */
export function getRatingKey(companyId: string, userId?: string, nickname?: string): string {
  const identifier = userId || nickname;
  return `${companyId}:${identifier || 'anonymous'}`;
}
