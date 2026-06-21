import { Company, CompanyRating, User, CreateRatingInput, UpdateRatingInput } from '../types';
import { createClient } from '../utils/supabase/client';

const supabase = createClient();

// Helper to map DB company to Company type
function mapCompanyFromDB(dbCompany: any): Company {
  return {
    id: dbCompany.id,
    name: dbCompany.name,
    logo: dbCompany.logo || '',
    slug: dbCompany.slug,
    description: dbCompany.description || undefined,
    industry: dbCompany.industry || undefined,
    location: dbCompany.location || undefined,
    averageRating: dbCompany.average_rating ? Number(dbCompany.average_rating) : 0,
    reviewCount: dbCompany.review_count ? Number(dbCompany.review_count) : 0,
    createdAt: new Date(dbCompany.created_at),
    updatedAt: new Date(dbCompany.updated_at)
  };
}

// Helper to map DB rating to CompanyRating type
function mapRatingFromDB(dbRating: any): CompanyRating {
  return {
    id: dbRating.id,
    companyId: dbRating.company_id,
    userId: dbRating.user_id || undefined,
    nickname: dbRating.nickname || undefined,
    benefits: dbRating.benefits,
    environment: dbRating.environment,
    leadership: dbRating.leadership,
    comment: dbRating.comment,
    createdAt: new Date(dbRating.created_at),
    updatedAt: new Date(dbRating.updated_at)
  };
}

// Company API using Supabase
export const companyService = {
  async getAllCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`);
    }

    return (data || []).map(mapCompanyFromDB);
  },

  async getCompanyById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Record not found
      throw new Error(`Failed to fetch company by ID: ${error.message}`);
    }

    return data ? mapCompanyFromDB(data) : null;
  },

  async getCompanyBySlug(slug: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Record not found
      throw new Error(`Failed to fetch company by slug: ${error.message}`);
    }

    return data ? mapCompanyFromDB(data) : null;
  },

  async recalcCompanyAverage(companyId: string): Promise<Company | null> {
    // In Supabase, the DB triggers handle updating the average rating and count on write.
    // So we just fetch the updated company details.
    return this.getCompanyById(companyId);
  }
};

// Rating API using Supabase
export const ratingService = {
  async getRatingsByCompany(companyId: string): Promise<CompanyRating[]> {
    const { data, error } = await supabase
      .from('company_ratings')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }

    return (data || []).map(mapRatingFromDB);
  },

  async getUserRatingForCompany(
    companyId: string,
    userId?: string,
    nickname?: string
  ): Promise<CompanyRating | null> {
    const identifier = nickname || userId;
    if (!identifier) return null;

    let query = supabase
      .from('company_ratings')
      .select('*')
      .eq('company_id', companyId);

    // If nickname is available, check by nickname. Otherwise, use userId.
    if (nickname) {
      query = query.eq('nickname', nickname);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to check existing user rating: ${error.message}`);
    }

    return data && data.length > 0 ? mapRatingFromDB(data[0]) : null;
  },

  async createRating(data: CreateRatingInput): Promise<CompanyRating> {
    const { companyId, nickname, benefits, environment, leadership, comment } = data;

    if (!comment || comment.trim().length < 20) {
      throw new Error('Bình luận phải có ít nhất 20 ký tự');
    }

    // Since we don't have real auth yet, we store user_id as null
    // and rely on the nickname to satisfy the anonymous policy.
    const insertData = {
      company_id: companyId,
      user_id: null,
      nickname: nickname || 'Người dùng ẩn danh',
      benefits,
      environment,
      leadership,
      comment: comment.trim()
    };

    const { data: inserted, error } = await supabase
      .from('company_ratings')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit rating: ${error.message}`);
    }

    return mapRatingFromDB(inserted);
  },

  async updateRating(
    ratingId: string,
    data: UpdateRatingInput
  ): Promise<CompanyRating> {
    const updateData: any = {};
    if (data.benefits !== undefined) updateData.benefits = data.benefits;
    if (data.environment !== undefined) updateData.environment = data.environment;
    if (data.leadership !== undefined) updateData.leadership = data.leadership;
    if (data.comment !== undefined) {
      if (data.comment.trim().length < 20) {
        throw new Error('Bình luận phải có ít nhất 20 ký tự');
      }
      updateData.comment = data.comment.trim();
    }

    const { data: updated, error } = await supabase
      .from('company_ratings')
      .update(updateData)
      .eq('id', ratingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update rating: ${error.message}`);
    }

    return mapRatingFromDB(updated);
  },

  async deleteRating(ratingId: string): Promise<void> {
    const { error } = await supabase
      .from('company_ratings')
      .delete()
      .eq('id', ratingId);

    if (error) {
      throw new Error(`Failed to delete rating: ${error.message}`);
    }
  }
};

// User API (mock remains for frontend session demonstration)
export const userService = {
  async login(email: string, password: string): Promise<User> {
    // Simulating network delay for mock login
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: `u${Date.now()}`,
      email,
      nickname: email.split('@')[0],
      isAuthenticated: true
    };
  },

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};
