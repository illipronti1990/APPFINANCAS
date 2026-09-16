import type { Metadata } from "next";
import { Sora, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "APPFINANCAS — Renan Illipronti",
  description:
    "Controle pessoal de gastos e do que você deixou de gastar, com sincronização na nuvem.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${sora.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full font-[family-name:var(--font-body)] text-ink">
        {children}
      </body>
    </html>
  );
}
