"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";
import { updateShopBio, updateShopInfo } from "./actions";
import ImageUpload from "../../(nashwa)/component/ImageUpload";
import AddProductModal from "./AddProductModal";
import {
  Mail,
  Telephone,
  Pin,
  EditOne,
  Plus,
  Refresh,
  Package,
  Store,
  Dollar,
  PlusCircle,
  Cog,
  ListCheck
} from "@mynaui/icons-react";

interface DashboardClientProps {
  shop: {
    shop_uid: string;
    shop_name: string;
    shop_email: string;
    shop_phone: string;
    shop_location: string;
    shop_description: string;
    shop_bio: string | null;
    cover_photo_url?: string | null;
    university_name?: string | null;
    profile_photo_url?: string | null;
  };
  user: {
    username: string;
  };
  products: Array<{
    product_uid: string;
    title: string;
    description: string | null;
    price: string;
    currency: string;
    image_url: string | null;
  }>;
}

export default function DashboardClient({ shop, user, products = [] }: DashboardClientProps) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const { setActiveShop } = useAuthStore();
  const [isPending, startTransition] = useTransition();

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(shop.shop_bio || "");

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoEmail, setInfoEmail] = useState(shop.shop_email);
  const [infoPhone, setInfoPhone] = useState(shop.shop_phone);
  const [infoLocation, setInfoLocation] = useState(shop.shop_location);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [showAssignUniversity, setShowAssignUniversity] = useState(false);
  const [selectedUniversityUid, setSelectedUniversityUid] = useState("");
  const UNIVERSITIES = require("../lib/universities").UNIVERSITIES as { uid: string; name: string }[];

  const handleSwitchToCustomer = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/switch-shop", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({ activeShopUid: null }),
        });
        const result = await response.json();

        if (response.ok) {
          addToast("Switched to Customer Mode", "success");
          setActiveShop(null);
          router.replace(result.redirect || "/profile");
        } else {
          addToast(result.message || "Failed to switch mode", "error");
        }
      } catch (error) {
        addToast("Network error! Please try again.", "error");
      }
    });
  };

  const handleSaveBio = async () => {
    const res = await updateShopBio(shop.shop_uid, bioText);
    if (res.success) {
      addToast("Bio updated successfully!", "success");
      setIsEditingBio(false);
    } else {
      addToast(res.error || "Failed to update bio", "error");
    }
  };

  // Handle Info Save
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateShopInfo(shop.shop_uid, {
      email: infoEmail,
      phone: infoPhone,
      location: infoLocation,
    });
    if (res.success) {
      addToast("Shop information updated successfully!", "success");
      setIsEditingInfo(false);
    } else {
      addToast(res.error || "Failed to update information", "error");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-full min-h-screen bg-[#f7f7f9] text-[#1a1a1a]">
      {/* LEFT COLUMN: Profile & Settings */}
      <aside className="w-full lg:w-[27rem] bg-[#fafafb] border-r border-[#eef0f3] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-5 border-b border-[#eef0f3] bg-white">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#BA5B55] font-semibold">Shop identity</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#1a1a1a]">{shop.shop_name}</h2>
          {shop.university_name && (
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#787878]">
              {shop.university_name}
            </p>
          )}
          <p className="text-xs text-[#787878] mt-1">Owned by <span className="font-medium text-[#1a1a1a]">{user.username}</span></p>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <section className="bg-white border border-[#eef0f3] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f7]">
              <div>
                <p className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">Cover photo</p>
                <p className="text-[11px] text-[#787878] mt-0.5">Banner shown at the top of your shop.</p>
              </div>
            </div>
            <div className="relative h-52 w-full bg-[#f3f4f6] overflow-hidden">
              {shop.cover_photo_url ? (
                <Image
                  src={shop.cover_photo_url}
                  alt="Shop Cover"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f7f1f0] to-[#eceff3] text-[#BA5B55] text-xs font-medium uppercase tracking-[0.2em]">
                  Cover photo
                </div>
              )}
            </div>
            <div className="p-4">
              <ImageUpload
                label="Replace cover image"
                folder="nashwa_shop_covers"
                saveEndpoint="/shop/api/update-cover"
                extraBody={{ shopUid: shop.shop_uid }}
                onUploaded={() => router.refresh()}
              />
            </div>
          </section>

          <section className="bg-white border border-[#eef0f3] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#f2f4f7]">
              <div>
                <p className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">Profile photo</p>
                <p className="text-[11px] text-[#787878] mt-0.5">Avatar shown beside your shop name.</p>
              </div>
            </div>
            <div className="flex items-center justify-center py-6 bg-[#fcfcfd]">
              <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                {shop.profile_photo_url ? (
                  <Image
                    src={shop.profile_photo_url}
                    alt="Shop Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#f1f1f1] text-[#BA5B55] text-[10px] font-semibold uppercase tracking-[0.2em]">
                    Shop
                  </div>
                )}
              </div>
            </div>
            <div className="p-4">
              <ImageUpload
                label="Replace profile image"
                folder="nashwa_shop_profiles"
                saveEndpoint="/shop/api/update-profile"
                extraBody={{ shopUid: shop.shop_uid }}
                onUploaded={() => router.refresh()}
              />
            </div>
          </section>
        </div>

        {/* Bio Section */}
        <div className="px-6 py-5 border-t border-[#f4f5f7] flex flex-col gap-3 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">Bio</span>
            {!isEditingBio && (
              <button
                onClick={() => setIsEditingBio(true)}
                className="text-[#787878] hover:text-[#BA5B55] transition-colors"
                title="Edit Bio"
              >
                <EditOne size={16} />
              </button>
            )}
          </div>

          {isEditingBio ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell customers about your shop..."
                rows={3}
                className="w-full text-sm p-2 border border-[#eaeaea] focus:border-[#BA5B55] outline-none resize-none font-light bg-[#fafafa]"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setBioText(shop.shop_bio || "");
                    setIsEditingBio(false);
                  }}
                  className="px-3 py-1 text-xs border border-[#eaeaea] hover:bg-gray-50 text-[#787878]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  className="px-3 py-1 text-xs bg-[#BA5B55] text-white hover:bg-[#BA5B55]/90"
                >
                  Save
                </button>
              </div>
            </div>
          ) : bioText ? (
            <p className="text-sm text-[#4f4f4f] leading-relaxed font-light">{bioText}</p>
          ) : (
            <button
              onClick={() => setIsEditingBio(true)}
              className="flex items-center justify-center gap-1.5 py-4 border border-dashed border-[#d1d5db] hover:border-[#BA5B55] hover:text-[#BA5B55] text-xs font-medium text-[#787878] transition-all bg-gray-50/50"
            >
              <Plus size={16} />
              <span>Add Bio</span>
            </button>
          )}
        </div>

        {/* About Info Section */}
        <div className="px-6 py-5 border-t border-[#f4f5f7] flex flex-col gap-4 flex-1 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#BA5B55] uppercase tracking-wider">About Info</span>
            <button
              onClick={() => setIsEditingInfo(true)}
              className="text-[#787878] hover:text-[#BA5B55] transition-colors flex items-center gap-1 text-xs"
            >
              <EditOne size={14} />
              <span>Edit info</span>
            </button>
          </div>

          <div className="flex flex-col gap-3.5 text-sm text-[#4f4f4f]">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-[#BA5B55] shrink-0" />
              <span className="truncate" title={shop.shop_email}>{shop.shop_email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Telephone size={16} className="text-[#BA5B55] shrink-0" />
              <span>{shop.shop_phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Pin size={16} className="text-[#BA5B55] shrink-0" />
              <span>{shop.shop_location}</span>
                {shop.university_name && (
                  <div className="flex items-center gap-3">
                    <Cog size={16} className="text-[#BA5B55] shrink-0" />
                    <span>{shop.university_name}</span>
                  </div>
                )}
            </div>
          </div>
        </div>
      </aside>

      {/* Shop university assignment modal for older shops without university */}
      {(!shop.university_name || shop.university_name === null) && showAssignUniversity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAssignUniversity(false)} />
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
                        const res = await fetch('/shop/api/set-shop-university', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                          body: JSON.stringify({ shopUid: shop.shop_uid, universityUid: u.uid }),
                        });
                        const j = await res.json();
                        if (res.ok) {
                          addToast('University assigned', 'success');
                          router.refresh();
                        } else {
                          addToast(j.message || 'Failed to assign university', 'error');
                        }
                      } catch (err) {
                        addToast('Network error', 'error');
                      } finally {
                        setShowAssignUniversity(false);
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
              <button type="button" onClick={() => setShowAssignUniversity(false)} className="px-3 py-1 text-xs border border-[#eaeaea] hover:bg-gray-50 text-[#787878]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT COLUMN: Navbar & Dashboard Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#eef0f3] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/shop/dashboard")}>
            <Store stroke={1.5} size={24} className="text-[#BA5B55]" />
            <span className="font-bold text-lg tracking-wider text-[#1a1a1a]">
              NASHWA <span className="font-light text-[#BA5B55]">BUSINESS</span>
            </span>
          </div>

          <button
            onClick={handleSwitchToCustomer}
            disabled={isPending}
            className="flex items-center gap-2 px-3.5 py-1.5 border border-[#eaeaea] hover:border-[#BA5B55] hover:text-[#BA5B55] text-xs font-medium text-[#787878] transition-all bg-white cursor-pointer"
          >
            <Refresh size={14} />
            <span>Switch to Customer</span>
          </button>
        </header>

        {/* Dashboard Content Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          
          {/* Welcome Alert */}
          <div className="bg-white border border-[#eef0f3] p-6 shadow-sm rounded-sm">
            <h1 className="text-xl font-bold text-[#1a1a1a]">Welcome to your Dashboard, {user.username}!</h1>
            <p className="text-xs text-[#787878] font-light mt-1">
              Here you can manage your shop, view statistics, fulfill orders, and list new products for the university market.
            </p>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-[#eef0f3] p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-[#BA5B55]/10 rounded-full text-[#BA5B55]">
                <Package size={24} />
              </div>
              <div>
                <p className="text-xs text-[#787878] font-light uppercase tracking-wider">Total Products</p>
                <h3 className="text-2xl font-bold mt-0.5">{products.length}</h3>
              </div>
            </div>

            <div className="bg-white border border-[#eef0f3] p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                <ListCheck size={24} />
              </div>
              <div>
                <p className="text-xs text-[#787878] font-light uppercase tracking-wider">Active Orders</p>
                <h3 className="text-2xl font-bold mt-0.5">0</h3>
              </div>
            </div>

            <div className="bg-white border border-[#eef0f3] p-5 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                <Dollar size={24} />
              </div>
              <div>
                <p className="text-xs text-[#787878] font-light uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-0.5">৳0</h3>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Activity layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* Quick Actions */}
            <div className="xl:col-span-1 bg-white border border-[#eef0f3] p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <button onClick={() => setIsAddProductOpen(true)} className="flex items-center gap-2.5 p-3 border border-[#eaeaea] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all text-xs font-medium text-left bg-white">
                  <PlusCircle size={16} className="text-[#BA5B55]" />
                  Add New Product
                </button>
                <button className="flex items-center gap-2.5 p-3 border border-[#eaeaea] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all text-xs font-medium text-left bg-white">
                  <ListCheck size={16} className="text-[#BA5B55]" />
                  Manage Orders
                </button>
                <button className="flex items-center gap-2.5 p-3 border border-[#eaeaea] hover:border-[#BA5B55] hover:text-[#BA5B55] transition-all text-xs font-medium text-left bg-white">
                  <Cog size={16} className="text-[#BA5B55]" />
                  Shop Settings
                </button>
              </div>
            </div>

            {/* Recent Products / Activity Placeholder */}
            <div className="xl:col-span-2 bg-white border border-[#eef0f3] p-5 shadow-sm flex flex-col gap-4 min-h-62.5">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Recent Products</h3>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {products.map((product) => (
                    <div key={product.product_uid} className="flex gap-3 border border-[#eef0f3] bg-[#fcfcfd] p-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden border border-[#eaeaea] bg-white">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#787878]/30">
                            <Package size={22} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#1a1a1a] truncate">{product.title}</p>
                        <p className="mt-1 text-xs text-[#787878] line-clamp-2">
                          {product.description || "No description added."}
                        </p>
                        <p className="mt-2 text-xs font-medium text-[#BA5B55]">
                          {product.currency} {Number(product.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <Package stroke={1} size={40} className="text-[#787878]/30 mb-2" />
                  <p className="text-xs text-[#787878] font-light">No products uploaded yet.</p>
                  <button onClick={() => setIsAddProductOpen(true)} className="text-xs text-[#BA5B55] font-medium hover:underline mt-1">
                    Upload your first product
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* EDIT INFO MODAL */}
      {isEditingInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#eaeaea] w-full max-w-md p-6 shadow-xl rounded-sm flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-lg font-bold">Edit Shop Information</h3>
              <p className="text-xs text-[#787878] font-light mt-0.5">
                Update the public contact details for your shop.
              </p>
            </div>

            <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#787878]">Shop Email</label>
                <input
                  type="email"
                  value={infoEmail}
                  onChange={(e) => setInfoEmail(e.target.value)}
                  required
                  className="w-full text-sm p-2 border border-[#eaeaea] focus:border-[#BA5B55] outline-none font-light"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#787878]">Shop Phone</label>
                <input
                  type="text"
                  value={infoPhone}
                  onChange={(e) => setInfoPhone(e.target.value)}
                  required
                  className="w-full text-sm p-2 border border-[#eaeaea] focus:border-[#BA5B55] outline-none font-light"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#787878]">Location</label>
                <input
                  type="text"
                  value={infoLocation}
                  onChange={(e) => setInfoLocation(e.target.value)}
                  required
                  className="w-full text-sm p-2 border border-[#eaeaea] focus:border-[#BA5B55] outline-none font-light"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInfoEmail(shop.shop_email);
                    setInfoPhone(shop.shop_phone);
                    setInfoLocation(shop.shop_location);
                    setIsEditingInfo(false);
                  }}
                  className="px-4 py-2 border border-[#eaeaea] hover:bg-gray-50 text-xs font-medium text-[#787878]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] text-white text-xs font-medium transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAddProductOpen && (
        <AddProductModal
          shopUid={shop.shop_uid}
          onClose={() => setIsAddProductOpen(false)}
          onCreated={() => location.reload()}
        />
      )}
    </div>
  );
}
