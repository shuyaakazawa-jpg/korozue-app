'use client';

import { supabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import { Container, Paper, Title, Text } from '@mantine/core';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
// 1. ⬇️ ページ移動に必要な道具を追加
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const supabase = supabaseBrowserClient;
  const router = useRouter();

  // 2. ⬇️ ログイン状態を監視して、成功したらトップページへ飛ばす！
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/'); // トップページへ移動
        router.refresh(); // 画面を更新
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <Container size={420} my={40}>
      <Title align="center" sx={(theme) => ({ fontFamily: `Greycliff CF, ${theme.fontFamily}`, fontWeight: 900 })}>
        KOROZUE
      </Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        失敗から学ぶ、未来の成功確率を高めるデータベース
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#228be6',
                  brandAccent: '#1c7ed6',
                },
              },
            },
          }}
          providers={['google']}
          // ⬇️ Magic Linkなどのリダイレクト先
          redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined}

          localization={{
            variables: {
              sign_in: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                button_label: 'ログイン',
                social_provider_text: '{{provider}}でログイン',
                link_text: 'すでにアカウントをお持ちですか？ ログイン',
              },
              sign_up: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                button_label: '新規登録',
                link_text: 'アカウントをお持ちでないですか？ 新規登録',
                social_provider_text: '{{provider}}で登録',
              },
              forgotten_password: {
                email_label: 'メールアドレス',
                password_label: 'パスワード',
                button_label: 'パスワード再設定メールを送る',
                link_text: 'パスワードを忘れましたか？',
              },
            },
          }}
        />
      </Paper>
    </Container>
  );
}
