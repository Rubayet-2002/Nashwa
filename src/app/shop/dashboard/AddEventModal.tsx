"use client";

import { useState } from "react";
import ImageUpload from "../../(nashwa)/component/ImageUpload";
import { useToastStore } from "@/zustand/toastStore";
import { UNIVERSITIES } from "../lib/universities";

export default function AddEventModal({
  shopUid,
  onClose,
  onCreated,
}: {
  shopUid: string;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hostName, setHostName] = useState("");
  const [venue, setVenue] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !hostName || !venue || !endsAt) {
      return addToast("Please fill in all required fields", "error");
    }
    if (!imageUrl) {
      return addToast("Please select your cover banner and click 'Upload' to finalize the image upload first!", "error");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid,
          title,
          description,
          imageUrl,
          hostName,
          venue,
          endsAt: new Date(endsAt).toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Campus Event listed successfully!", "success");
        onCreated?.();
        onClose();
      } else {
        addToast(data.message || "Failed to create event", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error! Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <form
        onSubmit={handleCreate}
        className="relative z-10 w-full max-w-4xl overflow-hidden border border-[#eef0f3] bg-white shadow-2xl rounded-3xl animate-in zoom-in-95 duration-200"
      >
        <div className="border-b border-[#eef0f3] bg-[#fcfcfd] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">Campus Feast & Event</p>
          <h3 className="text-xl font-bold tracking-tight text-[#1a1a1a]">Schedule Campus Event</h3>
          <p className="mt-1 text-xs text-[#787878]">Advertise your winter festivals, pitha feasts, or bakery carousels to your university audience.</p>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          
          {/* Left Form Column */}
          <div className="border-b border-[#eef0f3] p-6 lg:border-b-0 lg:border-r flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Event Title *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Winter Pitha Feast"
                  className="w-full border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Host University *</label>
                <select
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  required
                  className="w-full border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]"
                >
                  <option value="">Select Host Campus</option>
                  {UNIVERSITIES.map((u) => (
                    <option key={u.uid} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Venue Location *</label>
                <input
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                  placeholder="e.g. Auditorium lobby, Ground level"
                  className="w-full border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Ends Date & Time *</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                  className="w-full border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]"
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain event specials, winter food menus, timings, or discount coupons for students."
                  rows={4}
                  className="w-full resize-none border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]"
                />
              </div>
            </div>
          </div>

          {/* Right Banner Upload Column */}
          <div className="bg-[#fcfcfd] p-6 flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Event Cover Photo *</p>
              <p className="mt-1 text-xs text-[#787878] mb-3">Select a beautiful banner for your event spotlight listing.</p>
              
              <div className="mb-3 text-[11px] font-bold text-[#BA5B55] bg-[#BA5B55]/5 px-3.5 py-2.5 rounded-2xl border border-[#efe4e2]">
                ⚠️ Click the &quot;Upload&quot; button after selecting your photo file to complete the upload to Cloudinary.
              </div>

              <div className="rounded-3xl border border-[#eef0f3] bg-white p-4 shadow-sm">
                <ImageUpload
                  label="Select event banner"
                  folder="nashwa_events"
                  onUploaded={(u) => setImageUrl(Array.isArray(u) ? u[0] : u)}
                />
              </div>

              {imageUrl && (
                <div className="mt-4 relative aspect-video w-full rounded-2xl overflow-hidden border border-[#eadfdb] bg-white">
                  <img src={imageUrl} alt="Event Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-[#dbe1e8] bg-white px-4 py-3 text-xs text-[#787878]">
              Events will show up directly on the homepage spotlight and on the Feasts & Events directory.
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef0f3] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#eaeaea] text-xs font-semibold text-[#787878] hover:border-[#BA5B55] hover:text-[#BA5B55] rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#BA5B55] text-white text-xs font-semibold border border-[#BA5B55] transition-all hover:bg-white hover:text-[#BA5B55] disabled:opacity-70 rounded-xl shadow-sm cursor-pointer"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
