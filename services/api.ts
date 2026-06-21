import { Company, CompanyRating, CreateRatingInput, UpdateRatingInput } from '../types';
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
    const { data: ratings, error } = await supabase
      .from('company_ratings')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }

    if (!ratings || ratings.length === 0) {
      return [];
    }

    // Fetch all user profiles in batch for these ratings
    const userIds = [...new Set(ratings.map(r => r.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

    return ratings.map(rating => ({
      id: rating.id,
      companyId: rating.company_id,
      userId: rating.user_id,
      displayName: rating.user_id ? profileMap.get(rating.user_id) || undefined : undefined,
      benefits: rating.benefits,
      environment: rating.environment,
      leadership: rating.leadership,
      comment: rating.comment,
      createdAt: new Date(rating.created_at),
      updatedAt: new Date(rating.updated_at)
    }));
  },

  async getUserRatingForCompany(
    companyId: string,
    userId: string
  ): Promise<CompanyRating | null> {
    const { data, error } = await supabase
      .from('company_ratings')
      .select('*')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Record not found
      throw new Error(`Failed to check existing user rating: ${error.message}`);
    }

    if (!data) return null;

    // Fetch profile for this user
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    return {
      id: data.id,
      companyId: data.company_id,
      userId: data.user_id,
      displayName: profile?.display_name || undefined,
      benefits: data.benefits,
      environment: data.environment,
      leadership: data.leadership,
      comment: data.comment,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async createRating(data: CreateRatingInput): Promise<CompanyRating> {
    const { companyId, userId, benefits, environment, leadership, comment } = data;

    if (!comment || comment.trim().length < 20) {
      throw new Error('Bình luận phải có ít nhất 20 ký tự');
    }

    if (!userId) {
      throw new Error('Vui lòng đăng nhập để đánh giá');
    }

    const { data: inserted, error } = await supabase
      .from('company_ratings')
      .insert({
        company_id: companyId,
        user_id: userId,
        benefits,
        environment,
        leadership,
        comment: comment.trim()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Bạn đã đánh giá công ty này. Vui lòng chỉnh sửa đánh giá hiện tại.');
      }
      throw new Error(`Không thể gửi đánh giá: ${error.message}`);
    }

    // Fetch profile for the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single();

    return {
      id: inserted.id,
      companyId: inserted.company_id,
      userId: inserted.user_id,
      displayName: profile?.display_name || undefined,
      benefits: inserted.benefits,
      environment: inserted.environment,
      leadership: inserted.leadership,
      comment: inserted.comment,
      createdAt: new Date(inserted.created_at),
      updatedAt: new Date(inserted.updated_at)
    };
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

    // Fetch profile for the user if available
    let displayName: string | undefined;
    if (updated.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', updated.user_id)
        .single();
      displayName = profile?.display_name || undefined;
    }

    return {
      id: updated.id,
      companyId: updated.company_id,
      userId: updated.user_id,
      displayName,
      benefits: updated.benefits,
      environment: updated.environment,
      leadership: updated.leadership,
      comment: updated.comment,
      createdAt: new Date(updated.created_at),
      updatedAt: new Date(updated.updated_at)
    };
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

