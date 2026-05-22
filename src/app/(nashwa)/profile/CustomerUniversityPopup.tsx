"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { UNIVERSITIES } from "@/app/shop/lib/universities";

interface CustomerUniversityPopupProps {
  show: boolean;
}

export default function CustomerUniversityPopup({ show }: CustomerUniversityPopupProps) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [isOpen, setIsOpen] = useState(show);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
      <div className="relative z-10 w-full max-w-md overflow-hidden border border-[#eef0f3] bg-white shadow-2xl rounded-sm">
        <div className="border-b border-[#eef0f3] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">University</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-[#1a1a1a]">Select your university</h3>
          <p className="mt-1 text-xs text-[#787878]">We use this to show the right campus community.</p>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="grid gap-2">
            {UNIVERSITIES.map((u) => (
              <button
                key={u.uid}
                type="button"
                onClick={async () => {
                  try {
                    const res = await fetch("/api/user/set-university", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                      },
                      body: JSON.stringify({ universityUid: u.uid }),
                    });
                    const body = await res.json();
                    if (res.ok) {
                      addToast("University saved", "success");
                      router.refresh();
                    } else {
                      addToast(body.message || "Failed to save university", "error");
                    }
                  } catch (error) {
                    addToast("Network error", "error");
                  } finally {
                    setIsOpen(false);
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
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-3 py-1 text-xs border border-[#eaeaea] hover:bg-gray-50 text-[#787878]"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
