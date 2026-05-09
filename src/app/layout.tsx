import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Active Recall Vocab",
  description: "MVP học từ vựng với active recall + spaced repetition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground transition-colors duration-300">
        <ThemeProvider>
          <AuthProvider>
            <ReactQueryProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-6">
                  {children}
                </main>
              </div>
            </ReactQueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
