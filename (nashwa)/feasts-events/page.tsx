import Link from "next/link";
import pool from "@/database/pool";
import { Store, Pin, Bookmark, Calendar } from "@mynaui/icons-react";
import EventCountdown from "@/components/EventCountdown";

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
    const eventsRes = await pool.query(
      `SELECT e.event_uid, e.shop_uid, e.title, e.description, e.image_url, e.host_name, e.venue, e.ends_at,
              s.shop_name, s.profile_photo_url AS shop_avatar
       FROM campus_event e
       JOIN shop s ON s.shop_uid = e.shop_uid
       ORDER BY e.ends_at ASC`
    );

    events = eventsRes.rows;
  } catch (error) {
    console.error("Error fetching feasts and events:", error);
  }

  return (
    <div className="flex-1 bg-[#fbfbfb] py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start min-h-0 overflow-y-auto">
      <div className="max-w-6xl w-full flex flex-col gap-8">
        
        {/* Banner/Header */}
        <div className="text-center bg-white border border-[#eaeaea] p-8 md:p-12 shadow-sm rounded-sm">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide text-[#1a1a1a]">
            Campus <span className="font-semibold text-[#BA5B55]">Feasts & Events</span>
          </h1>
          <p className="mt-3 text-sm text-[#787878] max-w-xl mx-auto font-light leading-relaxed">
            Discover and join active university festivals, winter food circles, pitha feasts, and grand campus events run by student entrepreneur businesses.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/shop/dashboard"
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-sm text-xs font-semibold text-[#BA5B55] bg-white border border-[#eaeaea] hover:bg-[#fbfbfb] transition-all shadow-sm"
            >
              Host an Event
            </Link>
          </div>
        </div>

        {/* Events Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-[#eaeaea] pb-3">
            <Calendar stroke={1.5} size={22} className="text-[#BA5B55]" />
            <h2 className="text-lg font-medium text-[#1a1a1a]">Upcoming Events</h2>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#eaeaea] rounded-sm">
              <Calendar stroke={1} size={48} className="mx-auto text-[#787878]/50 mb-3" />
              <p className="text-[#787878] text-sm">No events or feasts scheduled at the moment.</p>
              <Link href="/shop/dashboard" className="text-xs text-[#BA5B55] hover:underline mt-2 inline-block">
                Be the first to host an event &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const endVal = new Date(event.ends_at);
                const startVal = new Date(endVal.getTime() - 2 * 60 * 60 * 1000);
                const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                  event.title
                )}&dates=${formatDateForGCal(startVal)}/${formatDateForGCal(endVal)}&details=${encodeURIComponent(
                  event.description || ""
                )}&location=${encodeURIComponent(`${event.venue}, ${event.host_name}`)}`;

                return (
                  <div
                    key={event.event_uid}
                    className="group bg-white border border-[#eaeaea] shadow-sm hover:shadow-md hover:border-[#BA5B55]/40 transition-all duration-300 flex flex-col overflow-hidden rounded-sm"
                  >
                    {/* Cover Photo */}
                    <div className="relative h-48 w-full bg-[#f3f4f6] overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt="Event Cover"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f7f1f0] to-[#eceff3] text-[#BA5B55] text-xs font-medium uppercase tracking-[0.2em]">
                          Event Cover
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
                    </div>

                    {/* Event Details */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative w-6 h-6 rounded-full border border-[#eaeaea] bg-white overflow-hidden flex justify-center items-center shrink-0">
                          {event.shop_avatar ? (
                            <img
                              src={event.shop_avatar}
                              alt="Shop Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#f1f1f1] text-[#BA5B55] text-[8px] font-semibold uppercase tracking-[0.2em]">
                              S
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-[#787878] truncate">
                          Organized by <Link href={`/shop/${event.shop_uid}`} className="font-medium text-[#1a1a1a] hover:text-[#BA5B55] transition-colors">{event.shop_name}</Link>
                        </span>
                      </div>

                      <h3 className="font-semibold text-base text-[#1a1a1a] group-hover:text-[#BA5B55] transition-colors leading-tight mb-2">
                        {event.title}
                      </h3>

                      <p className="text-xs text-[#787878] font-light leading-relaxed line-clamp-3 mb-4 flex-1">
                        {event.description}
                      </p>

                      <div className="grid grid-cols-[16px_1fr] gap-x-2 gap-y-2 mt-auto text-xs text-[#787878] bg-[#fbfbfb] p-3 border border-[#eaeaea] rounded-sm">
                        <Bookmark size={14} className="text-[#BA5B55] mt-0.5" />
                        <div>
                          <span className="font-medium text-[#1a1a1a]">Host: </span>
                          <span className="font-light">{event.host_name}</span>
                        </div>
                        <Pin size={14} className="text-[#BA5B55] mt-0.5" />
                        <div>
                          <span className="font-medium text-[#1a1a1a]">Venue: </span>
                          <span className="font-light">{event.venue}</span>
                        </div>
                        <Calendar size={14} className="text-[#BA5B55] mt-0.5" />
                        <div>
                          <span className="font-medium text-[#1a1a1a]">Ends: </span>
                          <span className="font-light">{formatDisplayDate(event.ends_at)}</span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[#f4f4f4] pt-4 flex flex-col gap-3">
                        <EventCountdown endsAt={event.ends_at} />
                        
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={gCalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 border border-[#eaeaea] text-[#787878] text-xs font-medium hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all duration-300 rounded-sm"
                          >
                            <Calendar size={14} />
                            Add to Calendar
                          </a>
                          
                          <Link
                            href={`/shop/${event.shop_uid}`}
                            className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-[#BA5B55] border border-[#BA5B55] text-white text-xs font-medium hover:bg-white hover:text-[#BA5B55] transition-all duration-300 rounded-sm"
                          >
                            <Store size={14} />
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
        </div>
      </div>
    </div>
  );
}
