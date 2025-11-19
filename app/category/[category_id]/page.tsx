'use client';

// ⚠️ 階層が変わるのでパスの「../」は3回になります
import { supabaseBrowserClient } from '../../../lib/supabaseBrowserClient';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation'; // ⬅️ useParamsを追加
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
  Alert // ⬅️ アラート用
} from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconInfoCircle } from '@tabler/icons-react';

// --- 型定義 ---
type Report = {
  report_id: string;
  title: string;
  free_summary: string;
  price: number;
  stripe_price_id: string;
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

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams(); // ⬅️ URLからIDを取得する道具
  const categoryId = params.category_id as string; // URLの [category_id] 部分

  const supabase = supabaseBrowserClient;
  const viewportRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategoryName, setCurrentCategoryName] = useState<string>(''); // ⬅️ 表示中のカテゴリ名
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getData() {
      // 1. ユーザー取得
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. サイドバー用の全カテゴリ取得
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      setCategories(categoriesData || []);

      // 3. 現在表示しているカテゴリの名前を取得
      if (categoriesData) {
        const current = categoriesData.find(c => c.id === categoryId);
        if (current) setCurrentCategoryName(current.name);
      }

      // 4. レポート一覧を取得（★ここでカテゴリIDで絞り込み！）
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          report_id, title, free_summary, price, stripe_price_id,
          profiles (username, avatar_url)
        `)
        .eq('category_id', categoryId); // ⬅️ ⭐️ ここが重要！カテゴリでフィルタリング

      if (reportsError) {
        console.error('Error fetching reports:', reportsError);
      } else {
        const formattedReports = reportsData.map((item: any) => ({
          ...item,
          profiles: item.profiles
        }));
        setReports(formattedReports);
      }
      setIsLoading(false);
    }
    getData();
  }, [supabase, categoryId]); // categoryIdが変わったら再実行

  // ログアウト処理
  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }

  // 決済処理
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
      {/* --- サイドバー (トップページと同じ) --- */}
      {/* @ts-ignore */}
      <Box
        component="nav"
        p="md"
        sx={(theme) => ({
          display: 'none',
          [theme.fn.largerThan('sm')]: { display: 'block' },
          minWidth: 240,
          borderRight: `1px solid ${theme.colors.gray[2]}`,
          minHeight: '100vh'
        })}
      >
        <Text weight={700} mb="md" size="lg">カテゴリ</Text>
        <Stack spacing="xs">
          <Text
            component={Link} href="/" size="sm" c="dimmed"
            sx={(theme) => ({
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
              component={Link} href={`/category/${category.id}`} size="sm"
              c={category.id === categoryId ? "blue" : "dimmed"} // 選択中のカテゴリは青色に
              weight={category.id === categoryId ? 700 : 400}
              sx={(theme) => ({
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
        {/* タイトルを表示 */}
        <Title order={1}>{currentCategoryName}</Title>
        <Text c="dimmed">{currentCategoryName}に関する失敗レポート一覧です。</Text>

        {reports.length === 0 ? (
          // 5. ⬇️ 投稿がない場合の表示
          <Alert icon={<IconInfoCircle size={16} />} title="投稿がありません" color="gray" mt="xl">
            {currentCategoryName} の投稿はまだありません。あなたが最初の投稿者になりませんか？
          </Alert>
        ) : (
          // 投稿がある場合はスライダーを表示
          <>
            <Group position="apart" style={{ marginTop: '30px' }}>
              <Title order={2}>レポート一覧</Title>
              <Group spacing="xs">
                <ActionIcon variant="default" onClick={() => handleScroll(-320)}><IconArrowLeft size={16} /></ActionIcon>
                <ActionIcon variant="default" onClick={() => handleScroll(320)}><IconArrowRight size={16} /></ActionIcon>
              </Group>
            </Group>

            <ScrollArea style={{ marginTop: '20px' }} viewportRef={viewportRef} type="never">
              <Flex gap="md">
                {reports.map((report: Report) => (
                  <Card shadow="sm" padding="lg" radius="md" withBorder key={report.report_id} style={{ minWidth: 320 }}>
                    <Group mb="sm">
                      <Avatar src={report.profiles?.avatar_url} radius="xl" size="sm" />
                      <Text size="sm" weight={500}>{report.profiles?.username || '名無しさん'}</Text>
                    </Group>
                    <Link href={`/reports/${report.report_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Title order={4} mb="xs">{report.title}</Title>
                      <Text size="sm" c="dimmed" lineClamp={3}>{report.free_summary}</Text>
                    </Link>
                    <Group position="apart" style={{ marginTop: '15px' }}>
                      <Text weight={500}>価格: {report.price}円</Text>
                      <Button color="green" onClick={() => handleCheckout(report.stripe_price_id)} disabled={!report.stripe_price_id} size="xs">
                        購入する
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Flex>
            </ScrollArea>
          </>
        )}
      </Box>
    </Flex>
  );
}
