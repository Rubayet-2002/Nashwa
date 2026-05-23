import Image from "next/image";
import { redirect } from "next/navigation";
import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { Mail, Telephone, Pin, User, CalendarArrowDown, Bookmark, ChatMessages, Package } from "@mynaui/icons-react";
import ShopOrderSystem from "../ShopOrderSystem";
import { ensureShopFollowTable } from "@/app/(nashwa)/lib/ensureShopFollowTable";
import FollowShopButton from "@/app/(nashwa)/component/FollowShopButton";
import ContactSellerWidget from "@/app/(nashwa)/component/ContactSellerWidget";

export const dynamic = "force-dynamic";

interface ShopProfileProps {
  params: Promise<{ shop_uid: string }>;
}

export default async function ShopProfilePage({ params }: ShopProfileProps) {
  const { shop_uid } = await params;
  const { user } = await authMe();
  const currentUser = user as
    | { username: string; email: string; phone?: string | null }
    | null;

  let shop: any = null;
  let products: Array<{ product_uid: string; title: string; description: string | null; price: string; currency: string; image_url: string | null; }> = [];
  try {
    await ensureShopFollowTable();

    const shopRes = await pool.query(
          `SELECT s.shop_uid, s.owner_uid, s.shop_name, s.shop_email, s.shop_phone, s.shop_location, s.shop_description, s.shop_bio, s.created_at,
            s.cover_photo_url, s.profile_photo_url, pu.university_name,
              u.username as owner_username, u.email as owner_email,
              COALESCE(fc.followers_count, 0)::int AS followers_count,
              CASE WHEN $2::text IS NOT NULL AND sf.user_uid IS NOT NULL THEN TRUE ELSE FALSE END AS is_following
       FROM shop s
       JOIN users u ON s.owner_uid = u.uid
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       LEFT JOIN shop_follow sf ON sf.shop_uid = s.shop_uid AND sf.user_uid = $2
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS followers_count
         FROM shop_follow fs
         WHERE fs.shop_uid = s.shop_uid
       ) fc ON true
       WHERE s.shop_uid = $1 AND s.status = 'approved'`,
      [shop_uid, user?.uid ?? null]
    );
    if (shopRes.rowCount && shopRes.rowCount > 0) {
      shop = shopRes.rows[0];
    }

    const productsRes = await pool.query(
      `SELECT p.product_uid, p.title, p.description, p.price, p.currency,
              (
                SELECT pi.image_url
                FROM product_image pi
                WHERE pi.product_uid = p.product_uid
                ORDER BY pi.position ASC, pi.id ASC
                LIMIT 1
              ) AS image_url
       FROM product p
       WHERE p.shop_uid = $1
       ORDER BY p.created_at DESC`,
      [shop_uid]
    );

    products = productsRes.rows;
  } catch (error) {
    console.error("Error fetching shop profile:", error);
  }

  if (!shop) {
    return (
      <div className="flex-1 bg-[#fbfbfb] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-[#eaeaea] p-8 shadow-sm rounded-sm">
          <h2 className="text-xl font-medium text-[#1a1a1a] mb-2">Shop Not Found</h2>
          <p className="text-sm text-[#787878] mb-6">
            The shop you are looking for does not exist or has not been approved yet.
          </p>
          <a href="/" className="px-5 py-2.5 bg-[#BA5B55] text-white text-xs uppercase tracking-wider font-medium hover:bg-white hover:text-[#BA5B55] border border-[#BA5B55] transition-all duration-300">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const joinedDate = new Date(shop.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
  const canFollow = Boolean(user?.uid) && user?.uid !== shop.owner_uid;

  return (
    <div className="flex-1 bg-[#fbfbfb] flex flex-col items-center justify-start min-h-0 overflow-y-auto">
      <div className="max-w-6xl w-full flex flex-col gap-6">

        <div className="bg-white border border-[#eaeaea] shadow-sm relative">
          <div className="h-48 md:h-64 relative bg-[#f3f4f6]">
            {shop.cover_photo_url ? (
              <Image
                src={shop.cover_photo_url}
                alt={`${shop.shop_name} Cover`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f7f1f0] to-[#eceff3] text-[#BA5B55] text-sm font-medium uppercase tracking-[0.25em]">
                Shop Cover
              </div>
            )}
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row sm:items-end sm:gap-6 relative">

            <div className="relative -mt-16 sm:-mt-20 w-32 h-32 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex justify-center items-center shrink-0">
              {shop.profile_photo_url ? (
                <Image
                  src={shop.profile_photo_url}
                  alt={`${shop.shop_name} Profile`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#f1f1f1] text-[#BA5B55] text-xs font-semibold uppercase tracking-[0.2em]">
                  Shop
                </div>
              )}
            </div>

            <div className="mt-4 sm:mt-0 flex-1 flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#1a1a1a]">{shop.shop_name}</h1>
                  <p className="text-xs text-[#787878] font-light flex items-center gap-1.5 mt-0.5">
                    <User size={14} className="text-[#BA5B55]" />
                    Owned by <span className="font-medium text-[#1a1a1a]">{shop.owner_username}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {user?.uid === shop.owner_uid ? (
                    <span className="px-4 py-2 text-xs font-medium text-[#8a8a8a]">Your shop</span>
                  ) : (
                    <>
                      <FollowShopButton
                        shopUid={shop.shop_uid}
                        initialIsFollowing={Boolean(shop.is_following)}
                        canFollow={canFollow}
                        className="flex items-center gap-1.5 px-4 py-2"
                      />
                      <ContactSellerWidget
                        shopUid={shop.shop_uid}
                        shopName={shop.shop_name}
                        shopOwnerUid={shop.owner_uid}
                        shopAvatar={shop.profile_photo_url}
                        currentUser={user ? { uid: user.uid, username: user.username } : null}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="mt-1 text-xs text-[#8a8a8a]">
                {shop.followers_count} Followers
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            <div className="bg-white border border-[#eaeaea] p-5 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">Bio</h3>
              <p className="text-sm text-[#4f4f4f] leading-relaxed font-light">
                {shop.shop_bio || shop.shop_description}
              </p>
            </div>

            <div className="bg-white border border-[#eaeaea] p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">About Info</h3>
              
              <div className="flex flex-col gap-3 text-sm text-[#787878]">
                {shop.university_name && (
                  <div className="flex items-center gap-3">
                    <Bookmark size={16} className="text-[#BA5B55] shrink-0" />
                    <span className="leading-tight">{shop.university_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Pin size={16} className="text-[#BA5B55] shrink-0" />
                  <span className="leading-tight">{shop.shop_location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[#BA5B55] shrink-0" />
                  <span className="leading-tight truncate">{shop.shop_email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Telephone size={16} className="text-[#BA5B55] shrink-0" />
                  <span className="leading-tight">{shop.shop_phone}</span>
                </div>
                <div className="flex items-center gap-3 border-t border-[#f4f4f4] pt-3 mt-1">
                  <CalendarArrowDown size={16} className="text-[#BA5B55] shrink-0" />
                  <span className="leading-tight">Member since {joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <ShopOrderSystem
              shopUid={shop.shop_uid}
              shopName={shop.shop_name}
              products={products}
              currentUser={currentUser}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
