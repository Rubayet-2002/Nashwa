import Image from "next/image";
import Link from "next/link";
import pool from "@/database/pool";
import shopCover from "@/image/shopCover.png";
import shopProfile from "@/image/shopProfile.png";
import { Store, Pin } from "@mynaui/icons-react";

export const dynamic = "force-dynamic";

const Homepage = async () => {
  let shops: any[] = [];
  try {
    const shopsRes = await pool.query(
      "SELECT shop_uid, owner_uid, shop_name, shop_location, shop_description, cover_photo_url, profile_photo_url FROM shop WHERE status = 'approved' ORDER BY created_at DESC"
    );
    shops = shopsRes.rows;
  } catch (error) {
    console.error("Error fetching approved shops:", error);
  }

  return (
    <div className="flex-1 bg-[#fbfbfb] py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start min-h-0 overflow-y-auto">
      <div className="max-w-6xl w-full flex flex-col gap-8">
        {/* Banner/Header */}
        <div className="text-center bg-white border border-[#eaeaea] p-8 md:p-12 shadow-sm rounded-sm">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide text-[#1a1a1a]">
            Welcome to <span className="font-semibold text-[#BA5B55]">Nashwa</span>
          </h1>
          <p className="mt-3 text-sm text-[#787878] max-w-xl mx-auto font-light leading-relaxed">
            Discover unique local shops, high-quality handmade goods, and connect directly with shop owners within your university ecosystem.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/shop/create-shop"
              className="px-6 py-2.5 bg-[#BA5B55] border border-[#BA5B55] text-white text-xs tracking-wider uppercase font-medium hover:bg-white hover:text-[#BA5B55] transition-all duration-300 shadow-sm"
            >
              Start Your Shop
            </Link>
          </div>
        </div>

        {/* Shops Grid Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-[#eaeaea] pb-3">
            <Store stroke={1.5} size={22} className="text-[#BA5B55]" />
            <h2 className="text-lg font-medium text-[#1a1a1a]">Featured Shops</h2>
          </div>

          {shops.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#eaeaea] rounded-sm">
              <Store stroke={1} size={48} className="mx-auto text-[#787878]/50 mb-3" />
              <p className="text-[#787878] text-sm">No approved shops available at the moment.</p>
              <Link href="/shop/create-shop" className="text-xs text-[#BA5B55] hover:underline mt-2 inline-block">
                Be the first to open a shop &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <Link
                  key={shop.shop_uid}
                  href={`/shop/profile/${shop.shop_uid}`}
                  className="group bg-white border border-[#eaeaea] shadow-sm hover:shadow-md hover:border-[#BA5B55]/40 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Cover Photo */}
                  <div className="relative h-32 w-full bg-[#f3f4f6] overflow-hidden">
                    <Image
                      src={shop.cover_photo_url || shopCover}
                      alt="Shop Cover"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>

                  {/* Profile and Details */}
                  <div className="p-4 pt-0 relative flex-1 flex flex-col">
                    {/* Shop Profile Image */}
                    <div className="relative -mt-10 mb-3 w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden flex justify-center items-center">
                      <Image
                        src={shop.profile_photo_url || shopProfile}
                        alt="Shop Profile"
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Shop Info */}
                    <h3 className="font-semibold text-base text-[#1a1a1a] group-hover:text-[#BA5B55] transition-colors leading-tight">
                      {shop.shop_name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1 mt-1 text-xs text-[#787878]">
                      <Pin size={14} className="text-[#BA5B55]" />
                      <span className="truncate">{shop.shop_location}</span>
                    </div>

                    {/* Description */}
                    <p className="mt-3 text-xs text-[#787878] font-light leading-relaxed line-clamp-3 flex-1">
                      {shop.shop_description}
                    </p>

                    <div className="mt-4 border-t border-[#f4f4f4] pt-3 flex justify-between items-center text-xs">
                      <span className="text-[#BA5B55] font-medium group-hover:underline">Visit Shop</span>
                      <span className="text-[#787878]/60 font-light">Nashwa Verified</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Homepage;
