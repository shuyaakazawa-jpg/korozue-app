// @ts-nocheck
'use client';

import { supabaseBrowserClient } from '@/lib/supabaseBrowserClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Button,
  Box,
  Group,
  Burger,
  Drawer, // ⬅️ 引き出し（モバイルメニュー）
  Stack,  // ⬅️ 縦並び
  Text,
  ScrollArea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks'; // ⬅️ 開閉スイッチ

type User = {
  id: string;
  email?: string;
};
type Category = {
  id: string;
  name: string;
};

export default function AppHeader() {
  const router = useRouter();
  const supabase = supabaseBrowserClient;

  // 1. ⬇️ ハンバーガーボタンの開閉状態
  const [opened, { toggle, close }] = useDisclosure(false);

  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // ユーザー情報の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    // 初期データ取得（ユーザー & カテゴリ）
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. ⬇️ ヘッダーでもカテゴリ一覧を読み込む（スマホメニュー用）
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      setCategories(categoriesData || []);
    }
    getData();

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
    close(); // メニューを閉じる
  }

  return (
    <Box component="header" h={60} p="xs" style={(theme: any) => ({ borderBottom: `1px solid ${theme.colors.gray[2]}`, backgroundColor: 'white', position: 'sticky', top: 0, zIndex: 100 })}>
      <Container fluid style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
        <Group>
          {/* 3. ⬇️ ハンバーガーボタン (PCでは隠す hiddenFrom="sm") */}
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

          <Title order={2}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }} onClick={close}>
              KOROZUE
            </Link>
          </Title>
        </Group>

        {/* PC用のメニューボタン */}
        <Group spacing="xs" visibleFrom="xs">
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

      {/* 4. ⬇️ ここがスマホ用の「引き出しメニュー (Drawer)」
        opened が true の時だけ、画面の左からニョキッと出てきます
      */}
      <Drawer opened={opened} onClose={close} title="メニュー" size="75%" padding="md" hiddenFrom="sm">
        <ScrollArea h="calc(100vh - 60px)">
          <Stack spacing="md">

            {/* ログイン関連ボタン（スマホ用） */}
            {user ? (
              <Stack spacing="xs">
                <Button component={Link} href="/submit-report" variant="filled" onClick={close}>
                  失敗を投稿する
                </Button>
                <Button component={Link} href="/profile" variant="outline" onClick={close}>
                  マイページ
                </Button>
                <Button onClick={handleSignOut} variant="default">
                  ログアウト
                </Button>
              </Stack>
            ) : (
              <Button component={Link} href="/login" variant="default" onClick={close}>
                ログイン / 新規登録
              </Button>
            )}

            <hr style={{ width: '100%', borderTop: '1px solid #eee' }} />

            {/* カテゴリ一覧（スマホ用） */}
            <Text weight={700} size="lg">カテゴリ</Text>
            <Stack spacing="xs">
              <Text
                component={Link} href="/" size="sm" c="dimmed" onClick={close}
                sx={(theme: any) => ({ display: 'block', padding: '8px 0' }) as any}
              >
                すべて
              </Text>
              {categories.map((category) => (
                <Text
                  key={category.id}
                  component={Link}
                  href={`/category/${category.id}`}
                  size="sm" c="dimmed"
                  onClick={close} // クリックしたらメニューを閉じる
                  sx={(theme: any) => ({ display: 'block', padding: '8px 0' }) as any}
                >
                  {category.name}
                </Text>
              ))}
            </Stack>

          </Stack>
        </ScrollArea>
      </Drawer>

    </Box>
  );
}
