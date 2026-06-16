# Company Review Website - Architecture Documentation

## Project Overview

A React TypeScript single-page application for reviewing companies in Vietnam, built with **Next.js 15 App Router**. Users can browse companies, view detailed ratings, and submit their own ratings and comments.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 15.0+ |
| React | React | 19.0+ |
| Language | TypeScript | 5.0+ |
| CSS Framework | Tailwind CSS | 4.0+ |
| State Management | Zustand | 4.5+ |
| Forms | React Hook Form | 7.50+ |
| Validation | Zod | 3.23+ |

## Project Structure

```
review-company/
├── app/
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page (client component)
│   ├── globals.css        # Global styles + Tailwind
│   └── companies/
│       └── [slug]/
│           └── page.tsx   # Dynamic company pages (reserved)
├── components/
│   ├── CompanyCard/       # Company listing card component
│   ├── CompanyDrawer/     # Company detail drawer with rating form
│   ├── RatingStars/       # Star rating input/display
│   └── UI/                # Primitive UI components (Button, Input, etc.)
├── lib/                   # Shared utilities (reserved)
├── store/                 # Zustand state stores
│   ├── companyStore.ts
│   ├── ratingStore.ts
│   └── userStore.ts
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions (rating calculations)
├── services/              # API services (mock implementation)
├── hooks/                 # Custom React hooks (reserved)
├── docs/
│   └── ARCHITECTURE.md    # This file
├── public/                # Static assets
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── package.json
└── README.md
```

## Next.js App Router

- **Server Components by default**: Components are server-rendered unless marked with `'use client'`
- **Client Components**: `app/page.tsx`, `CompanyDrawer`, and interactive components use `'use client'`
- **Layouts**: Shared UI between pages via `app/layout.tsx`
- **Metadata**: SEO metadata exported from layout

## Core Data Models

### Company
```typescript
interface Company {
  id: string;              // Unique identifier
  name: string;            // Company name
  logo: string;            // Logo URL or base64
  slug: string;            // URL-friendly identifier
  description?: string;    // Company description
  industry?: string;       // Industry category
  location?: string;       // Company location
  averageRating: number;   // Calculated average (1 decimal)
  reviewCount: number;     // Total number of reviews
  createdAt: Date;         // Creation timestamp
  updatedAt: Date;         // Last update timestamp
}
```

### CompanyRating
```typescript
interface CompanyRating {
  id: string;             // Unique rating ID
  companyId: string;      // Foreign key to company
  userId?: string;        // User ID (null for anonymous)
  nickname?: string;      // Nickname for anonymous users
  benefits: number;       // 1-5 rating for benefits
  environment: number;    // 1-5 rating for environment
  leadership: number;     // 1-5 rating for leadership
  comment: string;        // User comment
  createdAt: Date;        // Rating creation date
  updatedAt: Date;        // Rating update date
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  nickname: string;
  isAuthenticated: boolean;
}
```

## Business Logic

### Rating Calculation

The average rating is calculated as:

```
average = (benefits + environment + leadership) / 3
```

The result is **always rounded to 1 decimal place** for display:

```typescript
// utils/rating.ts
export function calculateAverageRating(rating): number {
  const sum = rating.benefits + rating.environment + rating.leadership;
  const average = sum / 3;
  return Math.round(average * 10) / 10;
}

export function formatRatingDisplay(average: number): string {
  return average.toFixed(1);
}
```

### Rating Color Scheme

Ratings are color-coded based on their value:

| Range | Color | CSS Classes |
|-------|-------|-------------|
| ≥ 4.0 | Green | `bg-green-100 text-green-700` |
| 3.0 - 3.9 | Amber | `bg-amber-100 text-amber-700` |
| < 3.0 | Red | `bg-red-100 text-red-700` |

### User Anonymity Rules

**Anonymous Users:**
- Must provide a nickname to submit ratings
- Can rate **multiple companies** with the same nickname
- Can only have **1 rating per company** (same nickname on same company = update)

**Authenticated Users:**
- Rated stored with `userId`
- Can rate **multiple different companies**
- Can only have **1 rating per company** (same user = update)

**Tracking Key Generation:**

```typescript
// For anonymous: companyId + nickname
// For authenticated: companyId + userId
export function getRatingKey(companyId: string, userId?: string, nickname?: string): string {
  const identifier = userId || nickname;
  return `${companyId}:${identifier || 'anonymous'}`;
}
```

### Comment Validation

- Minimum length: **20 characters**
- Required for all rating submissions
- Validated using Zod schema in form

```typescript
const ratingSchema = z.object({
  comment: z.string().min(MIN_COMMENT_LENGTH, `Bình luận phải có ít nhất ${MIN_COMMENT_LENGTH} ký tự`)
});
```

### Rating Submission Flow

1. User fills out rating form (3 categories + comment + optional nickname)
2. Form validation runs (Zod + react-hook-form)
3. On submit:
   - Check if user has existing rating for this company
   - If exists: update the rating
   - If new: create new rating
   - Recalculate company's average rating
   - Refresh ratings list

```typescript
const onSubmit = async (data: RatingFormData) => {
  // 1. Check existing
  const existing = await ratingService.getUserRatingForCompany(
    companyId,
    user?.id,
    nickname
  );

  // 2. Create or update
  if (existing) {
    await ratingService.updateRating(existing.id, data);
  } else {
    await ratingService.createRating({ ...data, companyId });
  }

  // 3. Recalculate company average
  await companyService.recalcCompanyAverage(companyId);

  // 4. Refresh UI
  await fetchRatings();
  resetForm();
};
```

## Component Architecture

### CompanyCard

**Props:** `Company`, `onClick: (company: Company) => void`

Displays:
- Company logo (with fallback to first letter)
- Company name, industry, location
- Average rating (colored badge)
- Review count
- "Xem chi tiết" button

**Features:**
- Hover effects (shadow, border)
- Keyboard accessible (Enter/Space to select)
- Responsive sizing

### CompanyDrawer

**Props:** `company: Company | null`, `isOpen: boolean`, `onClose: () => void`

A slide-out drawer showing:
1. **Company Header**: Logo, name, industry, location, description
2. **Rating Summary**: Star display, average, total reviews
3. **Rating Form**: 3 category ratings, comment textarea, nickname (if anonymous), submit button
4. **Comments Section**: List of all ratings with full details

**State Management:**
- Loads existing ratings on open
- Checks for existing user rating
- Form uses react-hook-form with Zod validation
- Submits create/update rating

### RatingStars

**Props:** `value`, `onChange?`, `readonly?`, `size?`, `showLabel?`

Interactive star rating component:
- 5 clickable stars
- Hover scale effect
- Displays numeric value next to stars
- Used in both form (editable) and display (readonly) modes

### UI Components

#### Button
Variants: `primary`, `secondary`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`
Supports loading state with spinner

#### Input & Textarea
- Label support
- Error display
- Helper text
- Consistent styling

#### Drawer
- Slides from right (configurable side)
- Backdrop with click-to-close
- Escape key closes
- Body scroll lock when open
- Accessible (ARIA attributes)
- Uses React Portal for overlay

## State Management (Zustand)

### useCompanyStore
```typescript
interface CompanyStore {
  companies: Company[];
  loading: boolean;
  error: string | null;
  fetchCompanies(): Promise<void>;
  fetchCompanyById(id: string): Promise<Company | null>;
  fetchCompanyBySlug(slug: string): Promise<Company | null>;
  recalcCompanyAverage(companyId: string): Promise<void>;
}
```
Persisted to localStorage for caching.

### useRatingStore
```typescript
interface RatingStore {
  userRatings: Map<string, CompanyRating>;  // key: companyId:identifier
  companyRatings: Map<string, CompanyRating[]>;
  setUserRatings(ratings: CompanyRating[]): void;
  getUserRating(companyId, userId?, nickname?): CompanyRating | undefined;
  hasUserRated(companyId, userId?, nickname?): boolean;
  addRating(rating: CompanyRating): void;
  updateRating(ratingId, updates): void;
  removeRating(ratingId): void;
  setCompanyRatings(companyId, ratings): void;
}
```
Persisted to localStorage for offline-like experience.

### useUserStore
```typescript
interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  login(email, password): Promise<void>;
  logout(): Promise<void>;
  setUser(user): void;
}
```
Persisted to localStorage for session persistence.

## API Services (Mock)

Located in `src/services/api.ts`

All services simulate network delay (300ms) and use in-memory data:

- `companyService`: CRUD operations, average recalculation
- `ratingService`: Create, read, update, delete ratings with user checks
- `userService`: Mock login/logout

**Note:** The mock data is stored in module-level variables and persists across calls within the same session.

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `benefits` | Required, integer 1-5 | "Vui lòng đánh giá tiêu chí này" |
| `environment` | Required, integer 1-5 | Same as above |
| `leadership` | Required, integer 1-5 | Same as above |
| `comment` | Required, min 20 characters | "Bình luận phải có ít nhất 20 ký tự" |
| `nickname` | Required for anonymous, max 50 chars | "Nickname là bắt buộc cho người dùng ẩn danh" |

## Tailwind CSS Configuration

Tailwind v4 uses the `@import` syntax in `app/globals.css`:

```css
@import "tailwindcss";
```

Custom theme extensions in `tailwind.config.ts`:

```typescript
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { /* blue palette */ },
        rating: { /* green/amber/red */ }
      }
    },
  },
} satisfies Config;
```

## Responsive Design

- **Mobile**: 1 column grid
- **Tablet (sm)**: 2 columns
- **Desktop (lg)**: 3 columns
- **Large Desktop (xl)**: 4 columns

Drawer width: `w-full sm:w-96 md:w-[480px]`

## Accessibility Features

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Focus rings on interactive elements
- Escape key to close drawer
- Proper heading hierarchy

## Future Enhancements

1. **Authentication**: Real backend integration, OAuth
2. **API Integration**: Replace mock services with real REST/GraphQL
3. **Search**: Full-text search with debouncing
4. **Filters**: Filter by industry, location, rating range
5. **Sorting**: Additional sort options
6. **Pagination**: For companies and comments
7. **Images**: Real company logos with CDN
8. **Moderation**: Admin panel for content moderation
9. **Reports**: User reporting for inappropriate content
10. **Notifications**: Email notifications for reply to comments
11. **i18n**: Full internationalization support
12. **Testing**: Unit tests (Jest/Vitest), E2E tests (Playwright)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration (reactStrictMode, etc.) |
| `tailwind.config.ts` | Tailwind CSS theme customization |
| `postcss.config.mjs` | PostCSS config for Tailwind v4 |
| `tsconfig.json` | TypeScript configuration with Next.js types |
| `.env.local` | Environment variables (not committed) |

## Notes for Developers

1. All ratings are stored as **numbers** (1-5), never strings
2. Average rating **always** has 1 decimal place using `toFixed(1)`
3. Store operations use Map for efficient lookups by key
4. Zustand persist middleware caches to localStorage (client-side only)
5. React Portal used for Drawer to escape container bounds
6. Form validation is server-side (Zod) + client-side (react-hook-form)
7. Mock API delay can be adjusted via `API_DELAY` constant in `src/services/api.ts`
8. Components using `useState`, `useEffect`, or Zustand must be marked `'use client'`
9. Next.js 15 uses React 19 - enjoy new features like Actions, useOptimistic, etc.
