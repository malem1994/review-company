'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Company, CompanyRating, MIN_COMMENT_LENGTH } from '../../types';
import { useCompanyStore } from '../../store';
import { useUserStore } from '../../store/userStore';
import { CategoryRating, RatingStars } from '../RatingStars';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CompanyAvatar } from '../CompanyAvatar';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel
} from '@/components/ui/field';
import {
  calculateAverageRating,
  getRatingColor,
  formatRatingDisplay
} from '../../utils/rating';
import { ratingService } from '../../services/api';

// Validation schema - nickname not needed since login required
const ratingSchema = z.object({
  benefits: z.number().min(1).max(5),
  environment: z.number().min(1).max(5),
  leadership: z.number().min(1).max(5),
  comment: z.string().trim().min(MIN_COMMENT_LENGTH, `Bình luận phải có ít nhất ${MIN_COMMENT_LENGTH} ký tự`)
});

type RatingFormData = z.infer<typeof ratingSchema>;

interface CompanyDrawerProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
}

export const CompanyDrawer: React.FC<CompanyDrawerProps> = ({
  company,
  isOpen,
  onClose,
  onLoginClick
}) => {
  const { user, isAuthenticated } = useUserStore();
  const { recalcCompanyAverage } = useCompanyStore();

  const [ratings, setRatings] = useState<CompanyRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingRating, setExistingRating] = useState<CompanyRating | null>(null);
  const [viewMode, setViewMode] = useState<'default' | 'form'>('default');
  const [error, setError] = useState<string | null>(null);

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
      comment: ''
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
    setError(null);
    try {
      console.log('Fetching ratings for company:', company.id, company.name);
      const data = await ratingService.getRatingsByCompany(company.id);
      console.log('Fetched ratings count:', data.length, data);
      setRatings(data);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
      setError(error instanceof Error ? error.message : 'Không thể tải đánh giá');
      setRatings([]);
    } finally {
      setLoading(false);
    }
  }, [company]);

  // Check for existing user rating
  const checkExistingRating = useCallback(async () => {
    if (!company) return;
    try {
      if (isAuthenticated && user) {
        const existing = await ratingService.getUserRatingForCompany(
          company.id,
          user.id
        );
        if (existing) {
          setExistingRating(existing);
          setValue('benefits', existing.benefits);
          setValue('environment', existing.environment);
          setValue('leadership', existing.leadership);
          setValue('comment', existing.comment);
        } else {
          setExistingRating(null);
          reset({ benefits: 0, environment: 0, leadership: 0, comment: '' });
        }
      } else {
        setExistingRating(null);
        reset({ benefits: 0, environment: 0, leadership: 0, comment: '' });
      }
    } catch (error) {
      console.error('Failed to check existing rating:', error);
    }
  }, [company, isAuthenticated, user, setValue, reset]);

  useEffect(() => {
    if (isOpen && company) {
      fetchRatings();
      checkExistingRating();
      setViewMode('default'); // Reset to default when drawer opens
    }
  }, [isOpen, company, fetchRatings, checkExistingRating]);

  const onSubmit = async (data: RatingFormData) => {
    if (!company) return;
    if (!isAuthenticated || !user) {
      alert('Vui lòng đăng nhập để đánh giá');
      return;
    }

    setSubmitting(true);
    try {
      const ratingData = {
        companyId: company.id,
        userId: user.id,
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

      await recalcCompanyAverage(company.id);
      await fetchRatings();
      reset({ benefits: 0, environment: 0, leadership: 0, comment: '' });
      setExistingRating(null);
      setViewMode('default');
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const ratingColor = getRatingColor(company.averageRating);

  // Company Info component (shared between views)
  const companyInfo = (
    <div className="flex items-start gap-4 border-b pb-5">
      <CompanyAvatar name={company.name} logo={company.logo} size="lg" className="shadow-sm" />
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-semibold tracking-tight">{company.name}</h2>
        {company.industry && (
          <Badge variant="secondary" className="mt-2">
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
        {company.description && (
          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
            {company.description}
          </p>
        )}
      </div>
    </div>
  );

  // Rating Summary component
  const ratingSummary = (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <svg
              key={star}
              className={`h-6 w-6 ${star <= Math.round(company.averageRating) ? 'text-amber-400' : 'text-muted-foreground/30'}`}
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
          <span className="ml-1 text-sm text-muted-foreground">trung bình</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground">
        {company.reviewCount} đánh giá
      </span>
    </div>
  );

  // Comments section - sorted with current user's rating first
  const sortedRatings = [...ratings].sort((a, b) => {
    if (isAuthenticated && user) {
      const aIsCurrentUser = a.userId === user.id;
      const bIsCurrentUser = b.userId === user.id;
      if (aIsCurrentUser && !bIsCurrentUser) return -1;
      if (!aIsCurrentUser && bIsCurrentUser) return 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const commentsSection = (
    <div className="border-t pt-5">
      <h3 className="mb-4 font-semibold">
        Tất cả đánh giá ({ratings.length})
      </h3>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">
          <svg className="mx-auto h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchRatings}
          >
            Thử lại
          </Button>
        </div>
      ) : ratings.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 py-8 text-center text-muted-foreground">
          <p>Chưa có đánh giá nào cho công ty này.</p>
          <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedRatings.map((rating) => {
            const isCurrentUserRating = isAuthenticated && user && rating.userId === user.id;
            const ratingAvg = calculateAverageRating(rating);

            return (
              <div
                key={rating.id}
                className={`rounded-xl border p-4 shadow-sm ${isCurrentUserRating ? 'border-2 border-primary bg-primary/5' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {rating.displayName || 'Người dùng'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(rating.createdAt)}
                  </span>
                </div>

                {/* Overall Average as Stars */}
                <div className="mb-3">
                  <RatingStars
                    value={ratingAvg}
                    readonly
                    size="md"
                    showLabel={true}
                  />
                </div>

                {/* Comment */}
                <p className="whitespace-pre-wrap text-sm text-foreground/90">
                  {rating.comment}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Rating Form component
  const ratingForm = (
    <div className="space-y-4">
      <h3 className="font-semibold">
        {existingRating ? 'Chỉnh sửa đánh giá' : 'Thêm đánh giá của bạn'}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Rating Categories */}
        <div className="space-y-3">
          <CategoryRating
            category="benefits"
            value={formValues.benefits}
            onChange={(v) => setValue('benefits', v, { shouldDirty: true, shouldValidate: true })}
          />
          <CategoryRating
            category="environment"
            value={formValues.environment}
            onChange={(v) => setValue('environment', v, { shouldDirty: true, shouldValidate: true })}
          />
          <CategoryRating
            category="leadership"
            value={formValues.leadership}
            onChange={(v) => setValue('leadership', v, { shouldDirty: true, shouldValidate: true })}
          />
        </div>

        {errors.benefits && (
          <p className="text-sm text-destructive">Vui lòng đánh giá tất cả các tiêu chí</p>
        )}

        {/* Preview Average */}
        {averageRating > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Điểm trung bình:</span>
            <span className={`font-bold ${getRatingColor(averageRating).text}`}>
              {formatRatingDisplay(averageRating)}
            </span>
          </div>
        )}

        {/* Authenticated user info */}
        <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{user?.displayName}</p>
            <p className="text-xs text-muted-foreground">Đánh giá sẽ được lưu với tài khoản của bạn</p>
          </div>
        </div>

        {/* Comment */}
        <Field data-invalid={!!errors.comment}>
          <FieldLabel htmlFor="comment">Bình luận</FieldLabel>
          <Textarea
            id="comment"
            placeholder={`Chia sẻ trải nghiệm của bạn tại ${company.name}... (tối thiểu ${MIN_COMMENT_LENGTH} ký tự)`}
            aria-invalid={!!errors.comment}
            {...register('comment')}
          />
          {errors.comment ? (
            <FieldError>{errors.comment.message}</FieldError>
          ) : (
            <FieldDescription>
              {formValues.comment?.length || 0}/{MIN_COMMENT_LENGTH} ký tự
            </FieldDescription>
          )}
        </Field>
      </form>
    </div>
  );

  // Main content based on view mode
  const mainContent = viewMode === 'default' ? (
    <>
      {companyInfo}
      {ratingSummary}
      {commentsSection}
    </>
  ) : (
    <>
      {companyInfo}
      {ratingForm}
    </>
  );

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={company.name}>
      <div className="flex h-full max-h-[calc(100vh-4rem)] flex-col">
        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            {mainContent}
          </div>
        </div>

        {/* Bottom CTA - always sticky */}
        <div className="border-t bg-background p-4">
          <div className="flex gap-3">
            {viewMode === 'default' ? (
              <Button
                onClick={() => {
                  if (isAuthenticated) {
                    setViewMode('form');
                  } else if (onLoginClick) {
                    onClose();
                    onLoginClick();
                  }
                }}
                variant="outline"
                className="flex-1"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Viết đánh giá
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => setViewMode('default')}
                  variant="outline"
                  className="w-auto"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5l3-3m-3 3l-3-3m3 3H7.5m3.75 0A1.5 1.5 0 0 1 9 18V5.25A1.5 1.5 0 0 1 10.5 3.75h3.75A1.5 1.5 0 0 1 15.75 5.25v12.75a1.5 1.5 0 0 1-1.5 1.5h-3.75Z" />
                  </svg>
                  Quay lại
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(onSubmit)()}
                  loading={submitting}
                  className="flex-1"
                  disabled={submitting || !formValues.comment || formValues.benefits === 0 || formValues.environment === 0 || formValues.leadership === 0}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {existingRating ? 'Cập nhật đánh giá' : 'Đánh giá'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
};
