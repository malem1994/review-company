'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CompanyCard } from '../components/CompanyCard';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { LoginModal } from '../components/LoginModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCompanyStore } from '../store';
import { useUserStore } from '../store/userStore';
import { Company } from '../types';

interface ToastMessage {
  id: number;
  title: string;
  description: string;
}

export default function HomePage() {
  const { companies, loading, error, fetchCompanies } = useCompanyStore();
  const { user, isAuthenticated, isLoading: authLoading, logout, _init } = useUserStore();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'reviews'>('rating');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Initialize Supabase Auth listener
  useEffect(() => {
    const unsubscribe = _init();
    return unsubscribe;
  }, [_init]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    if (!toast) return;

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;

    // Check for login success flag from cookie (set by callback route)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const hasPendingToast = getCookie('review-company-login-success');
    if (!hasPendingToast) return;

    // Clear the cookie
    document.cookie = 'review-company-login-success=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';

    setShowLoginModal(false);
    setToast({
      id: Date.now(),
      title: 'Đăng nhập thành công',
      description: `Chào mừng ${user.displayName}.`,
    });
  }, [authLoading, isAuthenticated, user]);

  const filteredCompanies = useCallback(() => {
    let filtered = [...companies];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.industry?.toLowerCase().includes(query) ||
        c.location?.toLowerCase().includes(query)
      );
    }

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
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className="fixed left-4 right-4 top-4 z-[60] rounded-lg border border-emerald-200 bg-white p-4 text-foreground shadow-lg sm:left-auto sm:w-96 dark:border-emerald-900 dark:bg-card toast-enter"
        >
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{toast.description}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Đóng thông báo"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h1 className="truncate text-xl font-semibold tracking-tight">
                Đánh Giá Công Ty Việt Nam
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {authLoading ? (
                <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
              ) : isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="h-9 w-9 rounded-md object-cover"
                      />
                    ) : (
                      <svg
                        className="h-9 w-9 text-muted-foreground"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    )}
                    <div className="flex flex-col min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    id="logout-button"
                    variant="default"
                    size="icon-sm"
                    onClick={() => logout()}
                    aria-label="Đăng xuất"
                    title="Đăng xuất"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-3h-9m9 0-3-3m3 3-3 3" />
                    </svg>
                  </Button>
                </>
              ) : (
                <Button
                  id="login-button"
                  variant="default"
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                >
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
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center mb-8">
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
        onLoginClick={() => {
          setSelectedCompany(null);
          setShowLoginModal(true);
        }}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
