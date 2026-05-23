import Image from "next/image";
import Link from "next/link";
import pool from "@/database/pool";
import { Store, Pin } from "@mynaui/icons-react";
import { authMe } from "@/app/(authentication)/lib/authMe";
import ProductFeedCard, { FeedProduct } from "./component/ProductFeedCard";
import EventCountdown from "./component/EventCountdown";

export const dynamic = "force-dynamic";

const Homepage = async () => {
  const { user } = await authMe();
  let shops: any[] = [];
  let products: FeedProduct[] = [];
  let homepageEvents: any[] = [];
  try {
    const shopsRes = await pool.query(
      `SELECT s.shop_uid, s.owner_uid, s.shop_name, s.shop_location, s.shop_description,
              s.cover_photo_url, s.profile_photo_url, pu.university_name
       FROM shop s
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       WHERE s.status = 'approved'
       ORDER BY pu.university_name ASC NULLS LAST, s.created_at DESC`
    );
    shops = shopsRes.rows;

    const productsRes = await pool.query(
      `SELECT p.product_uid, p.title, p.description, p.price, p.currency,
              (
                SELECT pi.image_url
                FROM product_image pi
                WHERE pi.product_uid = p.product_uid
                ORDER BY pi.position ASC, pi.id ASC
                LIMIT 1
              ) AS image_url,
              (
                SELECT COALESCE(json_agg(pi.image_url ORDER BY pi.position ASC, pi.id ASC), '[]'::json)
                FROM product_image pi
                WHERE pi.product_uid = p.product_uid
              ) AS image_urls,
              (
                SELECT COUNT(*)::int
                FROM product_comment pc
                WHERE pc.product_uid = p.product_uid
              ) AS comment_count,
              s.shop_uid, s.shop_name, s.shop_location, s.profile_photo_url AS shop_profile_photo_url, pu.university_name AS shop_university_name
       FROM product p
       JOIN shop s ON s.shop_uid = p.shop_uid
       LEFT JOIN shop_join_university sju ON sju.shop_uid = s.shop_uid
       LEFT JOIN partner_university pu ON pu.university_uid = sju.university_uid
       WHERE s.status = 'approved'
       ORDER BY p.created_at DESC
       LIMIT 20`
    );
    products = productsRes.rows;

    const eventsRes = await pool.query(
      `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at,
              s.shop_name
       FROM campus_event e
       JOIN shop s ON s.shop_uid = e.shop_uid
       ORDER BY e.created_at DESC
       LIMIT 3`
    );
    homepageEvents = eventsRes.rows;
  } catch (error) {
    console.error("Error fetching approved shops:", error);
  }

  if (user) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f6f4f2] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)_340px] xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          {/* LEFT COLUMN: Top Shops / Campus Favorites */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-[#eadfdb] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#BA5B55]">Top Shops</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">Campus favorites</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6f6f6f]">
                Shops sorted by university first so your campus network stays at the top.
              </p>
            </div>

            <div className="space-y-3">
              {shops.slice(0, 6).map((shop) => (
                <Link
                  key={shop.shop_uid}
                  href={`/shop/profile/${shop.shop_uid}`}
                  className="flex gap-3 rounded-2xl border border-[#e8e1df] bg-white p-3 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#f3f4f6]">
                    {shop.profile_photo_url ? (
                      <Image src={shop.profile_photo_url} alt={shop.shop_name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#BA5B55]">
                        <Store size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-[#1a1a1a]">{shop.shop_name}</h3>
                    </div>
                    {shop.university_name && (
                      <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.18em] text-[#BA5B55]">{shop.university_name}</p>
                    )}
                    <p className="mt-1 truncate text-xs text-[#7f7f7f]">{shop.shop_location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </aside>

          {/* CENTER COLUMN: Social Feed Stream */}
          <main className="min-w-0 space-y-4">
            <div className="rounded-3xl border border-[#eadfdb] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#BA5B55]">Feed</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#1a1a1a]">Fresh products from shops you follow</h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6f6f6f]">
                React, comment, and jump into a shop profile like a social feed. Feasts and events are listed in the right column!
              </p>
            </div>

            <div className="space-y-4">
              {products.length === 0 ? (
                <div className="rounded-3xl border border-[#e8e1df] bg-white p-10 text-center text-sm text-[#7f7f7f] shadow-sm">
                  No products published yet.
                </div>
              ) : (
                products.map((product) => <ProductFeedCard key={product.product_uid} product={product} />)
              )}
            </div>
          </main>

          {/* RIGHT COLUMN: Feasts & Events teaser & Spotlight */}
          <aside className="space-y-4">
            {/* Feasts & Events Box */}
            <div className="rounded-3xl border border-[#eadfdb] bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#BA5B55]">Spotlight</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">Feasts & Events</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6f6f6f]">
                Check out active university festivals, feasts, and events organized by our top student entrepreneur shops.
              </p>
              <Link
                href="/Feasts-Events"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#BA5B55] hover:underline"
              >
                <span>Explore all campus events</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Link>
            </div>

            {/* Dynamic Event Display Cards */}
            {homepageEvents.length > 0 ? (
              homepageEvents.map((event) => (
                <div
                  key={event.event_uid}
                  className="rounded-3xl border border-[#eadfdb] bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  {event.image_url ? (
                    <div className="relative h-44 w-full bg-[#f3f4f6]">
                      <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-28 bg-[#fcf7f6] flex items-center justify-center text-[#BA5B55] border-b border-[#efe4e2]">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                  )}

                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#1a1a1a] line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-[#787878] mt-1 font-light line-clamp-2">{event.description}</p>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-[#555] font-light">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#BA5B55]">Host:</span>
                        <span>{event.host_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#BA5B55]">Venue:</span>
                        <span>{event.venue}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#f4ecea] pt-3 flex items-center justify-between">
                      <EventCountdown endsAt={event.ends_at} />
                      <Link
                        href="/Feasts-Events"
                        className="text-xs font-semibold text-[#BA5B55] hover:underline"
                      >
                        Explore &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-[#e8e1df] bg-white p-6 text-center text-xs text-[#787878] font-light shadow-sm">
                No active feasts or events scheduled right now. Check back soon!
              </div>
            )}

            {/* From Nashwa Box */}
            <div className="rounded-3xl border border-[#eadfdb] bg-white p-5 shadow-sm flex flex-col gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#BA5B55]">From Nashwa</p>
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 border border-[#eef0f3]">
                <Image
                  src="https://res.cloudinary.com/dz3ds4zfh/image/upload/v1779436492/nashwa_products/cceb2fce-90ad-49c1-b61a-9446877a0368_1779436486.png"
                  alt="Nashwa culture"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#1a1a1a]">UIU Pitha Utshav 2026</h3>
                <p className="text-xs text-[#787878] mt-1 font-light leading-relaxed">
                  Directorate of Career Counseling & Student Affairs (DCCSA) at United International University is organizing the grand inter-university winter carnival. Discover unique booths and traditional food circles.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
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
                    {shop.cover_photo_url ? (
                      <Image
                        src={shop.cover_photo_url}
                        alt="Shop Cover"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f7f1f0] to-[#eceff3] text-[#BA5B55] text-xs font-medium uppercase tracking-[0.2em]">
                        Shop Cover
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>

                  {/* Profile and Details */}
                  <div className="p-4 pt-0 relative flex-1 flex flex-col">
                    {/* Shop Profile Image */}
                    <div className="relative -mt-10 mb-3 w-16 h-16 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden flex justify-center items-center">
                      {shop.profile_photo_url ? (
                        <Image
                          src={shop.profile_photo_url}
                          alt="Shop Profile"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#f1f1f1] text-[#BA5B55] text-[10px] font-semibold uppercase tracking-[0.2em]">
                          Shop
                        </div>
                      )}
                    </div>

                    {/* Shop Info */}
                    <h3 className="font-semibold text-base text-[#1a1a1a] group-hover:text-[#BA5B55] transition-colors leading-tight">
                      {shop.shop_name}
                    </h3>

                    {shop.university_name && (
                      <div className="mt-2 inline-flex items-center rounded-full border border-[#efe4e2] bg-[#fcf7f6] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#BA5B55]">
                        {shop.university_name}
                      </div>
                    )}

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
