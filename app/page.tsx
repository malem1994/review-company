"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { CompanyCard } from '../components/CompanyCard';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

  const visibleCompanies = filteredCompanies();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Đánh Giá Công Ty Việt Nam
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Xin chào, {user.nickname}
                  </span>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <Button variant="default" size="sm">
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
        <Card className="mb-8 py-4">
          <CardContent className="flex flex-col gap-4 px-4 sm:flex-row">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Tìm kiếm công ty theo tên, ngành nghề, hoặc địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Tìm kiếm công ty"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'name' | 'reviews')}
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                aria-label="Sắp xếp công ty"
              >
                <option value="rating">Sắp xếp theo đánh giá</option>
                <option value="name">Sắp xếp theo tên</option>
                <option value="reviews">Sắp xếp theo số đánh giá</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 mx-auto text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-4 text-muted-foreground">Đang tải danh sách công ty...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button
              variant="default"
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
            {visibleCompanies.length === 0 ? (
              <div className="rounded-xl border bg-card py-12 text-center text-muted-foreground shadow-sm">
                <p>Không tìm thấy công ty nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleCompanies.map((company) => (
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
      <footer className="mt-12 border-t bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-muted-foreground">
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
