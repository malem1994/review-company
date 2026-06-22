import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Company } from '../types';
import { companyService } from '../services/api';

interface CompanyStore {
  companies: Company[];
  loading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  fetchCompanyById: (id: string) => Promise<Company | null>;
  fetchCompanyBySlug: (slug: string) => Promise<Company | null>;
  recalcCompanyAverage: (companyId: string) => Promise<void>;
  updateCompany: (updated: Company) => void;
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      companies: [],
      loading: false,
      error: null,

      fetchCompanies: async () => {
        set({ loading: true, error: null });
        try {
          const data = await companyService.getAllCompanies();
          set({ companies: data, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      fetchCompanyById: async (id: string) => {
        try {
          return await companyService.getCompanyById(id);
        } catch (error) {
          set({ error: (error as Error).message });
          return null;
        }
      },

      fetchCompanyBySlug: async (slug: string) => {
        try {
          return await companyService.getCompanyBySlug(slug);
        } catch (error) {
          set({ error: (error as Error).message });
          return null;
        }
      },

      recalcCompanyAverage: async (companyId: string) => {
        try {
          const updated = await companyService.recalcCompanyAverage(companyId);
          if (updated) {
            set((state) => ({
              companies: state.companies.map(c =>
                c.id === companyId ? updated : c
              )
            }));
          }
        } catch (error) {
          set({ error: (error as Error).message });
        }
      },

      updateCompany: (updated: Company) => {
        set((state) => ({
          companies: state.companies.map(c =>
            c.id === updated.id ? updated : c
          )
        }));
      }
    }),
    {
      name: 'company-storage',
      partialize: (state) => ({ companies: state.companies })
    }
  )
);
