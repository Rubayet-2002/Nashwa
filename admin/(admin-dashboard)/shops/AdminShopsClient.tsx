"use client";

import { useState } from "react";
import ShopRequestCard from "../../component/ShopRequestCard";
import { Store } from "@mynaui/icons-react";

interface AdminShopsClientProps {
  pendingRequests: any[];
  approvedShops: any[];
}

export default function AdminShopsClient({
  pendingRequests,
  approvedShops,
}: AdminShopsClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

  return (
    <div className="flex flex-col gap-6 text-[#e0e0e0] font-sans selection:bg-[#BA5B55] selection:text-white">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2a2a2a] pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Shop Request Management</h2>
          <p className="text-xs text-[#888]">Review pending shop creator applications and track verified stores.</p>
        </div>

        <div className="flex bg-[#181818] p-1.5 rounded-2xl border border-[#333] gap-1">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "pending" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
            }`}
          >
            <span>Pending Approvals</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
              {pendingRequests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "approved" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
            }`}
          >
            <span>Approved Shops</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "approved" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
              {approvedShops.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "pending" ? (
        pendingRequests.length === 0 ? (
          <div className="flex flex-col justify-center items-center border border-dashed border-[#333] rounded-3xl p-12 text-center gap-3 bg-[#161616]/50 min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex justify-center items-center text-[#555] mb-2 border border-[#2a2a2a]">
              <Store size={32} stroke={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-[#aaa]">No pending shop requests</h3>
            <p className="text-xs text-[#666] max-w-sm">
              All applications have been successfully processed. New student merchant applications will show up here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {pendingRequests.map((req) => (
              <ShopRequestCard key={req.shop_uid} request={req} isApproved={false} />
            ))}
          </div>
        )
      ) : (
        approvedShops.length === 0 ? (
          <div className="flex flex-col justify-center items-center border border-dashed border-[#333] rounded-3xl p-12 text-center gap-3 bg-[#161616]/50 min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex justify-center items-center text-[#555] mb-2 border border-[#2a2a2a]">
              <Store size={32} stroke={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-[#aaa]">No approved shops</h3>
            <p className="text-xs text-[#666] max-w-sm">
              No shops have been approved yet. Once you approve requests, they will populate this listing.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {approvedShops.map((shop) => (
              <ShopRequestCard key={shop.shop_uid} request={shop} isApproved={true} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
