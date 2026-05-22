import "./globals.css";
import { Metadata } from "next";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { redirect } from "next/navigation";
import { Toast } from "@/zustand/Toast";
import AuthStoreSetup from "@/zustand/authSetup";


export const metadata: Metadata = {
  title: "Nashwa - Bangladesh",
  description:
    "Nashwa is a social E-commerce platform form the student entrepreneurs of Bangladesh. We provide a platform for the students to sell their products and earn money. We also provide a platform for the customers to buy products from the students. Our mission is to empower the student entrepreneurs of Bangladesh and help them grow their businesses.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const { user, activeShopUid, clearCookies } = await authMe();
  if (clearCookies) redirect("/api/clear-cookie");


  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthStoreSetup user={user} activeShopUid={activeShopUid} />
        {children}
        <Toast />
      </body>
    </html>
  );
}
