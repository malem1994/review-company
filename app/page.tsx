"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { CompanyCard } from '../components/CompanyCard';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { Button } from '../components/UI';
import { useCompanyStore, useUserStore } from '../store';
import { Company } from '../types';

export default function HomePage() {
  const { companies, loading, error, fetchCompanies } = useCompanyStore();
  const { user, logout } = useUserStore();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'reviews'>('rating');

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filteredCompanies = useCallback(() => {
    let filtered = [...companies];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.industry?.toLowerCase().includes(query) ||
        c.location?.toLowerCase().includes(query)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return filtered;
  }, [companies, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">
                Đánh Giá Công Ty Việt Nam
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Xin chào, {user.nickname}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="sm">
                  Đăng nhập
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Tìm kiếm công ty theo tên, ngành nghề, hoặc địa điểm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'name' | 'reviews')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="rating">Sắp xếp theo đánh giá</option>
              <option value="name">Sắp xếp theo tên</option>
              <option value="reviews">Sắp xếp theo số đánh giá</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-4 text-gray-600">Đang tải danh sách công ty...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
            <Button
              variant="primary"
              className="mt-3"
              onClick={fetchCompanies}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Company Grid */}
        {!loading && !error && (
          <>
            {filteredCompanies().length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Không tìm thấy công ty nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCompanies().map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    onClick={setSelectedCompany}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2024 Đánh Giá Công Ty Việt Nam. Tất cả các đánh giá đều do người dùng đưa ra.
          </p>
        </div>
      </footer>

      {/* Company Drawer */}
      <CompanyDrawer
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  );
}
