import "./globals.css";
import { Metadata } from "next";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { redirect } from "next/navigation";
import { Toast } from "@/zustand/Toast";
import AuthStoreSetup from "@/zustand/authSetup";
import SocketProvider from "@/components/SocketProvider";

export const metadata: Metadata = {
  title: "Nashwa — Student Entrepreneur Marketplace",
  description:
    "Nashwa is a social e-commerce platform for student entrepreneurs of Bangladesh. Discover unique handcrafted products, follow your favourite shops, and support campus businesses.",
  keywords: [
    "Nashwa",
    "student marketplace",
    "Bangladesh",
    "campus shopping",
    "student entrepreneurs",
  ],
  openGraph: {
    title: "Nashwa — Student Entrepreneur Marketplace",
    description:
      "Discover unique products from student entrepreneurs across Bangladesh.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, activeShopUid, clearCookies } = await authMe();
  if (clearCookies) redirect("/api/clear-cookie");

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthStoreSetup user={user} activeShopUid={activeShopUid} />
        <SocketProvider>{children}</SocketProvider>
        <Toast />
      </body>
    </html>
  );
}
