import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechStar | Premium Fintech Loan Marketplace",
  description: "Compare loans, credit cards and insurance with India's most trusted financial marketplace.",
};


import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { AIChatbot } from "@/components/ui/AIChatbot";
import { SmoothScroll } from "@/components/layout/SmoothScroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased transition-colors duration-300`}
    >
      <body className="min-h-full flex flex-col font-inter">
        <ThemeProvider>
          <AuthProvider>
            <SmoothScroll>
              {children}
            </SmoothScroll>
            <AIChatbot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
