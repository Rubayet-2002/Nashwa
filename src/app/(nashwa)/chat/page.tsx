import { redirect } from "next/navigation";
import { authMe } from "@/app/(authentication)/lib/authMe";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const { user } = await authMe();
  if (!user) redirect("/email");

  const resolvedParams = await searchParams;

  return (
    <div className="w-full h-full overflow-hidden flex justify-center items-center">
      <div className="w-full max-w-6xl h-full">
        <ChatClient
          initialShopId={resolvedParams.shopId || null}
          currentUserId={user.uid}
          currentUsername={user.username}
        />
      </div>
    </div>
  );
}
