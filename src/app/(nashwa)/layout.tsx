import { authMe } from "../(authentication)/lib/authMe";
import { redirect } from "next/navigation";
import Navbar from "./component/Navbar";

export default async function NashwaLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { user, clearCookies } = await authMe();
  if (clearCookies) redirect("/api/delete-cookie");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar user={user} />
      <main className="flex-1 flex min-h-0 px-5 py-4">{children}</main>
    </div>
  );
}

