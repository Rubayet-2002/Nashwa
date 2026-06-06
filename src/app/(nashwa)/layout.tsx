import Navbar from "./navbar/Navbar";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { redirect } from "next/navigation";

export default async function NashwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, clearCookies } = await authMe();
  if (clearCookies) redirect("/api/clear-cookie");

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      suppressHydrationWarning
    >
      <Navbar user={user} />
      <main className="flex-1 flex min-h-0 px-5 py-4">{children}</main>
    </div>
  );
}
