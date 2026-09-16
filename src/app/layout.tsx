import "@/styles/globals.css";

import Link from "next/link";

import { Analytics } from "@vercel/analytics/react";

import { inter } from "@/styles/fonts";

import { cn } from "@/lib/utils";

import { Header } from "@/components/layout/header";

import { getTheme } from "@/cookies/get";

import type { Metadata, Viewport } from "next";

import SakanaWidgetBox from "@/components/sakana-widget";

import { Heart, ArrowUpRight } from "lucide-react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "NOVA 课表",
  description:
    "A feature-rich calendar application built with Next.js, TypeScript, and Tailwind CSS. This project provides a modern, responsive interface for managing events and schedules with multiple viewing options.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const theme = getTheme();

  return (
    <html lang="en-US" className={cn(inter.variable, theme)}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <Analytics />
        <div className="flex-1">{children}</div>
        <SakanaWidgetBox />

        <footer className="w-full py-6 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            <Heart className="h-4 w-4" />
            <span>·&nbsp;基于&nbsp;
              <Link
                href="https://github.com/SuperKenVery/nju-schedule-ics"
                target="_blank"
                className="inline-flex gap-0.5 text-sm underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                nju-schedule-ics
                <ArrowUpRight size={12} className="text-foreground" />
              </Link>&nbsp;
              <Link
                href="https://github.com/lramos33/big-calendar"
                target="_blank"
                className="inline-flex gap-0.5 text-sm underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                big-calendar
                <ArrowUpRight size={12} className="text-foreground" />
              </Link>&nbsp;
              <Link
                href="https://github.com/Gu-Heping/YuqueSyncPlatform"
                target="_blank"
                className="inline-flex gap-0.5 text-sm underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                YuqueSyncPlatform
                <ArrowUpRight size={12} className="text-foreground" />
              </Link>&nbsp;
              <Link
                href="https://github.com/dsrkafuu/sakana-widget"
                target="_blank"
                className="inline-flex gap-0.5 text-sm underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                sakana-widget
                <ArrowUpRight size={12} className="text-foreground" />
              </Link>&nbsp;·&nbsp;by&nbsp;
              <Link
                href="https://github.com/Six-Yao"
                target="_blank"
                className="inline-flex gap-0.5 text-sm underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                Six-Yao
                <ArrowUpRight size={12} className="text-foreground" />
              </Link>
            </span>
          </p>
        </footer>
      </body>
    </html>
  );
}
