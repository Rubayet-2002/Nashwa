import { redirect } from "next/navigation";

export default async function ChatShopRedirectPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  redirect(`/chat?shopId=${encodeURIComponent(shopId)}`);
}
