import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // "next"というパラメータがあれば、そこへ飛ばす（なければトップページへ）
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    // コードを使ってログインセッションを確立する
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 指定されたページへ転送
  return NextResponse.redirect(requestUrl.origin + next);
}
