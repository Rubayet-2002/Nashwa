"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, User, Mail, Telephone, MapPin, Store, Eye, Download } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";

interface ShopRequestCardProps {
  request: {
    shop_uid: string;
    shop_name: string;
    shop_email: string;
    shop_phone: string;
    shop_location: string;
    shop_description: string;
    nid_pdf_url: string;
    created_at: string;
    username: string;
    user_email: string;
    user_phone: string | null;
  };
  isApproved?: boolean;
}

const ShopRequestCard = ({ request, isApproved }: ShopRequestCardProps) => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [isPending, startTransition] = useTransition();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const handleAction = (action: "approve" | "reject", reason?: string) => {
    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/shop-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            shop_uid: request.shop_uid,
            action,
            reason: reason || "",
          }),
        });

        const result = await response.json();

        if (response.ok) {
          addToast(result.message, "success");
          setShowRejectModal(false);
          setRejectReason("");
          router.refresh();
        } else {
          addToast(result.message || "Action failed", "error");
        }
      } catch (error) {
        addToast("Network error! Please try again.", "error");
      }
    });
  };

  const getDownloadUrl = (url: string) => {
    if (url.includes("/image/upload/")) {
      return url.replace("/image/upload/", "/image/upload/fl_attachment/");
    }
    return url;
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded-3xl shadow-md flex flex-col gap-6 text-[#e0e0e0]">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-[#333] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#BA5B55]/20 text-[#BA5B55] rounded-xl">
            <Store size={24} stroke={1.5} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{request.shop_name}</h3>
            <p className="text-xs text-[#999]">
              {isApproved ? "Approved Store" : "Requested on"} {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 border text-xs rounded-full font-medium ${
          isApproved 
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
        }`}>
          {isApproved ? "Approved Store" : "Pending Approval"}
        </span>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Shop Info */}
        <div className="flex flex-col gap-3 bg-[#141414] p-4 rounded-2xl border border-[#2a2a2a]">
          <h4 className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider mb-1">Shop Details</h4>
          <div className="flex items-center gap-2 text-[#bbb]">
            <Mail size={18} stroke={1.5} className="text-[#888] shrink-0" />
            <span className="truncate">{request.shop_email}</span>
          </div>
          <div className="flex items-center gap-2 text-[#bbb]">
            <Telephone size={18} stroke={1.5} className="text-[#888] shrink-0" />
            <span>{request.shop_phone}</span>
          </div>
          <div className="flex items-start gap-2 text-[#bbb]">
            <MapPin size={18} stroke={1.5} className="text-[#888] shrink-0 mt-0.5" />
            <span className="line-clamp-2">{request.shop_location}</span>
          </div>
          <div className="mt-2 text-xs text-[#999] border-t border-[#222] pt-2">
            <p className="font-semibold text-[#ccc] mb-1">Description:</p>
            <p className="line-clamp-3">{request.shop_description}</p>
          </div>
        </div>

        {/* User Info */}
        <div className="flex flex-col gap-3 bg-[#141414] p-4 rounded-2xl border border-[#2a2a2a]">
          <h4 className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider mb-1">Applicant (User) Details</h4>
          <div className="flex items-center gap-2 text-[#bbb]">
            <User size={18} stroke={1.5} className="text-[#888] shrink-0" />
            <span className="font-medium text-white">{request.username || "nai"}</span>
          </div>
          <div className="flex items-center gap-2 text-[#bbb]">
            <Mail size={18} stroke={1.5} className="text-[#888] shrink-0" />
            <span className="truncate">{request.user_email}</span>
          </div>
          {request.user_phone && (
            <div className="flex items-center gap-2 text-[#bbb]">
              <Telephone size={18} stroke={1.5} className="text-[#888] shrink-0" />
              <span>{request.user_phone}</span>
            </div>
          )}

          {/* NID Document Management */}
          <div className="mt-auto pt-3 border-t border-[#222] flex flex-col gap-2">
            <h5 className="text-xs font-semibold text-[#ccc]">Verification Document (NID PDF):</h5>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPdfPreview(!showPdfPreview)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#252525] hover:bg-[#303030] border border-[#444] rounded-xl text-xs text-[#BA5B55] hover:text-[#d96a63] font-medium transition-colors cursor-pointer"
              >
                <Eye size={16} stroke={1.5} />
                <span>{showPdfPreview ? "Hide PDF Preview" : "Inline PDF Preview"}</span>
              </button>

              <a
                href={getDownloadUrl(request.nid_pdf_url)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex items-center gap-1.5 px-3 py-2 bg-[#252525] hover:bg-[#303030] border border-[#444] rounded-xl text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
              >
                <Download size={16} stroke={1.5} />
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Inline PDF Preview Iframe */}
      {showPdfPreview && (
        <div className="w-full h-120 border border-[#444] rounded-2xl overflow-hidden bg-[#141414] flex flex-col shadow-inner animate-fadeIn">
          <div className="bg-[#222] px-4 py-2 border-b border-[#333] flex justify-between items-center text-xs text-[#aaa]">
            <span>NID PDF Document Preview</span>
            <button onClick={() => setShowPdfPreview(false)} className="hover:text-white cursor-pointer">✕ Close</button>
          </div>
          <iframe
            src={request.nid_pdf_url}
            className="w-full flex-1 border-none bg-white"
            title="NID PDF Preview"
          />
        </div>
      )}

      {/* Action Buttons (Only for pending requests) */}
      {!isApproved && (
        <div className="flex justify-end gap-4 border-t border-[#333] pt-4">
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 hover:border-red-500 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} stroke={1.5} />
            <span>Reject</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("approve")}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <Check size={18} stroke={1.5} />
            <span>{isPending ? "Processing..." : "Approve Shop"}</span>
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-5">
          <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-4 text-[#e0e0e0]">
            <h3 className="text-lg font-bold text-white border-b border-[#333] pb-2">Reject Shop Request</h3>
            <p className="text-xs text-[#aaa]">
              Please provide a clear reason for rejecting <strong className="text-white">{request.shop_name}</strong>. This will be sent to the user via email.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., NID document is blurry or invalid, shop location is incomplete..."
              rows={4}
              className="w-full p-3 bg-[#141414] border border-[#333] rounded-2xl text-sm text-white placeholder:text-[#666] outline-none focus:border-[#BA5B55] resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={isPending}
                className="px-4 py-2 bg-transparent hover:bg-[#2a2a2a] text-[#aaa] hover:text-white rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction("reject", rejectReason)}
                disabled={isPending || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50 shadow"
              >
                {isPending ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopRequestCard;
