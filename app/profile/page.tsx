// @ts-nocheck
'use client';

// ⚠️ 階層が深いので '../' は2回です
import { supabaseBrowserClient } from '../../lib/supabaseBrowserClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Loader,
  Tabs,
  Card,
  Group,
  Button,
  Stack,
  Badge,
  Avatar,     // ⬅️ 画像表示用
  Modal,      // ⬅️ 編集画面（ポップアップ）用
  TextInput,  // ⬅️ 名前入力用
  FileInput   // ⬅️ 画像アップロード用
} from '@mantine/core';
import { IconShoppingCart, IconPencil, IconUpload, IconUser } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks'; // ⬅️ モーダル開閉の道具

// 型定義
type User = {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
};

type Report = {
  report_id: string;
  title: string;
  price: number;
  free_summary: string;
};

type Purchase = {
  purchase_id: string;
  purchased_at: string;
  reports: Report;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = supabaseBrowserClient;

  // 1. ⬇️ モーダル（編集画面）の開閉管理スイッチ
  const [opened, { open, close }] = useDisclosure(false);

  const [user, setUser] = useState<User | null>(null);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [myPurchases, setMyPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 編集用のステート
  const [editName, setEditName] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      // 型アサーション
      setUser(user as any);
      setEditName(user.user_metadata?.full_name || '');

      // 投稿履歴
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reportsData) setMyReports(reportsData);

      // 購入履歴
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('*, reports(*)')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (purchasesData) {
        setMyPurchases(purchasesData as unknown as Purchase[]);
      }

      setIsLoading(false);
    }
    getData();
  }, [supabase, router]);

  // プロフィール更新処理
  async function handleUpdateProfile() {
    if (!user) return;
    setIsUpdating(true);

    try {
      let avatarUrl = user.user_metadata.avatar_url;

      // 画像が選択されていたらアップロード
      if (editFile) {
        const fileExt = editFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, editFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // ユーザー情報を更新
      const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: editName,
          avatar_url: avatarUrl,
        }
      });

      if (updateError) throw updateError;

      if (updatedUser) setUser(updatedUser as any);
      alert('プロフィールを更新しました！');
      close(); // 成功したら閉じる

    } catch (error: any) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました: ' + error.message);
    } finally {
      setIsUpdating(false);
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
    <Container size="md" style={{ paddingTop: '40px', paddingBottom: '40px' }}>

      {/* プロフィールヘッダー */}
      <Stack align="center" spacing="xs" mb={40}>
        {/* アバター画像 */}
        <Avatar
          src={user?.user_metadata?.avatar_url}
          alt={user?.user_metadata?.full_name}
          size={120}
          radius={120}
          color="blue"
        >
          {user?.user_metadata?.full_name?.[0] || <IconUser size={60} />}
        </Avatar>

        {/* 名前 */}
        <Title order={2}>
          {user?.user_metadata?.full_name || '名無しさん'}
        </Title>
        <Text c="dimmed">{user?.email}</Text>

        <Group>
          {/* 2. ⬇️ ここに「編集ボタン」があります！ */}
          <Button variant="outline" size="xs" onClick={open}>
            プロフィールを編集
          </Button>
          <Button component={Link} href="/" variant="default" size="xs">
            トップページに戻る
          </Button>
        </Group>
      </Stack>

      {/* --- 3. ⬇️ 編集用モーダル（隠れている画面） --- */}
      <Modal opened={opened} onClose={close} title="プロフィールの編集" centered>
        <Stack>
          <TextInput
            label="お名前（ニックネーム）"
            placeholder="例: 失敗 太郎"
            value={editName}
            onChange={(event) => setEditName(event.currentTarget.value)}
          />

          <FileInput
            label="プロフィール画像"
            placeholder="画像を選択してください"
            accept="image/png,image/jpeg"
            icon={<IconUpload size={14} />}
            value={editFile}
            onChange={setEditFile}
          />

          <Button onClick={handleUpdateProfile} loading={isUpdating}>
            保存する
          </Button>
        </Stack>
      </Modal>
      {/* --- ここまで --- */}

      {/* タブ切り替え */}
      <Tabs defaultValue="purchased" variant="outline">
        <Tabs.List position="center">
          <Tabs.Tab value="purchased" icon={<IconShoppingCart size={16} />}>
            購入したレポート ({myPurchases.length})
          </Tabs.Tab>
          <Tabs.Tab value="posted" icon={<IconPencil size={16} />}>
            投稿したレポート ({myReports.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="purchased" pt="xl">
          {myPurchases.length === 0 ? (
            <Text align="center" c="dimmed" mt="xl">まだ購入したレポートはありません。</Text>
          ) : (
            <Stack>
              {myPurchases.map((purchase) => (
                <Card key={purchase.purchase_id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group position="apart">
                    <div>
                      <Text size="xs" c="dimmed">
                        購入日: {new Date(purchase.purchased_at).toLocaleDateString()}
                      </Text>
                      <Text weight={500} size="lg" mt={5}>
                        {purchase.reports?.title || '削除されたレポート'}
                      </Text>
                      <Badge color="green" variant="light" mt={5}>
                        購入済み
                      </Badge>
                    </div>
                    <Button component={Link} href={`/reports/${purchase.reports?.report_id}`} variant="light">
                      読む
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="posted" pt="xl">
          {myReports.length === 0 ? (
            <Text align="center" c="dimmed" mt="xl">まだ投稿したレポートはありません。</Text>
          ) : (
            <Stack>
              {myReports.map((report) => (
                <Card key={report.report_id} shadow="sm" padding="lg" radius="md" withBorder>
                  <Group position="apart">
                    <div>
                      <Text weight={500} size="lg">{report.title}</Text>
                      <Text size="sm" c="dimmed">価格: {report.price}円</Text>
                    </div>
                    <Button component={Link} href={`/reports/${report.report_id}`} variant="subtle">
                      詳細を見る
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}
        </Tabs.Panel>
      </Tabs>

    </Container>
  );
}
