  import type { Metadata } from "next";
  import { Geist, Geist_Mono } from "next/font/google";
  import "./globals.css";
  import '@mantine/charts/styles.css';

  import { AnalyticsProvider } from "@/components/DataStorageContext";

  const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
  });

  const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
  });

  import '@mantine/core/styles.css';

  import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';

  export const metadata = {
    title: 'Analytics Dashboard',
    description: '',
  };

  export default async function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    // const analyticsDataPromise = await getAnalyticsData();
    return (
      <html lang="en" {...mantineHtmlProps}>
        <head>
          <ColorSchemeScript />
        </head>
        <body>
          <AnalyticsProvider>
            <MantineProvider>{children}</MantineProvider>
          </AnalyticsProvider>
        </body>
      </html>
    );
  }