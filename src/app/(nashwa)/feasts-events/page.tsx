import Link from "next/link";
import pool from "@/database/pool";
import { Store, Pin, Bookmark, Calendar } from "@mynaui/icons-react";
import EventCountdown from "../component/EventCountdown";

const formatDateForGCal = (date: Date | string) => {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

const formatDisplayDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const dynamic = "force-dynamic";

export default async function FeastsEventsPage() {
  let events: any[] = [];
  try {
    let eventsRes = await pool.query(
      `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at,
              s.shop_name, s.profile_photo_url AS shop_avatar
       FROM campus_event e
       JOIN shop s ON s.shop_uid = e.shop_uid
       ORDER BY e.ends_at ASC`
    );

    events = eventsRes.rows;

    if (events.length === 0) {
      const shopRes = await pool.query(`SELECT shop_uid FROM shop LIMIT 1`);
      if (shopRes.rowCount && shopRes.rowCount > 0) {
        const seedShopUid = shopRes.rows[0].shop_uid;

        const event1Uid = crypto.randomUUID();
        const ends1 = new Date();
        ends1.setDate(ends1.getDate() + 3);
        ends1.setHours(ends1.getHours() + 4);

        await pool.query(
          `INSERT INTO campus_event (event_uid, shop_uid, title, description, image_url, host_name, venue, ends_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
          [
            event1Uid,
            seedShopUid,
            "Inter University Pitha Utshav",
            "Get amazing traditional 'Pithas' in the Inter University Pitha Utshav. Visit United International University campus and enjoy the feasts. Updates available for all active students.",
            "https://res.cloudinary.com/dz3ds4zfh/image/upload/v1779436492/nashwa_products/cceb2fce-90ad-49c1-b61a-9446877a0368_1779436486.png",
            "United International University (UIU)",
            "UIU Campus Courtyard",
            ends1,
          ]
        );

        const event2Uid = crypto.randomUUID();
        const ends2 = new Date();
        ends2.setDate(ends2.getDate() + 5);
        ends2.setHours(ends2.getHours() + 2);

        await pool.query(
          `INSERT INTO campus_event (event_uid, shop_uid, title, description, image_url, host_name, venue, ends_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
          [
            event2Uid,
            seedShopUid,
            "Homemade Bakery Premium Carnival",
            "Indulge in fresh cupcakes, custom cookies, and premium baked delights directly on campus! Support student home bakers and join active tastings.",
            null,
            "Brac University (BracU)",
            "BracU Building 2 Lobby",
            ends2,
          ]
        );

        eventsRes = await pool.query(
          `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at,
                  s.shop_name, s.profile_photo_url AS shop_avatar
           FROM campus_event e
           JOIN shop s ON s.shop_uid = e.shop_uid
           ORDER BY e.ends_at ASC`
        );
        events = eventsRes.rows;
      }
    }
  } catch (error) {
    console.error("Error fetching feasts and events:", error);
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: "linear-gradient(135deg, #fdf8f6 0%, #f6f0ee 50%, #fdf4f2 100%)" }}>
      
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a08 0%, #2d1510 40%, #3d1e18 70%, #BA5B55 100%)" }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #BA5B55 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #e8a09a 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)" }} />

        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#f4a99c] animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#f4c4be]">Live & Upcoming Campus Events</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Campus Feasts
            <br />
            <span style={{ background: "linear-gradient(90deg, #f4a99c, #e87a72, #BA5B55)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              &amp; Events
            </span>
          </h1>

          <p className="mt-5 text-sm md:text-base text-white/60 max-w-lg leading-relaxed font-light">
            Discover and join active university festivals, winter food circles, pitha feasts, and grand campus events run by student entrepreneur businesses.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
              <span className="text-lg font-bold text-white">{events.length}</span>
              <span className="text-xs text-white/60 font-light">{events.length === 1 ? "Event" : "Events"} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:px-8">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg, #fdf0ee, #f8e0dc)" }}>
              <Calendar size={32} className="text-[#BA5B55]" />
            </div>
            <h2 className="text-xl font-semibold text-[#1a1a1a] mb-2">No Events Scheduled Yet</h2>
            <p className="text-sm text-[#787878] font-light max-w-sm leading-relaxed">
              No feasts or events are running right now. If you&apos;re a shop owner, add your first campus event from your Business Dashboard!
            </p>
            <Link
              href="/shop-dashboard-2"
              className="mt-6 px-6 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #BA5B55, #9e4a44)" }}
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event, index) => {
              const endVal = new Date(event.ends_at);
              const startVal = new Date(endVal.getTime() - 2 * 60 * 60 * 1000);
              const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                event.title
              )}&dates=${formatDateForGCal(startVal)}/${formatDateForGCal(endVal)}&details=${encodeURIComponent(
                event.description || ""
              )}&location=${encodeURIComponent(`${event.venue}, ${event.host_name}`)}`;

              const isFeatured = index === 0;

              return (
                <div
                  key={event.event_uid}
                  className={`group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col ${isFeatured ? "md:col-span-2" : ""}`}
                  style={{ border: "1px solid #ede5e2" }}
                >
                  {/* Featured badge */}
                  {isFeatured && (
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white" style={{ background: "linear-gradient(135deg, #BA5B55, #9e4a44)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Featured Event
                    </div>
                  )}

                  {/* Cover Image */}
                  <div className={`relative overflow-hidden ${isFeatured ? "h-72 md:h-80" : "h-52"} w-full bg-[#f8f0ee]`}>
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3" style={{ background: "linear-gradient(135deg, #fdf8f6 0%, #f3e8e4 100%)" }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #BA5B55 0%, #9e4a44 100%)" }}>
                          <Calendar size={24} className="text-white" />
                        </div>
                        <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[#BA5B55]">Nashwa Event</span>
                      </div>
                    )}
                    {/* Overlay gradient at bottom */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)" }} />

                    {/* Shop pill over image */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
                      <div className="relative h-5 w-5 rounded-full overflow-hidden border border-white/40 bg-white/20 flex justify-center items-center">
                        {event.shop_avatar ? (
                          <img src={event.shop_avatar} alt={event.shop_name} className="w-full h-full object-cover" />
                        ) : (
                          <Store size={10} className="text-white" />
                        )}
                      </div>
                      <span className="text-xs text-white/90 font-medium">{event.shop_name}</span>
                    </div>
                  </div>

                  {/* Event Body */}
                  <div className={`flex flex-col flex-1 gap-4 ${isFeatured ? "p-7 md:p-8" : "p-6"}`}>
                    {/* Title & Description */}
                    <div>
                      <h2 className={`font-bold text-[#1a1a1a] group-hover:text-[#BA5B55] transition-colors leading-snug ${isFeatured ? "text-2xl md:text-3xl" : "text-xl"}`}>
                        {event.title}
                      </h2>
                      <p className={`mt-2 text-[#6f6f6f] leading-relaxed font-light ${isFeatured ? "text-sm" : "text-xs line-clamp-3"}`}>
                        {event.description}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl" style={{ background: "#fdf8f6", border: "1px solid #f0e6e2" }}>
                        <Bookmark size={14} className="text-[#BA5B55] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#BA5B55] mb-0.5">Hosted By</p>
                          <p className="text-xs text-[#1a1a1a] font-semibold leading-snug">{event.host_name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl" style={{ background: "#fdf8f6", border: "1px solid #f0e6e2" }}>
                        <Pin size={14} className="text-[#BA5B55] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#BA5B55] mb-0.5">Venue</p>
                          <p className="text-xs text-[#1a1a1a] font-semibold leading-snug">{event.venue}</p>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-[#787878] font-light">
                      <Calendar size={13} className="text-[#BA5B55]" />
                      <span>Ends on {formatDisplayDate(event.ends_at)}</span>
                    </div>

                    {/* Countdown + Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4" style={{ borderTop: "1px solid #f4ece9" }}>
                      <EventCountdown endsAt={event.ends_at} />

                      <div className="flex items-center gap-2">
                        <a
                          href={gCalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#555] bg-white hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all shadow-sm cursor-pointer"
                          style={{ border: "1px solid #e8e0dd" }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Add to Calendar
                        </a>

                        <Link
                          href={`/shop/profile/${event.shop_uid}`}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 shadow-sm"
                          style={{ background: "linear-gradient(135deg, #BA5B55, #9e4a44)" }}
                        >
                          <Store size={12} />
                          Visit Shop
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {events.length > 0 && (
          <div className="mt-12 rounded-3xl p-8 text-center" style={{ background: "linear-gradient(135deg, #1a0a08 0%, #2d1510 60%, #BA5B55 100%)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#f4c4be]">Are you a shop owner?</p>
            <h2 className="mt-2 text-xl font-bold text-white">Host your own campus feast or event</h2>
            <p className="mt-2 text-sm text-white/60 max-w-md mx-auto font-light">
              Add your events from the Business Dashboard and let students across all campuses discover you.
            </p>
            <Link
              href="/shop-dashboard-2"
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-[#BA5B55] bg-white hover:bg-white/90 transition-all shadow-sm"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
