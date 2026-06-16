import React from 'react';
import { Company } from '../../types';
import { getRatingColor, formatRatingDisplay } from '../../utils/rating';
import { Drawer, Button } from '../UI';

interface CompanyCardProps {
  company: Company;
  onClick: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onClick }) => {
  const ratingColor = getRatingColor(company.averageRating);

  return (
    <div
      className="
        bg-white rounded-xl shadow-sm border border-gray-200
        hover:shadow-lg hover:border-blue-200
        transition-all duration-200 cursor-pointer
        overflow-hidden
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
      <div className="p-4">
        {/* Logo */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {company.logo ? (
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div
              className={`
                hidden w-full h-full flex items-center justify-center
                text-gray-400 font-bold text-xl
              `}
            >
              {company.name.charAt(0)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg truncate">
              {company.name}
            </h3>
            {company.industry && (
              <p className="text-sm text-gray-500 truncate">{company.industry}</p>
            )}
            {company.location && (
              <p className="text-sm text-gray-400 flex items-center mt-1">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {company.location}
              </p>
            )}
          </div>
        </div>

        {/* Rating Badge */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className={`ml-1 text-lg font-bold ${ratingColor.text}`}>
                {formatRatingDisplay(company.averageRating)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              ({company.reviewCount} đánh giá)
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick(company);
            }}
          >
            Xem chi tiết
          </Button>
        </div>
      </div>
    </div>
  );
};
