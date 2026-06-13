"use client";

import { useState, useTransition } from "react";
import ImageUpload from "@/components/ImageUpload";
import Lightbox from "@/components/Lightbox";
import { useToastStore } from "@/zustand/toastStore";
import { Check, X, Plus, Store } from "@mynaui/icons-react";

interface CampusEvent {
  event_uid: string;
  admin_uid: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  venue: string;
  start_at: string;
  ends_at: string;
  created_at: string;
}

interface ProductSubmission {
  event_uid: string;
  product_uid: string;
  shop_uid: string;
  status: string;
  reviewed_at: string | null;
  product_title: string;
  product_price: string;
  shop_name: string;
  owner_uid: string;
  event_title: string;
  product_image: string | null;
}

interface AdminEventsClientProps {
  initialEvents: CampusEvent[];
  initialSubmissions: ProductSubmission[];
}

export default function AdminEventsClient({
  initialEvents,
  initialSubmissions,
}: AdminEventsClientProps) {
  const [activeTab, setActiveTab] = useState<"events" | "submissions">("events");
  const [events, setEvents] = useState<CampusEvent[]>(initialEvents);
  const [submissions, setSubmissions] = useState<ProductSubmission[]>(initialSubmissions);
  const addToast = useToastStore((s) => s.addToast);
  const [isPending, startTransition] = useTransition();

  

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venue.trim() || !startAt || !endsAt) {
      addToast("Please fill in all required fields", "error");
      return;
    }
    if (!bannerUrl) {
      addToast("Please upload and crop an event banner", "error");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            title,
            description,
            image_url: bannerUrl,
            venue,
            start_at: new Date(startAt).toISOString(),
            ends_at: new Date(endsAt).toISOString(),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          addToast(data.message, "success");
          setEvents([data.event, ...events]);
          setTitle("");
          setDescription("");
          setVenue("");
          setStartAt("");
          setEndsAt("");
          setBannerUrl(null);
        } else {
          addToast(data.message || "Failed to create event", "error");
        }
      } catch (err) {
        addToast("Error creating event", "error");
      }
    });
  };

  

  const handleSubmissionAction = (eventUid: string, productUid: string, action: "approve" | "reject") => {
    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/event-products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            event_uid: eventUid,
            product_uid: productUid,
            action,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          addToast(data.message, "success");
          setSubmissions(
            submissions.map((sub) =>
              sub.event_uid === eventUid && sub.product_uid === productUid
                ? { ...sub, status: action === "approve" ? "approved" : "rejected" }
                : sub
            )
          );
        } else {
          addToast(data.message || "Failed to process submission", "error");
        }
      } catch (err) {
        addToast("Error processing submission", "error");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 text-[#e0e0e0] font-sans selection:bg-[#BA5B55] selection:text-white">
      {/* Tab Switcher and Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2a2a2a] pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Feasts &amp; Events Management</h2>
          <p className="text-xs text-[#888]">Organize campus shopping festivals and review merchant participation requests.</p>
        </div>

        <div className="flex bg-[#181818] p-1.5 rounded-lg border border-[#333] gap-1">
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "events" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
            }`}
          >
            <span>Events Calendar</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "events" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
              {events.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "submissions" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
            }`}
          >
            <span>Submissions</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "submissions" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
              {submissions.filter((s) => s.status === "pending").length} pending
            </span>
          </button>
        </div>
      </div>

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* List of Events */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[#BA5B55] uppercase tracking-wider mb-2">Existing Campus Events</h3>

            {events.length === 0 ? (
              <div className="flex flex-col justify-center items-center border border-dashed border-[#333] rounded-xl p-12 text-center gap-3 bg-[#161616]/50 min-h-[300px]">
                <h3 className="text-base font-semibold text-[#aaa]">No campus events scheduled</h3>
                <p className="text-xs text-[#666] max-w-sm">Use the creator panel on the right to post the first campus shopping festival.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {events.map((ev) => (
                  <div key={ev.event_uid} className="bg-[#1e1e1e] border border-[#333] rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row">
                    <div
                      className="md:w-56 h-36 bg-neutral-900 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                      onClick={() => ev.image_url && setLightboxSrc(ev.image_url)}
                    >
                      {ev.image_url ? (
                        

                        <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-neutral-800">
                          No Banner
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-base leading-tight mb-1">{ev.title}</h4>
                        <p className="text-xs text-[#999] line-clamp-2 leading-relaxed mb-3">
                          {ev.description || "No description provided."}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-y-2 gap-x-4 text-[10px] text-gray-400 border-t border-[#2d2d2d] pt-3">
                        <p>
                          <strong className="text-white">Venue:</strong> {ev.venue}
                        </p>
                        <p>
                          <strong className="text-white">Starts:</strong> {new Date(ev.start_at).toLocaleString()}
                        </p>
                        <p>
                          <strong className="text-white">Ends:</strong> {new Date(ev.ends_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Event Form */}
          <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[#BA5B55] uppercase tracking-wider mb-2">Create New Event</h3>

            <form onSubmit={handleAddEvent} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-2">
                <label className="text-[#aaa] font-semibold">Event Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Nashwa BUP Shopping Festival"
                  className="w-full p-3 bg-[#141414] border border-[#333] rounded-xl text-white outline-none focus:border-[#BA5B55] text-xs transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#aaa] font-semibold">Venue / Campus Location</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. BUP Plaza"
                  className="w-full p-3 bg-[#141414] border border-[#333] rounded-xl text-white outline-none focus:border-[#BA5B55] text-xs transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-[#aaa] font-semibold">Start Time</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full p-3 bg-[#141414] border border-[#333] rounded-xl text-white outline-none focus:border-[#BA5B55] text-[10px] transition-colors"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[#aaa] font-semibold">End Time</label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full p-3 bg-[#141414] border border-[#333] rounded-xl text-white outline-none focus:border-[#BA5B55] text-[10px] transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#aaa] font-semibold">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe details, activities, participant guidelines, etc..."
                  rows={3}
                  className="w-full p-3 bg-[#141414] border border-[#333] rounded-xl text-white outline-none focus:border-[#BA5B55] text-xs transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#aaa] font-semibold">Event Banner (Widescreen cropped)</label>
                <ImageUpload
                  circularCrop={false}
                  aspectRatio={2.5}
                  folder="events"
                  onUploaded={(url: any) => {
                    if (typeof url === "string") {
                      setBannerUrl(url);
                      addToast("Banner uploaded and cropped successfully", "success");
                    }
                  }}
                />
                {bannerUrl && (
                  <div className="mt-2 flex flex-col gap-2 bg-[#141414] p-3 rounded-xl border border-[#333]">
                    <div className="w-full h-24 bg-neutral-900 rounded-lg overflow-hidden border border-[#444]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold text-center">Banner ready &amp; verified</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-[#BA5B55] hover:bg-[#a34e48] text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Plus size={16} stroke={2} />
                <span>{isPending ? "Scheduling..." : "Add Event Schedule"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {activeTab === "submissions" && (
        <div className="flex flex-col gap-6">
          <h3 className="text-sm font-semibold text-[#BA5B55] uppercase tracking-wider mb-2">Merchant Product Submissions</h3>

          {submissions.length === 0 ? (
            <div className="flex flex-col justify-center items-center border border-dashed border-[#333] rounded-xl p-12 text-center gap-3 bg-[#161616]/50 min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex justify-center items-center text-[#555] mb-2 border border-[#2a2a2a]">
                <Store size={32} stroke={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-[#aaa]">No product submissions</h3>
              <p className="text-xs text-[#666] max-w-sm">No merchants have submitted products to events yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {submissions.map((sub) => (
                <div key={`${sub.event_uid}-${sub.product_uid}`} className="bg-[#1e1e1e] border border-[#333] p-5 rounded-2xl flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl overflow-hidden border border-[#444] bg-[#141414] shrink-0 cursor-pointer hover:opacity-85"
                    onClick={() => sub.product_image && setLightboxSrc(sub.product_image)}
                  >
                    {sub.product_image ? (
                      

                      <img src={sub.product_image} alt={sub.product_title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-xs font-semibold text-[#BA5B55]">
                        No Pic
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm truncate">{sub.product_title}</h4>
                      <p className="text-xs text-[#BA5B55] font-semibold mt-0.5">{sub.product_price} BDT</p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        Merchant: <strong className="text-gray-300">{sub.shop_name}</strong> &bull; Event: <strong className="text-gray-300">{sub.event_title}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {sub.status === "pending" ? (
                        <>
                          <button
                            onClick={() => handleSubmissionAction(sub.event_uid, sub.product_uid, "reject")}
                            disabled={isPending}
                            className="flex items-center gap-1 px-3 py-2 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 hover:border-red-500 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleSubmissionAction(sub.event_uid, sub.product_uid, "approve")}
                            disabled={isPending}
                            className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                        </>
                      ) : (
                        <span className={`px-3 py-1 border text-[10px] rounded-full font-bold uppercase tracking-wider ${
                          sub.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}>
                          {sub.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} alt="Event Media Preview" />
      )}
    </div>
  );
}
