"use client";

import { CheckCircle, DangerCircle, X } from "@mynaui/icons-react";
import { useToastStore } from "./toastStore";

export function Toast() {
  const { activeToast, removeToast } = useToastStore();

  if (!activeToast) return null;

  const isSuccess = activeToast.type === "success";

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-100 flex flex-col gap-2 w-full items-center pointer-events-none">
      {isSuccess ? (

        <div
          key={activeToast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 text-emerald-600 bg-white border border-emerald-600 animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw] md:max-w-md shadow-2xl"
        >
          <div className="shrink-0">
            <CheckCircle stroke={1} size={20} />
          </div>

          <span className="text-sm flex-1 wrap-break-word leading-normal text-emerald-600">
            {activeToast.message}
          </span>

          <button
            onClick={removeToast}
            className="shrink-0 text-[#1a1a1a] cursor-pointer hover:opacity-70 transition-opacity"
          >
            <X stroke={1} size={20} />
          </button>
        </div>
      ) : (

        <div
          key={activeToast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 text-red-600 bg-white border border-red-600 animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw] md:max-w-md shadow-2xl"
        >
          <div className="shrink-0">
            <DangerCircle stroke={1} size={20} />
          </div>

          <span className="text-sm font-medium flex-1 wrap-break-word leading-normal text-red-600">
            {activeToast.message}
          </span>

          <button
            onClick={removeToast}
            className="shrink-0 text-[#1a1a1a] cursor-pointer hover:opacity-70 transition-opacity"
          >
            <X stroke={1} size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
