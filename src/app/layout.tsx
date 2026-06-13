import type { Metadata, Viewport } from "next";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Script from "next/script";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://techstarsolution.in"),
  title: "Techstar Money Solution | Premium Fintech Loan Marketplace & DSA",
  description: "Compare loans, credit cards, and insurance with Techstar Money Solution - India's most trusted financial loan marketplace.",
  keywords: "loan dsa, personal loan, business loan, home loan, loan agent, mortgage loan, finance service",
  openGraph: {
    title: "Techstar Money Solution | Premium Fintech Loan Marketplace & DSA",
    description: "Compare loans, credit cards, and insurance with Techstar Money Solution - India's most trusted financial loan marketplace.",
    url: "https://techstarsolution.in",
    siteName: "Techstar Money Solution",
    images: [
      {
        url: "/partners.png",
        width: 1200,
        height: 630,
        alt: "Techstar Money Solution Fintech Marketplace"
      }
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Techstar Money Solution | Premium Fintech Loan Marketplace & DSA",
    description: "Compare loans, credit cards, and insurance with India's most trusted financial marketplace.",
    images: ["/partners.png"],
  }
  robots: { index: true, follow: true },
};


import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { AIChatbot } from "@/components/ui/AIChatbot";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { SEOSchema } from "@/components/ui/SEOSchema";
import { MobileBottomNav } from "@/components/ui/MobileBottomNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased transition-colors duration-300"
    >
      <body className="min-h-full flex flex-col font-inter">
        {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y8ZY3SCES2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-Y8ZY3SCES2');
          `}
        </Script>

        <SEOSchema type="Organization" />
        <SEOSchema type="WebSite" />
        <ThemeProvider>
          <AuthProvider>
            <SmoothScroll>
              {children}
            </SmoothScroll>
            <AIChatbot />
            <MobileBottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
