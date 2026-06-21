'use client';

import React, { useEffect, useRef } from 'react';
import { useUserStore } from '../../store/userStore';
import { Button } from '@/components/ui/button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useUserStore();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
    onClose();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-background shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-200">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Đóng"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Icon + Title */}
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <svg className="h-7 w-7 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <h2 id="login-modal-title" className="text-2xl font-bold tracking-tight">
                Chào mừng bạn!
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Đăng nhập để quản lý đánh giá của bạn
              </p>
            </div>
          </div>

          {/* Benefits list */}
          <div className="mb-6 space-y-2.5 rounded-xl border bg-muted/40 p-4 text-sm">
            {[
              { icon: '🏢', text: 'Theo dõi các công ty bạn đã đánh giá' },
              { icon: '✏️', text: 'Chỉnh sửa đánh giá của bạn bất cứ lúc nào' },
              { icon: '🔒', text: 'Đánh giá được xác thực và đáng tin cậy hơn' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2.5">
                <span className="mt-px text-base">{icon}</span>
                <span className="text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>

          {/* Google Sign In Button */}
          <button
            id="login-with-google"
            onClick={handleGoogleLogin}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border/70 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-border hover:bg-gray-50 hover:shadow-md active:scale-[0.98] dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700"
          >
            {/* Google Logo */}
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Đăng nhập với Google</span>
          </button>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <span className="underline underline-offset-2 cursor-pointer hover:text-foreground">Điều khoản sử dụng</span>
            {' '}của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );
};
