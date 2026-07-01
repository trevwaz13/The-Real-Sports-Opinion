import type { Metadata } from "next";
import { Inter, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Inter as the site-wide default body font.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Frank Ruhl Libre — used only in the header (exposed via --font-header).
const frankRuhlLibre = Frank_Ruhl_Libre({
  variable: "--font-header",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RSO — NFL Stats, Rankings & Fantasy",
  description:
    "RSO: NFL stats, player & power rankings, standings, and fantasy — clean and uncluttered.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${frankRuhlLibre.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-primary text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
