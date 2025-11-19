'use client';

import { supabaseBrowserClient } from '../../lib/supabaseBrowserClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Button,
  Box,
  Group,
} from '@mantine/core';

type User = {
  id: string;
  email?: string;
};

export default function AppHeader() {
  const router = useRouter();
  const supabase = supabaseBrowserClient;
  const [user, setUser] = useState<User | null>(null);

  // ログイン状態のチェック
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase]);

  // ログアウト処理
  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <Box component="header" h={60} p="xs" style={(theme) => ({ borderBottom: `1px solid ${theme.colors.gray[2]}`, backgroundColor: 'white' })}>
      <Container fluid style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
        <Group>
          <Title order={2}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              KOROZUE
            </Link>
          </Title>
        </Group>

        <Group spacing="xs">
          {user ? (
            <>
              <Button component={Link} href="/submit-report" variant="filled">
                失敗を投稿する
              </Button>
              <Button component={Link} href="/profile" variant="outline">
                マイページ
              </Button>
              <Button onClick={handleSignOut} variant="default">
                ログアウト
              </Button>
            </>
          ) : (
            <Button component={Link} href="/login" variant="default">
              ログイン / 新規登録
            </Button>
          )}
        </Group>
      </Container>
    </Box>
  );
}
