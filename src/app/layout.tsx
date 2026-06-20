import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Script from "next/script";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://techstarsolution.in"),
  title: "Techstar Money Solution – Instant Loans, Best Rates & DSA Partner",
  description: "Apply for Personal, Home, Business & LAP loans with instant approval. Compare 50+ banks, check eligibility in 2 minutes & get quick disbursal. Trusted by thousands across India.",
  keywords: "instant loan, personal loan, home loan, business loan, loan against property, loan dsa, low interest loan, loan agent india",
  openGraph: {
    title: "Techstar Money Solution – Instant Loans, Best Rates & DSA Partner",
    description: "Apply for Personal, Home, Business & LAP loans with instant approval. Compare 50+ banks, check eligibility in 2 minutes & get quick disbursal. Trusted by thousands across India.",
    url: "https://techstarsolution.in",
    siteName: "Techstar Money Solution",
    images: [
      {
        url: "/partners.png",
        width: 1200,
        height: 630,
        alt: "Techstar Money Solution – India's Trusted Loan Marketplace"
      }
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Techstar Money Solution – Instant Loans, Best Rates & DSA Partner",
    description: "Compare 50+ banks. Personal, Home, Business & LAP loans with quick approval & low interest rates.",
    images: ["/partners.png"],
  },
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
      className={`${plusJakartaSans.variable} ${outfit.variable} ${playfairDisplay.variable} ${inter.variable} h-full antialiased transition-colors duration-300`}
    >
      <body className="min-h-full flex flex-col font-sans">
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
