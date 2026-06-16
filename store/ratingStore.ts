import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompanyRating } from '../types';
import { ratingService } from '../services/api';
import { getRatingKey } from '../utils/rating';

interface RatingStore {
  // Track ratings by companyId:userId/nickname key
  userRatings: Map<string, CompanyRating>;
  companyRatings: Map<string, CompanyRating[]>; // All ratings per company

  setUserRatings: (ratings: CompanyRating[]) => void;
  getUserRating: (companyId: string, userId?: string, nickname?: string) => CompanyRating | undefined;
  hasUserRated: (companyId: string, userId?: string, nickname?: string) => boolean;
  addRating: (rating: CompanyRating) => void;
  updateRating: (ratingId: string, updates: Partial<CompanyRating>) => void;
  removeRating: (ratingId: string) => void;
  setCompanyRatings: (companyId: string, ratings: CompanyRating[]) => void;
  clearUserRating: (companyId: string, userId?: string, nickname?: string) => void;
}

export const useRatingStore = create<RatingStore>()(
  persist(
    (set, get) => ({
      userRatings: new Map(),
      companyRatings: new Map(),

      setUserRatings: (ratings) => {
        const newMap = new Map<string, CompanyRating>();
        ratings.forEach(r => {
          const key = getRatingKey(r.companyId, r.userId, r.nickname);
          newMap.set(key, r);
        });
        set({ userRatings: newMap });
      },

      getUserRating: (companyId, userId, nickname) => {
        const key = getRatingKey(companyId, userId, nickname);
        return get().userRatings.get(key);
      },

      hasUserRated: (companyId, userId, nickname) => {
        const key = getRatingKey(companyId, userId, nickname);
        return get().userRatings.has(key);
      },

      addRating: (rating) => {
        const key = getRatingKey(rating.companyId, rating.userId, rating.nickname);
        set((state) => {
          const newUserRatings = new Map(state.userRatings);
          newUserRatings.set(key, rating);

          const newCompanyRatings = new Map(state.companyRatings);
          const existing = newCompanyRatings.get(rating.companyId) || [];
          // Remove any existing rating from same user for this company
          const filtered = existing.filter(
            r => r.id !== rating.id &&
                 !(r.userId === rating.userId || r.nickname === rating.nickname)
          );
          newCompanyRatings.set(rating.companyId, [rating, ...filtered]);

          return { userRatings: newUserRatings, companyRatings: newCompanyRatings };
        });
      },

      updateRating: (ratingId, updates) => {
        set((state) => {
          const newUserRatings = new Map(state.userRatings);
          const newCompanyRatings = new Map(state.companyRatings);

          // Update in userRatings
          for (const [key, rating] of newUserRatings) {
            if (rating.id === ratingId) {
              newUserRatings.set(key, { ...rating, ...updates });
              break;
            }
          }

          // Update in companyRatings
          for (const [companyId, ratings] of newCompanyRatings) {
            const index = ratings.findIndex(r => r.id === ratingId);
            if (index !== -1) {
              newCompanyRatings.set(companyId, [
                ...ratings.slice(0, index),
                { ...ratings[index], ...updates },
                ...ratings.slice(index + 1)
              ]);
              break;
            }
          }

          return { userRatings: newUserRatings, companyRatings: newCompanyRatings };
        });
      },

      removeRating: (ratingId) => {
        set((state) => {
          const newUserRatings = new Map(state.userRatings);
          const newCompanyRatings = new Map(state.companyRatings);

          // Find and remove from userRatings
          for (const [key, rating] of newUserRatings) {
            if (rating.id === ratingId) {
              newUserRatings.delete(key);
              break;
            }
          }

          // Remove from companyRatings
          for (const [companyId, ratings] of newCompanyRatings) {
            const filtered = ratings.filter(r => r.id !== ratingId);
            if (filtered.length !== ratings.length) {
              newCompanyRatings.set(companyId, filtered);
              break;
            }
          }

          return { userRatings: newUserRatings, companyRatings: newCompanyRatings };
        });
      },

      setCompanyRatings: (companyId, ratings) => {
        set((state) => {
          const newCompanyRatings = new Map(state.companyRatings);
          newCompanyRatings.set(companyId, ratings);
          return { companyRatings: newCompanyRatings };
        });
      },

      clearUserRating: (companyId, userId, nickname) => {
        const key = getRatingKey(companyId, userId, nickname);
        set((state) => {
          const newUserRatings = new Map(state.userRatings);
          newUserRatings.delete(key);

          const newCompanyRatings = new Map(state.companyRatings);
          const existing = newCompanyRatings.get(companyId) || [];
          const filtered = existing.filter(
            r => !(r.userId === userId || r.nickname === nickname)
          );
          newCompanyRatings.set(companyId, filtered);

          return { userRatings: newUserRatings, companyRatings: newCompanyRatings };
        });
      }
    }),
    {
      name: 'rating-storage'
    }
  )
);
