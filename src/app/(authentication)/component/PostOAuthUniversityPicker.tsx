"use client";

import { useEffect, useState } from "react";
import { UNIVERSITIES } from "@/app/shop/lib/universities";
import { useToastStore } from "@/zustand/toastStore";

export default function PostOAuthUniversityPicker() {
  const [show, setShow] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    try {
      const cookies = document.cookie.split("; ").reduce<Record<string,string>>((acc, cur) => {
        const [k,v] = cur.split("=");
        acc[k] = decodeURIComponent(v || "");
        return acc;
      }, {});
      if (cookies["show_university_picker"] === "1") {
        setShow(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => {
        // hide and remove cookie
        document.cookie = "show_university_picker=; path=/; max-age=0";
        setShow(false);
      }} />
      <div className="relative z-10 w-full max-w-md overflow-hidden border border-[#eef0f3] bg-white shadow-2xl rounded-sm">
        <div className="border-b border-[#eef0f3] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">University</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-[#1a1a1a]">Select your university</h3>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="grid gap-2">
            {UNIVERSITIES.map((u) => (
              <button
                key={u.uid}
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/set-user-university', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                      body: JSON.stringify({ universityUid: u.uid }),
                    });
                    const j = await res.json();
                    if (res.ok) {
                      addToast('University saved', 'success');
                    } else {
                      addToast(j.message || 'Failed to save university', 'error');
                    }
                  } catch (err) {
                    addToast('Network error', 'error');
                  } finally {
                    document.cookie = "show_university_picker=; path=/; max-age=0";
                    setShow(false);
                    // reload to reflect updates
                    window.location.reload();
                  }
                }}
                className="w-full text-left px-3 py-2 border border-[#eaeaea] hover:border-[#BA5B55]"
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#eef0f3] bg-white px-6 py-4">
          <button type="button" onClick={() => {
            document.cookie = "show_university_picker=; path=/; max-age=0";
            setShow(false);
            window.location.reload();
          }} className="px-3 py-1 text-xs border border-[#eaeaea] hover:bg-gray-50 text-[#787878]">Skip</button>
        </div>
      </div>
    </div>
  );
}
