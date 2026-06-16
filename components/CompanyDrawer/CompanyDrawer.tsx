'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Company, CompanyRating, MIN_COMMENT_LENGTH, RATING_CATEGORIES } from '../../types';
import { useCompanyStore, useRatingStore, useUserStore } from '../../store';
import { CompanyCard } from '../CompanyCard';
import { RatingStars, CategoryRating } from '../RatingStars';
import { Drawer, Button, Input, Textarea } from '../UI';
import {
  calculateAverageRating,
  getRatingKey,
  getRatingColor,
  formatRatingDisplay
} from '../../utils/rating';
import { ratingService } from '../../services/api';

// Validation schema
const ratingSchema = z.object({
  benefits: z.number().min(1).max(5),
  environment: z.number().min(1).max(5),
  leadership: z.number().min(1).max(5),
  comment: z.string().min(MIN_COMMENT_LENGTH, `Bình luận phải có ít nhất ${MIN_COMMENT_LENGTH} ký tự`),
  nickname: z.string().min(1, 'Nickname là bắt buộc').max(50).optional()
}).refine(
  (data) => {
    // For anonymous users, nickname is required
    return !!data.nickname?.trim();
  },
  {
    message: 'Nickname là bắt buộc cho người dùng ẩn danh',
    path: ['nickname']
  }
);

type RatingFormData = z.infer<typeof ratingSchema>;

interface CompanyDrawerProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyDrawer: React.FC<CompanyDrawerProps> = ({
  company,
  isOpen,
  onClose
}) => {
  const { user, isAuthenticated } = useUserStore();
  const { userRatings } = useRatingStore();
  const { recalcCompanyAverage } = useCompanyStore();

  const [ratings, setRatings] = useState<CompanyRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<CompanyRating | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      benefits: 0,
      environment: 0,
      leadership: 0,
      comment: '',
      nickname: ''
    }
  });

  const formValues = watch();
  const averageRating = formValues.benefits > 0
    ? calculateAverageRating({
        benefits: formValues.benefits,
        environment: formValues.environment,
        leadership: formValues.leadership
      })
    : 0;

  // Fetch ratings for the company
  const fetchRatings = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await ratingService.getRatingsByCompany(company.id);
      setRatings(data);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setLoading(false);
    }
  }, [company]);

  // Check for existing user rating
  const checkExistingRating = useCallback(async () => {
    if (!company) return;
    try {
      const existing = await ratingService.getUserRatingForCompany(
        company.id,
        isAuthenticated ? user?.id : undefined,
        !isAuthenticated ? watch('nickname') : undefined
      );
      if (existing) {
        setExistingRating(existing);
        setValue('benefits', existing.benefits);
        setValue('environment', existing.environment);
        setValue('leadership', existing.leadership);
        setValue('comment', existing.comment);
        if (!isAuthenticated) {
          setValue('nickname', existing.nickname || '');
        }
      } else {
        setExistingRating(null);
        reset({ benefits: 0, environment: 0, leadership: 0, comment: '', nickname: '' });
      }
    } catch (error) {
      console.error('Failed to check existing rating:', error);
    }
  }, [company, isAuthenticated, user?.id, watch, setValue, reset]);

  useEffect(() => {
    if (isOpen && company) {
      fetchRatings();
      checkExistingRating();
    }
  }, [isOpen, company, fetchRatings, checkExistingRating]);

  const onSubmit = async (data: RatingFormData) => {
    if (!company) return;

    setSubmitting(true);
    try {
      const ratingData = {
        companyId: company.id,
        userId: isAuthenticated ? user?.id : undefined,
        nickname: isAuthenticated ? undefined : data.nickname?.trim(),
        benefits: data.benefits,
        environment: data.environment,
        leadership: data.leadership,
        comment: data.comment.trim()
      };

      if (existingRating) {
        await ratingService.updateRating(existingRating.id, {
          benefits: ratingData.benefits,
          environment: ratingData.environment,
          leadership: ratingData.leadership,
          comment: ratingData.comment
        });
      } else {
        await ratingService.createRating(ratingData);
      }

      // Recalculate company average
      await recalcCompanyAverage(company.id);

      // Refresh ratings list
      await fetchRatings();

      // Reset form
      reset({ benefits: 0, environment: 0, leadership: 0, comment: '', nickname: '' });
      setExistingRating(null);
    } catch (error: any) {
      alert(error.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (!company) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const ratingColor = getRatingColor(company.averageRating);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={company.name}>
      <div className="space-y-6">
        {/* Company Info */}
        <div className="flex items-start gap-4 pb-4 border-b border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
            {company.logo ? (
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-xl text-gray-900">{company.name}</h2>
            {company.industry && (
              <p className="text-sm text-gray-500">{company.industry}</p>
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
            {company.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                {company.description}
              </p>
            )}
          </div>
        </div>

        {/* Rating Summary */}
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <svg
                  key={star}
                  className={`w-6 h-6 ${star <= Math.round(company.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <div>
              <span className={`text-2xl font-bold ${ratingColor.text}`}>
                {formatRatingDisplay(company.averageRating)}
              </span>
              <span className="text-sm text-gray-500 ml-1">trung bình</span>
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {company.reviewCount} đánh giá
          </span>
        </div>

        {/* Rating Form */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            {existingRating ? 'Chỉnh sửa đánh giá' : 'Thêm đánh giá của bạn'}
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Rating Categories */}
            <div className="space-y-3">
              <CategoryRating
                category="benefits"
                value={formValues.benefits}
                onChange={(v) => setValue('benefits', v)}
              />
              <CategoryRating
                category="environment"
                value={formValues.environment}
                onChange={(v) => setValue('environment', v)}
              />
              <CategoryRating
                category="leadership"
                value={formValues.leadership}
                onChange={(v) => setValue('leadership', v)}
              />
            </div>

            {errors.benefits && (
              <p className="text-sm text-red-600">Vui lòng đánh giá tất cả các tiêu chí</p>
            )}

            {/* Preview Average */}
            {averageRating > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Điểm trung bình:</span>
                <span className={`font-bold ${getRatingColor(averageRating).text}`}>
                  {formatRatingDisplay(averageRating)}
                </span>
              </div>
            )}

            {/* Nickname (for anonymous) */}
            {!isAuthenticated && (
              <Input
                label="Nickname"
                placeholder="Nhập nickname của bạn"
                {...register('nickname')}
                error={errors.nickname?.message}
                helperText="Nickname sẽ được hiển thị công khai"
              />
            )}

            {/* Comment */}
            <Textarea
              label="Bình luận"
              placeholder={`Chia sẻ trải nghiệm của bạn tại ${company.name}... (tối thiểu ${MIN_COMMENT_LENGTH} ký tự)`}
              {...register('comment')}
              error={errors.comment?.message}
              helperText={`${formValues.comment?.length || 0}/${MIN_COMMENT_LENGTH} ký tự`}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={!formValues.comment ||
                        formValues.benefits === 0 ||
                        formValues.environment === 0 ||
                        formValues.leadership === 0 ||
                        (!isAuthenticated && !formValues.nickname?.trim())}
              className="w-full"
            >
              {existingRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
            </Button>
          </form>
        </div>

        {/* Comments Section */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            Tất cả đánh giá ({ratings.length})
          </h3>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="animate-spin h-8 w-8 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có đánh giá nào cho công ty này.</p>
              <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div key={rating.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {rating.nickname || 'Người dùng ẩn danh'}
                      </span>
                      {!rating.userId && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          Ẩn danh
                        </span>
                      )}
                      {rating.userId && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          Đã xác thực
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(rating.createdAt)}
                    </span>
                  </div>

                  {/* Category Ratings */}
                  <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">{RATING_CATEGORIES.benefits}:</span>
                      <span className="ml-1 font-medium">{rating.benefits}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{RATING_CATEGORIES.environment}:</span>
                      <span className="ml-1 font-medium">{rating.environment}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-600">{RATING_CATEGORIES.leadership}:</span>
                      <span className="ml-1 font-medium">{rating.leadership}/5</span>
                    </div>
                  </div>

                  {/* Overall Average */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">Điểm trung bình:</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className={`font-bold text-sm ${getRatingColor(calculateAverageRating(rating)).text}`}>
                        {formatRatingDisplay(calculateAverageRating(rating))}
                      </span>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">
                    {rating.comment}
                  </p>

                  {/* Edit indicator for current user */}
                  {existingRating?.id === rating.id && (
                    <div className="mt-2 text-xs text-blue-600">
                      (Đây là đánh giá của bạn)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};
