import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/utils/supabase/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LinkedManage | LinkedIn Account Manager",
  description: "Manage your rented LinkedIn accounts, track payments, and handle restrictions easily.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-auto">
              {children}
            </main>
          </div>
        ) : (
          <main className="min-h-screen">
            {children}
          </main>
        )}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
