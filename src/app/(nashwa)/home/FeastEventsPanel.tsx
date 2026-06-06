import React from "react";

interface Event {
  event_uid: string;
  title: string;
  description: string | null;
  image_url: string | null;
  venue: string;
  start_at: string;
  ends_at: string;
}

export default function FeastEventsPanel({ events }: { events: Event[] }) {
  return (
    <div className="flex flex-col gap-4 min-h-0 flex-1 overflow-hidden">
      <div className="p-4 bg-white flex justify-start items-center gap-6 text-xs leading-none">
        <p className="text-[#ba5b55] hover:cursor-pointer">Feasts & Events</p>
      </div>

      {/* Events List */}
      <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar gap-4 bg-white">
        {events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#787878]">No upcoming events</p>
          </div>
        ) : (
          events.map((event) => {
            const start = new Date(event.start_at);
            const day = start.toLocaleDateString("en-BD", { day: "numeric" });
            const month = start.toLocaleDateString("en-BD", { month: "short" });
            return (
              <div
                key={event.event_uid}
                className="flex gap-3 border-b border-[#f0f0f0] pb-4 last:border-b-0 last:pb-0"
              >
                {/* Date Block */}
                <div className="shrink-0 w-12 flex flex-col items-center justify-center bg-[#fdf0ef] py-2 px-1 rounded-lg border border-[#e2e2e2] h-fit">
                  <span className="text-[9px] text-[#BA5B55] font-bold uppercase">{month}</span>
                  <span className="text-xl font-extrabold text-[#BA5B55] leading-none mt-0.5">{day}</span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#1a1a1a] truncate leading-normal" title={event.title}>
                    {event.title}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium truncate">{event.venue}</p>
                  {event.description && (
                    <p className="text-[10px] text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Event Image */}
                {event.image_url && (
                  <div className="shrink-0 w-11 h-11 overflow-hidden rounded border border-[#e2e2e2] bg-[#f4f4f4] relative">
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
