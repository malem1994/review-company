import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Set a flag to indicate successful login (for toast display after redirect)
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set('review-company-login-success', 'true', {
        httpOnly: false,
        maxAge: 60,
        path: '/',
        sameSite: 'lax',
      });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
