// Type definitions for the Company Review application

// Company model
export interface Company {
  id: string;
  name: string;
  logo: string; // URL or base64
  slug: string;
  description?: string;
  industry?: string;
  location?: string;
  averageRating: number; // Computed average of all ratings, 1 decimal
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Rating categories (1-5 scale)
export interface CompanyRating {
  id: string;
  companyId: string;
  userId?: string; // null for anonymous
  nickname?: string; // Required for anonymous users
  benefits: number; // 1-5
  environment: number; // 1-5
  leadership: number; // 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// Computed view of rating with average
export interface RatingWithAverage extends CompanyRating {
  average: number; // (benefits + environment + leadership) / 3, rounded to 1 decimal
}

// User model
export interface User {
  id: string;
  email: string;
  nickname: string;
  isAuthenticated: boolean;
}

// Form data for submitting a rating
export interface RatingFormData {
  benefits: number;
  environment: number;
  leadership: number;
  comment: string;
  nickname?: string; // For anonymous users
}

// Validation
export const MIN_COMMENT_LENGTH = 20;

// Rating category labels
export const RATING_CATEGORIES = {
  benefits: 'Phúc lợi công ty',
  environment: 'Môi trường công ty',
  leadership: 'Ban lãnh đạo'
} as const;

// Rating color thresholds
export const RATING_COLORS = {
  high: { bg: 'bg-green-100', text: 'text-green-700', min: 4.0 },
  medium: { bg: 'bg-amber-100', text: 'text-amber-700', min: 3.0 },
  low: { bg: 'bg-red-100', text: 'text-red-700', min: 0 }
} as const;
