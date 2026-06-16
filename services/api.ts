import { Company, CompanyRating, User } from '../types';

// Simulated API delay
const API_DELAY = 300;

// Mock data storage (in-memory)
let companies: Company[] = [
  {
    id: '1',
    name: 'Techcombank',
    logo: 'https://via.placeholder.com/80x80?text=TCB',
    slug: 'techcombank',
    description: 'Ngân hàng TMCP Kỹ Thương Việt Nam - một trong những ngân hàng hàng đầu tại Việt Nam',
    industry: 'Ngân hàng / Tài chính',
    location: 'Hà Nội',
    averageRating: 4.2,
    reviewCount: 1250,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-06-01')
  },
  {
    id: '2',
    name: 'VNPT',
    logo: 'https://via.placeholder.com/80x80?text=VNPT',
    slug: 'vnpt',
    description: 'Tập đoàn Bưu chính Viễn thông Việt Nam - nhà cung cấp dịch vụ viễn thông hàng đầu',
    industry: 'Viễn thông',
    location: 'Hà Nội',
    averageRating: 3.8,
    reviewCount: 890,
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2024-05-15')
  },
  {
    id: '3',
    name: 'VinGroup',
    logo: 'https://via.placeholder.com/80x80?text=VNG',
    slug: 'vingroup',
    description: 'Tập đoàn tư nhân lớn nhất Việt Nam với nhiều lĩnh vực: bất động sản, ô tô, bán lẻ',
    industry: 'Đa ngành',
    location: 'Vinhomes Riverside, Hà Nội',
    averageRating: 3.5,
    reviewCount: 2100,
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2024-06-10')
  },
  {
    id: '4',
    name: 'FPT Software',
    logo: 'https://via.placeholder.com/80x80?text=FPT',
    slug: 'fpt-software',
    description: 'Công ty phần mềm hàng đầu Việt Nam với dịch vụ outsourcing và sản phẩm công nghệ',
    industry: 'Công nghệ thông tin',
    location: 'Quận 7, TP.HCM',
    averageRating: 4.5,
    reviewCount: 560,
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2024-06-12')
  },
  {
    id: '5',
    name: 'MoMo',
    logo: 'https://via.placeholder.com/80x80?text=MoMo',
    slug: 'momo',
    description: 'Ví điện tử và nền tảng fintech phổ biến nhất Việt Nam',
    industry: 'Fintech',
    location: 'TP.HCM',
    averageRating: 4.0,
    reviewCount: 3200,
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2024-06-08')
  }
];

let ratings: CompanyRating[] = [
  {
    id: 'r1',
    companyId: '1',
    userId: 'u1',
    benefits: 5,
    environment: 4,
    leadership: 4,
    comment: 'Môi trường làm việc rất tốt, phúc lợi hấp dẫn. Lương thưởng cạnh tranh và có nhiều cơ hội phát triển career.',
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-05-20')
  },
  {
    id: 'r2',
    companyId: '1',
    userId: undefined,
    nickname: 'AnonUser123',
    benefits: 4,
    environment: 4,
    leadership: 5,
    comment: 'Công ty có văn hóa tốt, lãnh đạo thân thiện và lắng nghe nhân viên. Tuy nhiên áp lực công việc đôi khi cao.',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01')
  },
  {
    id: 'r3',
    companyId: '4',
    userId: 'u2',
    benefits: 5,
    environment: 5,
    leadership: 4,
    comment: 'Great company with excellent work-life balance. Modern tech stack and supportive management team.',
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-15')
  }
];

// Helper to delay for simulated API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Company API
export const companyService = {
  async getAllCompanies(): Promise<Company[]> {
    await delay(API_DELAY);
    return [...companies];
  },

  async getCompanyById(id: string): Promise<Company | null> {
    await delay(API_DELAY / 2);
    return companies.find(c => c.id === id) || null;
  },

  async getCompanyBySlug(slug: string): Promise<Company | null> {
    await delay(API_DELAY / 2);
    return companies.find(c => c.slug === slug) || null;
  },

  async recalcCompanyAverage(companyId: string): Promise<Company | null> {
    await delay(API_DELAY / 2);
    const companyRatings = ratings.filter(r => r.companyId === companyId);
    if (companyRatings.length === 0) {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        company.averageRating = 0;
        company.reviewCount = 0;
        return { ...company };
      }
      return null;
    }

    const sum = companyRatings.reduce((acc, r) => acc + r.benefits + r.environment + r.leadership, 0);
    const avg = (sum / (companyRatings.length * 3));
    const roundedAvg = Math.round(avg * 10) / 10;

    const companyIndex = companies.findIndex(c => c.id === companyId);
    if (companyIndex === -1) return null;

    companies[companyIndex] = {
      ...companies[companyIndex],
      averageRating: roundedAvg,
      reviewCount: companyRatings.length,
      updatedAt: new Date()
    };

    return { ...companies[companyIndex] };
  }
};

// Rating API
export const ratingService = {
  async getRatingsByCompany(companyId: string): Promise<CompanyRating[]> {
    await delay(API_DELAY / 2);
    return ratings
      .filter(r => r.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getUserRatingForCompany(
    companyId: string,
    userId?: string,
    nickname?: string
  ): Promise<CompanyRating | null> {
    await delay(API_DELAY / 4);
    const identifier = userId || nickname;
    if (!identifier) return null;

    return ratings.find(
      r => r.companyId === companyId &&
           (userId ? r.userId === userId : r.nickname === nickname)
    ) || null;
  },

  async createRating(data: {
    companyId: string;
    userId?: string;
    nickname?: string;
    benefits: number;
    environment: number;
    leadership: number;
    comment: string;
  }): Promise<CompanyRating> {
    await delay(API_DELAY);
    const { companyId, userId, nickname, benefits, environment, leadership, comment } = data;

    // Check for existing rating
    const existing = await this.getUserRatingForCompany(companyId, userId, nickname);
    if (existing) {
      throw new Error('User already has a rating for this company');
    }

    const newRating: CompanyRating = {
      id: `r${Date.now()}`,
      companyId,
      userId,
      nickname,
      benefits,
      environment,
      leadership,
      comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    ratings.push(newRating);
    return newRating;
  },

  async updateRating(
    ratingId: string,
    data: Partial<{
      benefits: number;
      environment: number;
      leadership: number;
      comment: string;
    }>
  ): Promise<CompanyRating> {
    await delay(API_DELAY);
    const index = ratings.findIndex(r => r.id === ratingId);
    if (index === -1) {
      throw new Error('Rating not found');
    }

    ratings[index] = {
      ...ratings[index],
      ...data,
      updatedAt: new Date()
    };

    return ratings[index];
  },

  async deleteRating(ratingId: string): Promise<void> {
    await delay(API_DELAY / 2);
    const index = ratings.findIndex(r => r.id === ratingId);
    if (index !== -1) {
      ratings.splice(index, 1);
    }
  }
};

// User API (mock)
export const userService = {
  async login(email: string, password: string): Promise<User> {
    await delay(API_DELAY);
    // Mock login - in real app would authenticate
    return {
      id: `u${Date.now()}`,
      email,
      nickname: email.split('@')[0],
      isAuthenticated: true
    };
  },

  async logout(): Promise<void> {
    await delay(API_DELAY / 4);
    // Mock logout - just clears local state
  }
};

export type { Company, CompanyRating, User };
