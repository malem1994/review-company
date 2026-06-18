import React from 'react';
import { Company } from '../../types';
import { getRatingColor, formatRatingDisplay } from '../../utils/rating';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyAvatar } from '../CompanyAvatar';

interface CompanyCardProps {
  company: Company;
  onClick: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onClick }) => {
  const ratingColor = getRatingColor(company.averageRating);

  return (
    <Card
      className="
        group cursor-pointer overflow-hidden py-5
        transition-all duration-200
        hover:border-ring/50 hover:shadow-md
        focus:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
      "
      onClick={() => onClick(company)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(company);
        }
      }}
      aria-label={`View details for ${company.name}`}
    >
      <CardContent className="space-y-5 px-5">
        {/* Logo */}
        <div className="flex items-start gap-4">
          <CompanyAvatar name={company.name} logo={company.logo} />

          <div className="flex-1 min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {company.name}
            </h3>
            {company.industry && (
              <Badge variant="secondary" className="mt-2 max-w-full truncate">
                {company.industry}
              </Badge>
            )}
            {company.location && (
              <p className="mt-2 flex items-center text-sm text-muted-foreground">
                <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {company.location}
              </p>
            )}
          </div>
        </div>

        {/* Rating Badge */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className={`ml-1 text-lg font-bold ${ratingColor.text}`}>
                {formatRatingDisplay(company.averageRating)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({company.reviewCount} đánh giá)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
