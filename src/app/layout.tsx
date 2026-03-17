import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Noto_Sans_SC, Teko } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
});

const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OXYGEN 销售报价系统",
  description: "内部销售顾问使用的价格查询与权益计算工具",
  manifest: "/manifest.webmanifest",
  applicationName: "OXYGEN 销售报价系统",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OXYGEN 销售报价系统",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#03050b",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansSc.variable} ${teko.variable} antialiased`}
      >
        <div className="app-shell">
          {children}
        </div>
        <Script id="pwa-register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
