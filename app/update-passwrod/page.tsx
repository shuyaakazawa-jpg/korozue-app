'use client';

import { useState } from 'react';
import { supabaseBrowserClient } from '../lib/supabaseBrowserClient'; // 階層に注意！
import { useRouter } from 'next/navigation';
import { Container, Paper, Title, PasswordInput, Button, Stack } from '@mantine/core';

export default function UpdatePasswordPage() {
  const supabase = supabaseBrowserClient;
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    setLoading(true);
    // ログイン済みのユーザーのパスワードを上書きする
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      alert('エラー: ' + error.message);
    } else {
      alert('パスワードを更新しました！');
      router.push('/'); // トップページへ
    }
    setLoading(false);
  };

  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Title align="center" mb="lg">新しいパスワード設定</Title>
        <Stack>
          <PasswordInput
            label="新しいパスワード"
            placeholder="パスワードを入力"
            required
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <Button fullWidth onClick={handleUpdatePassword} loading={loading}>
            パスワードを変更する
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
