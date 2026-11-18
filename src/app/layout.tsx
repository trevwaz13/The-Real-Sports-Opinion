import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreTicker from "@/components/ScoreTicker";

// Archivo: a variable-width grotesk. Headings run slightly wide to echo the
// logo; body text sits at normal width.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RSO | NFL Stats, Rankings & Fantasy",
  description:
    "RSO: NFL stats, player and power rankings, standings, and fantasy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-primary text-ink">
        {/* Apply the saved theme before paint so there's no flash of the wrong
            palette. No stored choice → follow the system (prefers-color-scheme). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('rso-theme');if(t==='dark')document.documentElement.classList.add('theme-dark');else if(t==='light')document.documentElement.classList.add('theme-light');}catch(e){}})();`,
          }}
        />
        <Header />
        <ScoreTicker />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
