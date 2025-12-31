import type { Metadata, Viewport } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

export const metadata: Metadata = {
  title: 'お金の診断 - あなたの金融タイプを診断',
  description:
    '10問の簡単な質問に答えるだけで、あなたの金融タイプがわかります。診断結果に基づいた10日間の無料メールコースで、お金の知識を身につけましょう。',
  keywords: ['金融', '診断', 'お金', '投資', '貯金', 'マネーリテラシー'],
  authors: [{ name: 'Money Onboarding' }],
  openGraph: {
    title: 'お金の診断 - あなたの金融タイプを診断',
    description:
      '10問の簡単な質問に答えるだけで、あなたの金融タイプがわかります。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'お金の診断',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'お金の診断 - あなたの金融タイプを診断',
    description:
      '10問の簡単な質問に答えるだけで、あなたの金融タイプがわかります。',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body className={`${notoSansJP.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
