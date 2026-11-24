import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { LangProvider } from "@/components/lang-context";
import { getLang, getT } from "@/lib/lang";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: { default: "Label Spelling", template: "%s · Label Spelling" },
    description: t("Pemeriksaan ejaan & teks label kemasan")
  };
}

export const viewport: Viewport = { themeColor: "#f7f6f2" };

// No saved choice: follow the OS setting before the first paint.
const THEME_FROM_OS = `if(!document.documentElement.dataset.theme)document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const saved = (await cookies()).get("theme")?.value;
  const theme = saved === "dark" || saved === "light" ? saved : undefined;
  const lang = await getLang();
  return (
    <html lang={lang} data-theme={theme} suppressHydrationWarning className={`${jakarta.variable} ${jetbrains.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_FROM_OS }} />
      </head>
      <body className="min-h-full">
        <LangProvider value={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
