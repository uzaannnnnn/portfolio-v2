import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Muhamad Fauzan",
    template: "%s | Muhamad Fauzan",
  },
  description:
    "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

const antiFoitScript = `(function(){try{var s=localStorage.getItem("portfolio_theme");var l=localStorage.getItem("portfolio_language");var m=window.matchMedia("(prefers-color-scheme: dark)").matches;var isDark=s==="dark"||((!s||s==="system")&&m);var root=document.documentElement;if(isDark){root.classList.add("dark");root.classList.remove("light");root.setAttribute("data-theme","dark");root.style.colorScheme="dark";}else{root.classList.add("light");root.classList.remove("dark");root.setAttribute("data-theme","light");root.style.colorScheme="light";}var lang=l==="id"?"id":"en";root.lang=lang;root.setAttribute("data-language",lang);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: antiFoitScript,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-button-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
          >
            Skip to main content
          </a>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
