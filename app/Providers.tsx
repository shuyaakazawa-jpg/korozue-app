'use client'; // ⬅️ これが最重要！「ブラウザ（表側）で動かす」合言葉

import { MantineProvider } from '@mantine/core';

export default function Providers({ children }: { children: React.ReactNode }) {
  // アプリ全体をMantineProviderで包む「部品」
  return (
    // ⬇️ ここにも defaultColorScheme="light" を追加！
    <MantineProvider defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}
