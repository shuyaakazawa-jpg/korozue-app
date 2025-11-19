import type { Metadata } from "next";
import "./globals.css";

import '@mantine/core/styles.css';
import { ColorSchemeScript } from "@mantine/core";
import Providers from "./Providers";

// ⬇️ 1. さっき作ったヘッダーをインポート
import AppHeader from "./components/AppHeader";

export const metadata: Metadata = {
  title: "KOROZUE App",
  description: "失敗データベース",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers>
          {/* ⬇️ 2. ここにヘッダーを置く！ */}
          <AppHeader />

          {/* 各ページの中身はここに表示される */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
