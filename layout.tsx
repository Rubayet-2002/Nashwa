import { Toast } from "@/zustand/Toast";
import "./globals.css";
import { authMe } from "./(authentication)/lib/authMe";
import { redirect } from "next/navigation";
import UserStoreSetup from "../zustand/userSetup";
import { Metadata } from "next";

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
  
  const { user, clearCookies } = await authMe();
  if (clearCookies) redirect("/api/delete-cookie");

  return (
    <html lang="en">
      <body>
        <UserStoreSetup user={user} />
        {children}
        <Toast />
      </body>
    </html>
  );
}
