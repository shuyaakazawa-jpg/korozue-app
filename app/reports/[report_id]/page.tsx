// @ts-nocheck
'use client'; // プランB（ブラウザ側）で動かします

import { supabaseBrowserClient } from '../../../lib/supabaseBrowserClient'; // ⚠️「../」3回
import { useRouter, useParams } from 'next/navigation'; // ⚠️ useParams を追加
import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Loader,
  Alert, // 警告ボックス
  Paper, // 論文用紙みたいなコンポーネント
  Box,   // ヘッダーで使った「万能な箱」
  Group,
} from '@mantine/core';
import Link from 'next/link';

// レポートの型（有料本文 paid_content も！）
type Report = {
  report_id: string;
  title: string;
  free_summary: string;
  paid_content: string; // ⬅️ ついに登場
  price: number;
  stripe_price_id: string;
};
// ユーザーの型
type User = {
  id: string;
  email?: string;
};

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams(); // URLから [report_id] を取得する道具
  const supabase = supabaseBrowserClient;

  const reportId = params.report_id as string; // URLから取得したID

  const [user, setUser] = useState<User | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [isPurchased, setIsPurchased] = useState(false); // ⬅️ 購入済みか？
  const [isLoading, setIsLoading] = useState(true);

  // ページが表示された直後に、全部チェックする
  useEffect(() => {
    if (!reportId) return; // IDがなければ何もしない

    async function getData() {
      // 1. ログインしてるか確認
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. レポートの詳細（有料本文も）を取得
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('report_id, title, free_summary, paid_content, price, stripe_price_id') // ⭐️ paid_content も取得
        .eq('report_id', reportId) // URLのIDと一致する
        .single(); // 1件だけ

      if (reportError || !reportData) {
        console.error('Error fetching report:', reportError);
        alert('レポートが見つかりません。');
        router.push('/');
        return;
      }
      setReport(reportData);

      // 3. 【最重要】ログインしていて、かつ、購入済みか？
      if (user) {
        const { data: purchaseData, error: purchaseError } = await supabase
          .from('purchases') // 購入履歴テーブルから
          .select('purchase_id')
          .eq('user_id', user.id) // ログイン中のユーザーが
          .eq('report_id', reportId) // このレポートを
          .maybeSingle(); // 買っていれば1件、なければnull

        if (purchaseData) {
          setIsPurchased(true); // 買ってた！
        }
      }

      setIsLoading(false); // 読み込み完了
    }

    getData();
  }, [supabase, router, reportId]); // reportIdが変わったら再実行

  // 決済処理（トップページと全く同じ）
  async function handleCheckout(priceId: string) {
    if (!user) { alert('購入するにはログインが必要です。'); router.push('/login'); return; }
    if (!priceId) { alert('この商品の価格IDが設定されていません。'); return; }
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

  // 読み込み中は、Mantineの「ぐるぐる」を表示
  if (isLoading || !report) {
    return (
      <Container style={{ paddingTop: '100px', textAlign: 'center' }}>
        <Loader size="xl" />
        <Text>レポートを読み込み中...</Text>
      </Container>
    );
  }

  //
  // 4. ⬇️ 購入済みか？で表示を変える
  //
  return (
    <>
      {/* --- メインコンテンツ部分 --- */}
      <Container style={{ paddingTop: '20px' }}>
        <Title order={1}>{report.title}</Title>
        <Text weight={500} style={{ marginTop: '10px' }}>価格: {report.price}円</Text>

        <hr style={{ margin: '20px 0' }} />

        {isPurchased ? (
          // 5. 【購入済みの人】有料本文を表示
          <Paper shadow="md" p="lg" withBorder>
            <Title order={3}>購入済みレポート（有料本文）</Title>
            <Text style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>
              {report.paid_content}
            </Text>
          </Paper>
        ) : (
          // 6. 【未購入の人】無料サマリーと購入ボタンを表示
          <>
            <Alert title="このレポートはまだ購入されていません" color="blue" variant="outline">
              無料サマリーのみ表示されています。購入すると、詳細な分析（有料本文）が読めるようになります。
            </Alert>

            <Paper shadow="md" p="lg" withBorder style={{ marginTop: '20px' }}>
              <Title order={3}>無料サマリー</Title>
              <Text style={{ marginTop: '15px' }}>
                {report.free_summary}
              </Text>
            </Paper>

            <Button
              color="green"
              size="lg"
              fullWidth
              style={{ marginTop: '20px' }}
              onClick={() => handleCheckout(report.stripe_price_id)}
              disabled={!report.stripe_price_id}
            >
              {report.price}円で購入して、有料本文を読む
            </Button>
          </>
        )}
      </Container>
    </>
  );
}
