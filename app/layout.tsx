import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "emember - 명함 스캐너",
  description: "AI로 자동으로 정보를 추출하고 Google Sheets에 저장합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script 
          src="https://cdn.portone.io/v2/browser-sdk.js"
          defer
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}