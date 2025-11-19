'use client';

import { supabaseBrowserClient } from '../../lib/supabaseBrowserClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // ⬅️ useEffect をインポート
import {
  Container,
  Title,
  Text,
  Button,
  Loader,
  TextInput,
  Textarea,
  NumberInput,
  Select, // ⬅️ プルダウン（Select）をインポート
  Box,
  Group,
} from '@mantine/core';
import Link from 'next/link';

// ユーザーの型
type User = {
  id: string;
  email?: string;
};

// 1. ⬇️ カテゴリの型
type Category = {
  id: string;
  name: string;
};
// ⬇️ MantineのSelectで使う型
type SelectItem = {
  value: string;
  label: string;
};

export default function SubmitReportPage() {
  const router = useRouter();
  const supabase = supabaseBrowserClient;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. ⬇️ DBから取ってきたカテゴリを保存する場所
  const [categories, setCategories] = useState<SelectItem[]>([]);

  // 3. ⬇️ ページが表示されたら、カテゴリ一覧をDBから読み込む
  useEffect(() => {
    async function getCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true }); // 名前順で

      if (error) {
        console.error('カテゴリの取得に失敗:', error);
      } else {
        // Mantineの<Select>が使える形（valueとlabel）に変換
        const formattedCategories = data.map(cat => ({
          value: cat.id,
          label: cat.name,
        }));
        setCategories(formattedCategories);
      }
    }

    // ログインチェック
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        await getCategories(); // ログインしてたら、カテゴリを読み込む
        setIsLoading(false);
      }
    }
    checkUser();
  }, [supabase, router]);

  // フォームが送信された時の処理
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    if (!user) {
      alert('ログインしていません。処理を中断します。');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = formData.get('title') as string;
    const free_summary = formData.get('free_summary') as string;
    const paid_content = formData.get('paid_content') as string;
    const price = formData.get('price') as string;
    const category_id = formData.get('category_id') as string; // ⬅️ 4. プルダウンで選んだID

    const payload = {
      title,
      free_summary,
      paid_content,
      price,
      userId: user.id,
      category_id: category_id // ⬅️ 5. APIに渡す
    };

    try {
      const response = await fetch('/api/create-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'レポートの作成に失敗しました。');
      }

      const { report } = await response.json();
      console.log('Report submitted:', report);
      alert('投稿が完了しました！');

      router.push('/');
      router.refresh();

    } catch (error: any) {
      console.error('送信エラー:', error);
      alert('エラーが発生しました: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Container style={{ paddingTop: '100px', textAlign: 'center' }}>
        <Loader size="xl" />
      </Container>
    );
  }

  return (
    <>
      {/* --- メインコンテンツ部分 --- */}
      <Container style={{ paddingTop: '20px' }}>
        <Title order={1}>失敗レポートを投稿する</Title>

        <Box component="form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>

          <TextInput label="タイトル:" name="title" required />

          {/* 6. ⬇️ カテゴリのプルダウンを追加！ ⬇️ */}
          <Select
            label="カテゴリ:"
            name="category_id"
            placeholder="カテゴリを選択してください"
            data={categories} // DBから読み込んだカテゴリ一覧
            required
            searchable // 検索もできるようにする
          />

          <Textarea label="無料サマリー (概要):" name="free_summary" required minRows={4} />
          <Textarea label="有料本文 (詳細な分析・教訓):" name="paid_content" required minRows={8} />
          <NumberInput label="価格 (円):" name="price" defaultValue={1000} min={100} required />

          <Button type="submit" mt="md" loading={isSubmitting}>
            レポートを審査に提出する
          </Button>
        </Box>
      </Container>
    </>
  );
}
