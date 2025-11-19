// @ts-nocheck
'use client';

import { supabaseBrowserClient } from '../lib/supabaseBrowserClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

import {
  Container,
  Title,
  Text,
  Button,
  Box,
  Group,
  Card,
  ScrollArea,
  Flex,
  ActionIcon,
  Loader,
  Stack,
  Avatar,
  Badge
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

// --- 型定義 ---
type Report = {
  report_id: string;
  title: string;
  free_summary: string;
  price: number;
  stripe_price_id: string;
  category_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
};
type User = {
  id: string;
  email?: string;
};
type Category = {
  id: string;
  name: string;
};

export default function Home() {
  const router = useRouter();
  const supabase = supabaseBrowserClient;
  const viewportRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) setUser(session.user);
      else setUser(null);
    });

    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      setCategories(categoriesData || []);

      const { data: reportsData } = await supabase
        .from('reports')
        .select(`
          report_id, title, free_summary, price, stripe_price_id, category_id,
          profiles (username, avatar_url)
        `);

      if (reportsData) {
        const formattedReports = reportsData.map((item: any) => ({
          ...item,
          profiles: item.profiles
        }));
        setReports(formattedReports);
      }
      setIsLoading(false);
    }
    getData();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleCheckout(priceId: string) {
    if (!user) {
      alert('購入するにはログインが必要です。');
      router.push('/login');
      return;
    }
    if (!priceId) {
      alert('この商品の価格IDが設定されていません。');
      return;
    }
    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: priceId, userId: user.id }),
      });
      const { url } = await response.json();
      if (!url) { alert('決済ページのURLが取得できませんでした。'); return; }
      window.location.href = url;
    } catch (error) {
      console.error('決済処理エラー:', error);
      alert('決済処理中にエラーが発生しました。');
    }
  }

  const handleScroll = (scrollAmount: number) => {
    if (viewportRef.current) {
      viewportRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <Container style={{ paddingTop: '100px', textAlign: 'center' }}>
        <Loader size="xl" />
        <Text>読み込み中...</Text>
      </Container>
    );
  }

  return (
    <Flex>
      {/* --- サイドバー (変更なし) --- */}
      <Box
        component="nav"
        p="md"
        sx={(theme: any) => ({
          display: 'none',
          [theme.fn.largerThan('sm')]: {
            display: 'block',
          },
          minWidth: 240,
          borderRight: `1px solid ${theme.colors.gray[2]}`,
          minHeight: '100vh'
        })}
      >
        <Text weight={700} mb="md" size="lg">カテゴリ</Text>
        <Stack spacing="xs">
          <Text
            component={Link} href="/" size="sm" c="dimmed"
            sx={(theme: any) => ({
              display: 'block', padding: '8px 12px', borderRadius: theme.radius.sm,
              '&:hover': { backgroundColor: theme.colors.gray[0], color: theme.black, transform: 'scale(1.02)' },
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.1s ease',
            })}
          >
            すべて
          </Text>
          {categories.map((category) => (
            <Text
              key={category.id}
              component={Link} href={`/category/${category.id}`} size="sm" c="dimmed"
              sx={(theme: any) => ({
                display: 'block', padding: '8px 12px', borderRadius: theme.radius.sm,
                '&:hover': { backgroundColor: theme.colors.gray[0], color: theme.black, transform: 'scale(1.02)' },
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.1s ease',
              })}
            >
              {category.name}
            </Text>
          ))}
        </Stack>
      </Box>

      {/* --- メインコンテンツ --- */}
      <Box component="main" p="md" style={{ flex: 1, overflow: 'hidden' }}>
        <Title order={1} mb="xl">失敗データベース</Title>

        <Stack spacing={50}>
          {categories.map((category) => {
            const categoryReports = reports.filter(r => r.category_id === category.id);
            if (categoryReports.length === 0) return null;

            return (
              <Box key={category.id}>
                <Group position="apart" mb="md">
                  <Title order={3}>{category.name}</Title>
                  <Button component={Link} href={`/category/${category.id}`} variant="subtle" size="xs">
                    もっと見る
                  </Button>
                </Group>

                <ScrollArea type="hover" offsetScrollbars>
                  <Flex gap="md" pb="sm">
                    {categoryReports.map((report) => (
                      <Card
                        shadow="sm"
                        padding="md" // ⬅️ パディングを少し小さく
                        radius="md"
                        withBorder
                        key={report.report_id}
                        // ⬇️ ⭐️ ここがポイント！画面サイズで幅を変える設定 ⭐️
                        sx={(theme: any) => ({
                          minWidth: 160, // スマホ: 160px (これで2.5個くらい並びます)
                          [theme.fn.largerThan('xs')]: {
                            minWidth: 200, // 少し大きいスマホ
                          },
                          [theme.fn.largerThan('sm')]: {
                            minWidth: 320, // PC/タブレット: 320px (元の大きさ)
                          },
                        })}
                      >

                        <Group mb="xs">
                          <Avatar src={report.profiles?.avatar_url} radius="xl" size="sm" />
                          <Text size="xs" weight={500} color="dimmed" truncate>
                            {report.profiles?.username || '名無し'}
                          </Text>
                        </Group>

                        <Link href={`/reports/${report.report_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Title order={5} mb="xs" lineClamp={1} title={report.title} size="sm">
                            {report.title}
                          </Title>
                          <Text size="xs" c="dimmed" lineClamp={3} mb="md" style={{ height: '45px' }}>
                            {report.free_summary}
                          </Text>
                        </Link>

                        <Group position="apart" mt="auto">
                          <Badge color="gray" variant="light" size="sm">{report.price}円</Badge>
                          <Button color="green" onClick={() => handleCheckout(report.stripe_price_id)} disabled={!report.stripe_price_id} size="xs" compact>
                            購入
                          </Button>
                        </Group>
                      </Card>
                    ))}
                  </Flex>
                </ScrollArea>
              </Box>
            );
          })}

          {reports.length === 0 && (
            <Text c="dimmed" align="center" mt="xl">レポートはまだありません。</Text>
          )}
        </Stack>
      </Box>
    </Flex>
  );
}
