"use client";

import { useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/zustand/toastStore";
import ProductCard from "../../home/ProductCard";
import EventCountdown from "@/components/EventCountdown";
import { Store, Pin, Calendar, Bookmark, Plus, Check, X, DangerCircle } from "@mynaui/icons-react";
import AddProductModal from "@/app/shop/dashboard/AddProductModal";

interface CampusEvent {
  event_uid: string;
  shop_uid: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  host_name: string;
  venue: string;
  ends_at: string;
  created_at: string;
  shop_name: string | null;
  shop_avatar: string | null;
}

interface ProductSubmission {
  product_uid: string;
  product_title: string;
  product_price: string;
  status: string;
  created_at: string;
}

interface EventDetailsClientProps {
  event: CampusEvent;
  initialProducts: any[];
  eligibleProducts: any[];
  initialSubmissions: ProductSubmission[];
  currentUserId: string | null;
  currentUserRole: string | null;
  activeShopUid: string | null;
  initialFollowedShops: string[];
  initialSavedProducts: string[];
  initialReactedProducts: string[];
}

export default function EventDetailsClient({
  event,
  initialProducts,
  eligibleProducts,
  initialSubmissions,
  currentUserId,
  currentUserRole,
  activeShopUid,
  initialFollowedShops,
  initialSavedProducts,
  initialReactedProducts,
}: EventDetailsClientProps) {
  const [products] = useState<any[]>(initialProducts);
  const [submissions, setSubmissions] = useState<ProductSubmission[]>(initialSubmissions);
  const [eligible, setEligible] = useState<any[]>(eligibleProducts);
  const [selectedProductUid, setSelectedProductUid] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleProductCreatedForEvent = (productUid?: string, details?: { title: string; price: string }) => {
    if (productUid && details) {
      const newSub: ProductSubmission = {
        product_uid: productUid,
        product_title: details.title,
        product_price: details.price,
        status: "pending",
        created_at: new Date().toISOString(),
      };
      setSubmissions((prev) => [newSub, ...prev]);
    }
  };

  const [followedShops, setFollowedShops] = useState<Set<string>>(new Set(initialFollowedShops));
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set(initialSavedProducts));
  const [reactedProducts, setReactedProducts] = useState<Set<string>>(new Set(initialReactedProducts));

  const addToast = useToastStore((s) => s.addToast);

  const formatDateForGCal = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const formatDisplayDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const endVal = new Date(event.ends_at);
  const startVal = new Date(endVal.getTime() - 2 * 60 * 60 * 1000);
  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    event.title
  )}&dates=${formatDateForGCal(startVal)}/${formatDateForGCal(endVal)}&details=${encodeURIComponent(
    event.description || ""
  )}&location=${encodeURIComponent(`${event.venue}, ${event.host_name}`)}`;

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductUid) {
      addToast("Please select a product to submit", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/events/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          eventUid: event.event_uid,
          productUid: selectedProductUid,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || "Submitted successfully!", "success");
        
        // Find submitted product details
        const prod = eligible.find((p) => p.product_uid === selectedProductUid);
        if (prod) {
          const newSub: ProductSubmission = {
            product_uid: prod.product_uid,
            product_title: prod.title,
            product_price: prod.price,
            status: "pending",
            created_at: new Date().toISOString(),
          };
          setSubmissions([newSub, ...submissions]);
          setEligible(eligible.filter((p) => p.product_uid !== selectedProductUid));
          setSelectedProductUid("");
        }
      } else {
        addToast(data.message || "Failed to submit product", "error");
      }
    } catch (err) {
      addToast("Network error. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#fbfbfb] py-6 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start min-h-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl w-full flex flex-col gap-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#787878] font-medium mb-1">
          <Link href="/feasts-events" className="hover:text-[#BA5B55] transition-colors">
            Feasts &amp; Events
          </Link>
          <span>&rarr;</span>
          <span className="text-[#1a1a1a] truncate">{event.title}</span>
        </div>

        {/* 2-Column Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT 2/3 COLUMN: EVENT CONTENT & Showcase Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Event Display Card */}
            <div className="bg-white border border-[#eaeaea] overflow-hidden rounded-xl shadow-xs flex flex-col">
              {/* Event Image */}
              <div className="relative h-64 sm:h-80 w-full bg-[#f3f4f6]">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#f7f1f0] to-[#eceff3] text-[#BA5B55] font-bold text-sm tracking-[0.2em] uppercase">
                    Event spotlight banner
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-full border border-[#eaeaea] bg-[#fdf0ef] overflow-hidden flex justify-center items-center shrink-0">
                      {event.shop_avatar ? (
                        <img src={event.shop_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-[#BA5B55] uppercase">A</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1a1a1a]">
                        {event.shop_uid ? event.shop_name : "Campus Admin"}
                      </span>
                      <span className="text-[10px] text-gray-500 font-light">Host Organizer</span>
                    </div>
                  </div>

                  <a
                    href={gCalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 border border-[#eaeaea] text-[#787878] hover:border-[#BA5B55] hover:text-[#BA5B55] text-xs font-semibold rounded-lg transition-all"
                  >
                    <Calendar size={14} />
                    Add to Calendar
                  </a>
                </div>

                <div className="border-t border-[#f5f5f5] pt-4 mt-1 flex flex-col gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1a1a]">{event.title}</h1>
                  {event.description && (
                    <p className="text-xs text-[#555] font-light leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Event parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#f5f5f5] pt-4 mt-2 text-xs">
                  <div className="flex items-center gap-2 p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                    <Pin size={16} className="text-[#BA5B55] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-light uppercase tracking-wider">Venue</p>
                      <p className="font-semibold text-[#1a1a1a] truncate mt-0.5">{event.venue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50/60 rounded-xl border border-gray-100">
                    <Calendar size={16} className="text-[#BA5B55] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-light uppercase tracking-wider">Ends Date</p>
                      <p className="font-semibold text-[#1a1a1a] truncate mt-0.5">{formatDisplayDate(event.ends_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-[#fdf0ef]/50 rounded-xl border border-[#fdf0ef] sm:col-span-1">
                    <DangerCircle size={16} className="text-[#BA5B55] shrink-0" />
                    <div className="w-full min-w-0">
                      <EventCountdown endsAt={event.ends_at} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* EVENT PRODUCT FEED */}
            <div className="flex flex-col gap-5 mt-2">
              <div className="flex items-center gap-2 border-b border-[#eaeaea] pb-3">
                <Store stroke={1.5} size={20} className="text-[#BA5B55]" />
                <h2 className="text-base font-bold text-[#1a1a1a]">Event Showcase Showcase</h2>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#eaeaea] rounded-xl">
                  <Store size={44} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-[#787878] text-sm">No products listed in this event showcase yet.</p>
                  {activeShopUid && (
                    <p className="text-xs text-gray-400 mt-1">Be the first merchant to submit products on the right!</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.product_uid}
                      product={product}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      isFollowing={followedShops.has(product.shop_uid)}
                      isSaved={savedProducts.has(product.product_uid)}
                      hasReacted={reactedProducts.has(product.product_uid)}
                      onFollowChange={(shopUid, following) => {
                        setFollowedShops((prev) => {
                          const next = new Set(prev);
                          if (following) next.add(shopUid); else next.delete(shopUid);
                          return next;
                        });
                      }}
                      onSaveChange={(prodUid, saved) => {
                        setSavedProducts((prev) => {
                          const next = new Set(prev);
                          if (saved) next.add(prodUid); else next.delete(prodUid);
                          return next;
                        });
                      }}
                      onReactChange={(prodUid, reacted) => {
                        setReactedProducts((prev) => {
                          const next = new Set(prev);
                          if (reacted) next.add(prodUid); else next.delete(prodUid);
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT 1/3 COLUMN: MERCHANT CONSOLE OR SIDEBAR INFO */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* MERCHANT CONSOLE (shown only if acting as shop owner) */}
            {activeShopUid && (
              <div className="bg-white border border-[#eaeaea] p-5 rounded-xl shadow-xs flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-[#BA5B55] uppercase tracking-wider">Merchant Console</h3>
                  <p className="text-[10px] text-[#787878] font-light">Promote your active products in this university event.</p>
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-[#f5f5f5]">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="w-full flex justify-center items-center gap-1.5 px-4 py-2 border border-dashed border-[#BA5B55] text-[#BA5B55] hover:bg-[#BA5B55] hover:text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    Upload &amp; Submit New Product
                  </button>
                </div>

                {/* Submit product form */}
                {eligible.length > 0 ? (
                  <form onSubmit={handleProductSubmit} className="flex flex-col gap-3 pt-2 border-t border-[#f5f5f5] text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-[#787878] uppercase">Select Active Product</label>
                      <select
                        value={selectedProductUid}
                        onChange={(e) => setSelectedProductUid(e.target.value)}
                        className="w-full border border-gray-200 bg-white px-3 py-2 outline-none focus:border-[#BA5B55] rounded-lg text-xs"
                      >
                        <option value="">Choose one of your products</option>
                        {eligible.map((p) => (
                          <option key={p.product_uid} value={p.product_uid}>
                            {p.title} (৳{Number(p.price).toFixed(0)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !selectedProductUid}
                      className="w-full flex justify-center items-center gap-1.5 px-4 py-2 border border-[#BA5B55] bg-[#BA5B55] text-white hover:bg-white hover:text-[#BA5B55] text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                      {isSubmitting ? "Submitting..." : "Submit to Event"}
                    </button>
                  </form>
                ) : (
                  <div className="bg-[#fcf8f7] border border-[#f7e6e3] rounded-lg p-3 text-[11px] text-[#BA5B55] font-light mt-1">
                    No other active products available to submit. Make sure you have created items in your shop dashboard.
                  </div>
                )}

                {/* Submissions Status List */}
                <div className="flex flex-col gap-2.5 pt-4 border-t border-[#f5f5f5] mt-1">
                  <h4 className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-wider">Your Submissions Status</h4>
                  {submissions.length === 0 ? (
                    <p className="text-[11px] text-[#787878] font-light italic">No products submitted yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-62.5 overflow-y-auto custom-scrollbar pr-1">
                      {submissions.map((sub) => (
                        <div
                          key={sub.product_uid}
                          className="flex items-center justify-between p-2.5 border border-gray-100 rounded-lg text-[11px] bg-gray-50/50"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-[#1a1a1a] truncate" title={sub.product_title}>
                              {sub.product_title}
                            </p>
                            <p className="text-[10px] text-[#BA5B55] font-bold mt-0.5">৳{Number(sub.product_price).toFixed(0)}</p>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-full shrink-0 ${
                              sub.status === "approved"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : sub.status === "rejected"
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-amber-50 text-amber-600 border-amber-200"
                            }`}
                          >
                            {sub.status === "pending" ? "Pending" : sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event Info Sidebar */}
            <div className="bg-white border border-[#eaeaea] p-5 rounded-xl shadow-xs flex flex-col gap-3 text-xs">
              <h3 className="font-bold text-[#1a1a1a] border-b border-[#f5f5f5] pb-2 text-[13px]">Feast Guidelines</h3>
              <div className="flex flex-col gap-2 text-gray-500 font-light leading-relaxed text-[11px]">
                <p>🛍️ <strong>For Students:</strong> Browse verified student entrepreneur products featured in this feast. Safe campus pick-ups and low delivery rates apply.</p>
                <p>📈 <strong>For Sellers:</strong> Ensure your product description, campus eligibility, and stock are up to date before submitting items to grand campus feasts.</p>
                <p>✔️ <strong>Review Flow:</strong> Product listings undergo quick manual checks by university community managers to ensure safety, authenticity, and student pricing.</p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {isUploadModalOpen && (
        <AddProductModal
          shopUid={activeShopUid!}
          eventUid={event.event_uid}
          onClose={() => setIsUploadModalOpen(false)}
          onCreated={handleProductCreatedForEvent}
        />
      )}
    </div>
  );
}
