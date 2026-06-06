import pool from "@/database/pool";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const { user } = await authMe();

  let product: any = null;
  let imageList: string[] = [];
  let initialIsFollowing = false;

  try {
    // Fetch product detail along with shop information
    const productRes = await pool.query(
      `SELECT p.product_uid, p.title, p.description, p.price, p.original_price,
              p.discount_percent, p.currency, p.category, p.product_type,
              p.inside_delivery_charge, p.outside_delivery_charge, p.free_on_campus_delivery,
              p.sold_count, p.avg_rating, p.variants,
              s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url AS shop_profile_photo_url, s.owner_uid,
              s.avg_rating AS shop_rating, s.follower_count AS shop_follower_count,
              u.username AS owner_name,
              pu.university_name AS shop_university_name
       FROM product p
       JOIN shop s ON s.shop_uid = p.shop_uid
       JOIN users u ON u.uid = s.owner_uid
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid AND sju.status = 'approved'
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       WHERE p.product_uid = $1 AND p.status = 'active'`,
      [productId]
    );

    if (productRes.rowCount === 0) {
      notFound();
    }

    product = productRes.rows[0];

    // Fetch product images
    const imagesRes = await pool.query(
      "SELECT image_url FROM product_image WHERE product_uid = $1 ORDER BY position ASC, id ASC",
      [productId]
    );
    const images = imagesRes.rows.map((img) => img.image_url);

    // If no images returned, fall back to main image_url if any
    imageList = images.length > 0 ? images : [];

    // Check if user is following the shop
    if (user) {
      const followRes = await pool.query(
        "SELECT 1 FROM shop_follow WHERE shop_uid = $1 AND user_uid = $2",
        [product.shop_uid, user.uid]
      );
      initialIsFollowing = (followRes.rowCount ?? 0) > 0;
    }
  } catch (err) {
    console.error("Product detail page error:", err);
    notFound();
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="h-full bg-[#f2f4f7] py-6 px-4 overflow-y-auto custom-scrollbar lg:overflow-hidden lg:h-full flex flex-col justify-start items-center min-h-0">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
        <ProductDetailsClient
          product={product}
          images={imageList}
          currentUserId={user?.uid || null}
          currentUserRole={user?.role || null}
          initialIsFollowing={initialIsFollowing}
        />
      </div>
    </div>
  );
}
