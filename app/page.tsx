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
      {/* --- サイドバー --- */}
      <Box
        component="nav"
        p="md"
        visibleFrom="sm" // ⬅️ ⭐️ 【重要】スマホ(sm未満)では非表示にする設定！
        style={{
          minWidth: 240,
          borderRight: '1px solid lightgray',
          minHeight: '100vh'
        }}
      >
        <Text fw={700} mb="md" size="lg">カテゴリ</Text>
        <Stack gap="xs"> {/* spacing ではなく gap */}
          <Text
            component={Link} href="/" size="sm" c="dimmed"
            style={{ display: 'block', padding: '8px 12px' }}
          >
            すべて
          </Text>
          {categories.map((category) => (
            <Text
              key={category.id}
              component={Link} href={`/category/${category.id}`} size="sm" c="dimmed"
              style={{ display: 'block', padding: '8px 12px' }}
            >
              {category.name}
            </Text>
          ))}
        </Stack>
      </Box>

      {/* --- メインコンテンツ --- */}
      <Box component="main" p="md" style={{ flex: 1, overflow: 'hidden' }}>
        <Title order={1} mb="xl" size="h2">失敗データベース</Title>

        <Stack gap={50}> {/* spacing ではなく gap */}
          {categories.map((category) => {
            const categoryReports = reports.filter(r => r.category_id === category.id);
            if (categoryReports.length === 0) return null;

            return (
              <Box key={category.id}>
                <Group justify="space-between" mb="md"> {/* position="apart" ではなく justify="space-between" */}
                  <Title order={3} size="h4">{category.name}</Title>
                  <Button component={Link} href={`/category/${category.id}`} variant="subtle" size="xs">
                    もっと見る
                  </Button>
                </Group>

                <ScrollArea type="hover" offsetScrollbars>
                  <Flex gap="md" pb="sm">
                    {categoryReports.map((report) => (
                      <Card
                        shadow="sm"
                        withBorder
                        key={report.report_id}
                        // ⬇️ ⭐️ 【重要】スマホでは160px、PCでは320pxにする設定！
                        miw={{ base: 160, sm: 320 }}
                        padding={{ base: 'xs', sm: 'lg' }} // スマホでは余白も小さく
                        radius="md"
                      >

                        <Group mb="xs" gap="xs">
                          <Avatar
                            src={report.profiles?.avatar_url}
                            radius="xl"
                            // ⬇️ アイコンサイズもスマホで小さく
                            size={{ base: 'xs', sm: 'sm' }}
                          />
                          <Text
                            // ⬇️ 文字サイズもスマホで小さく
                            size={{ base: 'xs', sm: 'sm' }}
                            fw={500}
                            c="dimmed"
                            truncate
                          >
                            {report.profiles?.username || '名無し'}
                          </Text>
                        </Group>

                        <Link href={`/reports/${report.report_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <Title
                            order={4}
                            mb="xs"
                            lineClamp={1}
                            title={report.title}
                            // ⬇️ タイトル文字サイズも小さく
                            size={{ base: 'sm', sm: 'h4' }}
                          >
                            {report.title}
                          </Title>
                          <Text
                            c="dimmed"
                            lineClamp={3}
                            mb="md"
                            // ⬇️ 本文文字サイズも小さく
                            size={{ base: 'xs', sm: 'sm' }}
                            style={{ height: '3.6em' }} // 高さ調整
                          >
                            {report.free_summary}
                          </Text>
                        </Link>

                        <Group justify="space-between" mt="auto">
                          <Badge color="gray" variant="light" size="sm">{report.price}円</Badge>
                          <Button
                            color="green"
                            onClick={() => handleCheckout(report.stripe_price_id)}
                            disabled={!report.stripe_price_id}
                            size="xs"
                            compact
                          >
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
