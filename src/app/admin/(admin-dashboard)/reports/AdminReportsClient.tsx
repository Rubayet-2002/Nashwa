"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Lightbox from "@/components/Lightbox";
import { useToastStore } from "@/zustand/toastStore";
import { Check, X, Store } from "@mynaui/icons-react";

interface Report {
  report_uid: string;
  reason: string;
  status: string;
  action_taken: string | null;
  created_at: string;
  reporter_uid: string;
  product_uid: string;
  reporter_name: string;
  product_title: string;
  product_price: string;
  product_status: string;
  shop_name: string;
  shop_uid: string;
  seller_uid: string;
  product_image: string | null;
}

interface AdminReportsClientProps {
  initialReports: Report[];
}

export default function AdminReportsClient({
  initialReports,
}: AdminReportsClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [reports, setReports] = useState<Report[]>(initialReports);
  const addToast = useToastStore((s) => s.addToast);
  const [isPending, startTransition] = useTransition();

  

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const handleResolve = (reportUid: string, action: "remove_post" | "dismiss") => {
    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            report_uid: reportUid,
            action,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          addToast(data.message, "success");
          setReports(
            reports.map((rep) =>
              rep.report_uid === reportUid
                ? {
                    ...rep,
                    status: "resolved",
                    action_taken: action === "remove_post" ? "removed_post" : "dismissed",
                    product_status: action === "remove_post" ? "removed" : rep.product_status,
                  }
                : rep
            )
          );
        } else {
          addToast(data.message || "Failed to resolve report", "error");
        }
      } catch (err) {
        addToast("Error resolving report", "error");
      }
    });
  };

  const pendingReports = reports.filter((r) => r.status === "pending");
  const resolvedReports = reports.filter((r) => r.status === "resolved");

  return (
    <div className="flex flex-col gap-6 text-[#e0e0e0] font-sans selection:bg-[#BA5B55] selection:text-white">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2a2a2a] pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Reported Items</h2>
          <p className="text-xs text-[#888]">Monitor flags, investigate violations, and enforce community standards.</p>
        </div>

        <div className="flex bg-[#181818] p-1.5 rounded-lg border border-[#333] gap-1">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "pending" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
            }`}
          >
            <span>Pending Flags</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
              {pendingReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("resolved")}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "resolved" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
            }`}
          >
            <span>Resolved Flags</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "resolved" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
              {resolvedReports.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === "pending" ? (
        pendingReports.length === 0 ? (
          <div className="flex flex-col justify-center items-center border border-dashed border-[#333] rounded-xl p-12 text-center gap-3 bg-[#161616]/50 min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex justify-center items-center text-[#555] mb-2 border border-[#2a2a2a]">
              <Store size={32} stroke={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-[#aaa]">No pending reports</h3>
            <p className="text-xs text-[#666] max-w-sm">
              Excellent! No products are currently flagged for review.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {pendingReports.map((rep) => (
              <div key={rep.report_uid} className="bg-[#1e1e1e] border border-[#333] p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-start">
                {/* Product Image */}
                <div
                  className="w-20 h-20 bg-neutral-900 border border-[#333] rounded-xl overflow-hidden cursor-pointer hover:opacity-85 shrink-0"
                  onClick={() => rep.product_image && setLightboxSrc(rep.product_image)}
                >
                  {rep.product_image ? (
                    

                    <img src={rep.product_image} alt={rep.product_title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#BA5B55]">
                      No Image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <Link
                      href={`/product/${rep.product_uid}`}
                      target="_blank"
                      className="font-bold text-white text-sm hover:underline hover:text-[#BA5B55] transition-colors truncate"
                    >
                      {rep.product_title}
                    </Link>
                    <span className="text-xs text-gray-500">&bull;</span>
                    <span className="text-xs text-[#BA5B55] font-semibold">{rep.product_price} BDT</span>
                  </div>

                  <p className="text-xs text-gray-400">
                    Merchant: <strong className="text-gray-300">{rep.shop_name}</strong> &bull; Reporter: <strong className="text-gray-300">{rep.reporter_name}</strong>
                  </p>

                  <div className="mt-3 bg-[#141414] p-3 rounded-xl border border-[#2b2b2b] text-xs">
                    <p className="font-semibold text-white mb-1">Reason for Flag:</p>
                    <p className="text-gray-400 leading-normal">{rep.reason}</p>
                  </div>

                  <span className="inline-block text-[10px] text-gray-500 mt-2.5">
                    Flagged on: {new Date(rep.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto mt-4 md:mt-0 justify-end">
                  <button
                    onClick={() => handleResolve(rep.report_uid, "dismiss")}
                    disabled={isPending}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-transparent hover:bg-neutral-800 text-gray-300 border border-[#444] rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>Dismiss</span>
                  </button>
                  <button
                    onClick={() => handleResolve(rep.report_uid, "remove_post")}
                    disabled={isPending}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <X size={14} />
                    <span>Remove Product</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : resolvedReports.length === 0 ? (
        <div className="flex flex-col justify-center items-center border border-dashed border-[#333] rounded-xl p-12 text-center gap-3 bg-[#161616]/50 min-h-[300px]">
          <h3 className="text-base font-semibold text-[#aaa]">No resolved reports</h3>
          <p className="text-xs text-[#666] max-w-sm">
            Resolved flags and actions taken will populate this tab.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {resolvedReports.map((rep) => (
            <div key={rep.report_uid} className="bg-[#1e1e1e]/60 border border-[#2d2d2d] p-5 rounded-2xl flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-300 text-sm truncate">{rep.product_title}</h4>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                    rep.action_taken === "removed_post"
                      ? "bg-red-500/20 text-red-400 border border-red-500/20"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {rep.action_taken === "removed_post" ? "Removed Product" : "Dismissed"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Merchant: {rep.shop_name} &bull; Reporter: {rep.reporter_name}
                </p>
                <p className="text-xs text-[#888] mt-2 italic">Reason: &ldquo;{rep.reason}&rdquo;</p>
              </div>
              <div className="text-right shrink-0 text-[10px] text-gray-500">
                Resolved
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} alt="Reported Item Media Preview" />
      )}
    </div>
  );
}
