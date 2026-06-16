# Đánh Giá Công Ty Việt Nam

A modern company review platform built with **Next.js 15**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

## Features

- Browse companies as interactive cards with ratings
- View detailed company information in a slide-out drawer
- Rate companies across 3 categories:
  - Phúc lợi công ty (Company Benefits)
  - Môi trường công ty (Work Environment)
  - Ban lãnh đạo (Leadership)
- Leave detailed comments (minimum 20 characters)
- Support for both anonymous and authenticated users
- Real-time rating calculation with 1 decimal precision
- Search and filter companies by name, industry, or location
- Sort by rating, name, or review count

## Tech Stack

| Technology | Version |
|------------|---------|
| Next.js | 15.0+ |
| React | 19.0+ |
| TypeScript | 5.0+ |
| Tailwind CSS | 4.0+ |
| Zustand | 4.5+ |
| React Hook Form | 7.50+ |
| Zod | 3.23+ |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+ or yarn/pnpm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server at http://localhost:3000
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Linting

```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

## Project Structure

```
review-company/
├── app/
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page (client component)
│   ├── globals.css        # Global styles + Tailwind
│   └── companies/
│       └── [slug]/
│           └── page.tsx   # Dynamic company pages (optional)
├── components/
│   ├── CompanyCard/       # Company listing card
│   ├── CompanyDrawer/     # Detail drawer with rating form
│   ├── RatingStars/       # Star rating component
│   └── UI/                # Button, Input, Textarea, Drawer
├── lib/                   # Shared utilities (reserved)
├── store/                 # Zustand state management
│   ├── companyStore.ts
│   ├── ratingStore.ts
│   └── userStore.ts
├── types/                 # TypeScript definitions
├── utils/                 # Helper functions
├── services/              # API services (mock data)
├── hooks/                 # Custom React hooks
├── docs/
│   └── ARCHITECTURE.md   # Detailed architecture docs
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.mjs
└── package.json
```

## Business Rules

### Rating Calculation

```
average = (benefits + environment + leadership) / 3
```

- Displayed with **1 decimal place** (e.g., 4.3, 3.7)
- Color-coded: Green (≥4.0), Amber (3.0-3.9), Red (<3.0)

### User Anonymity

| User Type | Requirements | Rating Limit |
|-----------|--------------|--------------|
| Anonymous | Nickname required | 1 rating per company (same nickname updates) |
| Authenticated | User ID stored | 1 rating per company (same user updates) |

### Comment Validation

- **Minimum**: 20 characters
- Required for all submissions
- Validated via Zod schema

## Component Architecture

### CompanyCard
Displays company info with logo, name, industry, location, and average rating. Click to open detail drawer.

### CompanyDrawer
Slide-out panel showing:
- Company header with details
- Rating summary
- Rating form (3 category stars + comment)
- All reviews list

### RatingStars
Interactive star component (1-5 scale), supports both input and display modes.

### UI Components
- `Button` - Multiple variants and sizes, loading state
- `Input` / `Textarea` - Labels, errors, helper text
- `Drawer` - Accessible slide-out panel with backdrop

## State Management (Zustand)

### useCompanyStore
Manages company list, loading states, and fetching.

### useRatingStore
Tracks user ratings per company using Map with keys:
- Authenticated: `companyId:userId`
- Anonymous: `companyId:nickname`

### useUserStore
Handles user authentication state (mock).

## Mock API

Located in `src/services/api.ts`. Simulates network delay (300ms) with in-memory data:

- 5 sample companies (Techcombank, VNPT, VinGroup, FPT Software, MoMo)
- Pre-populated ratings for testing
- CRUD operations for ratings

## Environment Variables

Create `.env.local` for custom configuration:

```env
# Not currently used (mock API)
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Customization

### Tailwind Configuration

Edit `tailwind.config.ts` to customize colors, spacing, etc.

### Extending Mock Data

Add more companies in `src/services/api.ts`:

```typescript
{
  id: '6',
  name: 'Your Company',
  logo: 'https://...',
  slug: 'your-company',
  // ...
}
```

## Future Enhancements

- [ ] Real backend API integration
- [ ] User authentication (OAuth, email/password)
- [ ] Company search with debouncing
- [ ] Advanced filters (industry, location, rating range)
- [ ] Pagination for companies and reviews
- [ ] Admin moderation panel
- [ ] Email notifications
- [ ] Full i18n support
- [ ] Unit and E2E tests
- [ ] API routes in Next.js

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check code style
5. Submit a pull request

## License

MIT
