"use client";

import { useState } from "react";
import AdminLogoutButton from "../component/AdminLogoutButton";
import ShopRequestCard from "../component/ShopRequestCard";
import { Users, Store, UserCheck } from "@mynaui/icons-react";

interface AdminDashboardClientProps {
  adminEmail: string;
  counts: {
    customer_count: number;
    seller_count: number;
    shop_count: number;
  };
  pendingRequests: any[];
  approvedShops: any[];
}

const AdminDashboardClient = ({
  adminEmail,
  counts,
  pendingRequests,
  approvedShops,
}: AdminDashboardClientProps) => {
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

  return (
    <div className="min-h-screen bg-[#121212] text-[#e0e0e0] flex flex-col font-sans selection:bg-[#BA5B55] selection:text-white">
      {/* Top Navbar */}
      <header className="bg-[#181818] border-b border-[#2a2a2a] px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#BA5B55] rounded-full animate-pulse" />
          <h1 className="text-xl font-bold tracking-wide text-white">Nashwa Admin Portal</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#888]">Logged in as</span>
            <span className="text-sm font-medium text-[#ccc]">{adminEmail}</span>
          </div>
          <AdminLogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-8 flex flex-col gap-8 min-h-0">
        {/* Top Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1e1e1e] border border-[#333] p-5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-[#888] font-medium uppercase tracking-wider mb-1">Total Customers</p>
              <h3 className="text-2xl font-bold text-white">{counts.customer_count}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Users size={24} stroke={1.5} />
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#333] p-5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-[#888] font-medium uppercase tracking-wider mb-1">Total Sellers</p>
              <h3 className="text-2xl font-bold text-white">{counts.seller_count}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <UserCheck size={24} stroke={1.5} />
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#333] p-5 rounded-lg shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-[#888] font-medium uppercase tracking-wider mb-1">Approved Shops</p>
              <h3 className="text-2xl font-bold text-white">{counts.shop_count}</h3>
            </div>
            <div className="p-3 bg-[#BA5B55]/10 text-[#BA5B55] rounded-lg border border-[#BA5B55]/20">
              <Store size={24} stroke={1.5} />
            </div>
          </div>
        </div>

        {/* Tabs & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2a2a2a] pb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Store Management</h2>
            <p className="text-xs text-[#888]">Review pending applications and manage approved student stores.</p>
          </div>

          <div className="flex bg-[#181818] p-1.5 rounded-lg border border-[#333] gap-1">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "pending" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
              }`}
            >
              <span>Pending Requests</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
                {pendingRequests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("approved")}
              className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
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
            <div className="flex-1 flex flex-col justify-center items-center border border-dashed border-[#333] rounded-xl p-12 text-center gap-3 bg-[#161616]/50 my-auto">
              <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex justify-center items-center text-[#555] mb-2 border border-[#2a2a2a]">
                <Store size={32} stroke={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-[#aaa]">No pending shop requests</h3>
              <p className="text-xs text-[#666] max-w-sm">
                All student shop applications have been processed. New requests will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
              {pendingRequests.map((req) => (
                <ShopRequestCard key={req.shop_uid} request={req} isApproved={false} />
              ))}
            </div>
          )
        ) : (
          approvedShops.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center border border-dashed border-[#333] rounded-xl p-12 text-center gap-3 bg-[#161616]/50 my-auto">
              <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex justify-center items-center text-[#555] mb-2 border border-[#2a2a2a]">
                <Store size={32} stroke={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-[#aaa]">No approved shops yet</h3>
              <p className="text-xs text-[#666] max-w-sm">
                Approved student entrepreneur stores will appear here for administrative oversight and NID document retrieval.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
              {approvedShops.map((shop) => (
                <ShopRequestCard key={shop.shop_uid} request={shop} isApproved={true} />
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default AdminDashboardClient;
