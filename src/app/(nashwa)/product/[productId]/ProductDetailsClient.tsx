"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { connectSocket } from "@/lib/socket-client";
import ProductCommentThread from "../../home/ProductCommentThread";
import ProductCard from "../../home/ProductCard";
import ContactSellerWidget from "@/components/ContactSellerWidget";
import Lightbox from "@/components/Lightbox";
import { X } from "@mynaui/icons-react";

interface ProductDetailsClientProps {
  product: {
    product_uid: string;
    title: string;
    description: string | null;
    price: string;
    original_price: string | null;
    discount_percent: string | null;
    currency: string;
    category: string | null;
    product_type: string;
    inside_delivery_charge: string;
    outside_delivery_charge: string;
    free_on_campus_delivery: boolean;
    sold_count: number;
    avg_rating: string | null;
    shop_uid: string;
    shop_name: string;
    shop_location: string;
    shop_profile_photo_url: string | null;
    shop_university_name: string | null;
    owner_uid: string;
    owner_name: string;
    shop_rating: string | null;
    shop_follower_count: number;
    variants?: any;
    product_details?: any;
  };
  images: string[];
  currentUserId: string | null;
  currentUserRole: string | null;
  initialIsFollowing: boolean;
}

export default function ProductDetailsClient({
  product,
  images = [],
  currentUserId,
  currentUserRole,
  initialIsFollowing,
}: ProductDetailsClientProps) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [activeImg, setActiveImg] = useState(0);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isSaved, setIsSaved] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"comments" | "reviews" | "ratings">("comments");

  // Likes state
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);

  // More products from this shop state
  const [moreProducts, setMoreProducts] = useState<any[]>([]);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);

  // Reviews & ratings state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // User interactions states
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
  const [reactedProducts, setReactedProducts] = useState<Set<string>>(new Set());
  const [canUserReview, setCanUserReview] = useState(false);

  // Review creation form states
  const [userReviewRating, setUserReviewRating] = useState(0);
  const [userReviewText, setUserReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Editing individual reviews from the list
  const [editingReviewUid, setEditingReviewUid] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editText, setEditText] = useState<string>("");
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);

  const handleEditReviewClick = (r: any) => {
    setEditingReviewUid(r.review_uid);
    setEditRating(r.rating);
    setEditText(r.review_text || "");
  };

  const handleCancelEdit = () => {
    setEditingReviewUid(null);
    setEditRating(0);
    setEditText("");
  };

  const handleSaveEditedReview = async (reviewUid: string) => {
    if (!editRating) {
      addToast("Please select a rating.", "error");
      return;
    }
    setSubmittingEdit(true);
    try {
      const res = await fetch(`/api/reviews/${reviewUid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          rating: editRating,
          reviewText: editText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Review updated successfully!", "success");
        setReviews((prev) =>
          prev.map((r) =>
            r.review_uid === reviewUid
              ? { ...r, rating: editRating, review_text: editText }
              : r
          )
        );
        setEditingReviewUid(null);
        router.refresh();
      } else {
        addToast(data.error || "Failed to update review.", "error");
      }
    } catch {
      addToast("Network error. Failed to update review.", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteReview = async (reviewUid: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await fetch(`/api/reviews/${reviewUid}`, {
        method: "DELETE",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Review deleted successfully!", "success");
        setReviews((prev) => prev.filter((r) => r.review_uid !== reviewUid));
        router.refresh();
      } else {
        addToast(data.error || "Failed to delete review.", "error");
      }
    } catch {
      addToast("Network error. Failed to delete review.", "error");
    }
  };

  const handleFollowChange = useCallback((shopUid: string, following: boolean) => {
    setIsFollowing(following);
  }, []);

  const handleSaveChange = useCallback((prodUid: string, saved: boolean) => {
    setSavedProducts((prev) => {
      const next = new Set(prev);
      if (saved) next.add(prodUid);
      else next.delete(prodUid);
      return next;
    });
  }, []);

  const handleReactChange = useCallback((prodUid: string, reacted: boolean) => {
    setReactedProducts((prev) => {
      const next = new Set(prev);
      if (reacted) next.add(prodUid);
      else next.delete(prodUid);
      return next;
    });
  }, []);

  // Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Shipping Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [note, setNote] = useState("");

  const allImages = images.length > 0 ? images : [];
  const isOwner = currentUserId === product.owner_uid;

  // Parse product variants
  let parsedVariants: any[] = [];
  try {
    parsedVariants = typeof product.variants === "string" ? JSON.parse(product.variants) : product.variants;
  } catch (e) {
    console.error("Failed to parse variants:", e);
  }

  // Parse product details (static specifications)
  let parsedProductDetails: any[] = [];
  try {
    parsedProductDetails = typeof product.product_details === "string" ? JSON.parse(product.product_details) : product.product_details;
    if (!Array.isArray(parsedProductDetails)) parsedProductDetails = [];
  } catch (e) {
    console.error("Failed to parse product details:", e);
  }

  // Initialize selected variants
  useEffect(() => {
    if (parsedVariants && Array.isArray(parsedVariants)) {
      const initial: Record<string, string> = {};
      parsedVariants.forEach((v: any) => {
        if (v.name && v.options && v.options.length > 0) {
          initial[v.name] = v.options[0];
        }
      });
      setSelectedVariants(initial);
    }
  }, [product.variants]);

  // Fetch reactions, saves, and more products from this shop
  useEffect(() => {
    let active = true;

    // Reactions
    fetch(`/api/products/${product.product_uid}/reactions`)
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        setLikeCount(d.count ?? 0);
        setHasLiked(!!d.reacted);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingLikes(false);
      });

    // Saves
    if (currentUserId) {
      fetch(`/api/products/${product.product_uid}/save`)
        .then((r) => r.json())
        .then((d) => {
          if (active) setIsSaved(!!d.saved);
        })
        .catch(() => {});
    }

    // User interactions
    if (currentUserId) {
      fetch("/api/user/interactions")
        .then((r) => r.json())
        .then((d) => {
          if (active) {
            setSavedProducts(new Set(d.savedProducts || []));
            setReactedProducts(new Set(d.reactedProducts || []));
          }
        })
        .catch(() => {});
    }

    // Check review eligibility
    if (currentUserId) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d) => {
          if (active && d.orders) {
            const hasCompletedOrder = d.orders.some((o: any) =>
              o.status === "completed" &&
              o.items &&
              Array.isArray(o.items) &&
              o.items.some((item: any) => item.product_uid === product.product_uid)
            );
            setCanUserReview(hasCompletedOrder);
          }
        })
        .catch(() => {});
    }

    // More products from shop
    setLoadingMoreProducts(true);
    fetch(`/api/shops/${product.shop_uid}`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d.posts) {
          setMoreProducts(d.posts);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingMoreProducts(false);
      });

    // Reviews list
    setLoadingReviews(true);
    fetch(`/api/products/${product.product_uid}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success && d.reviews) {
          setReviews(d.reviews);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingReviews(false);
      });

    return () => {
      active = false;
    };
  }, [product.product_uid, product.shop_uid, currentUserId]);

  // Fetch user info for pre-filling when modal opens
  useEffect(() => {
    if (!isPurchaseModalOpen || !currentUserId) return;
    fetch("/api/user/update-info")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.user) {
          const u = d.user;
          setCustomerName(u.username || "");
          setCustomerEmail(u.email || "");
          setCustomerPhone(u.phone || "");
          setDeliveryAddress(u.address || "");
        }
      })
      .catch((err) => console.error("Error pre-filling shipping details:", err));
  }, [isPurchaseModalOpen, currentUserId]);

  // Socket.io for likes
  useEffect(() => {
    const socket = connectSocket();
    socket.emit("join:product", { productId: product.product_uid });

    socket.on("product:like", (data: { count: number; reacted: boolean; userId: string }) => {
      setLikeCount(data.count);
      if (data.userId === currentUserId) setHasLiked(data.reacted);
    });

    return () => {
      socket.off("product:like");
    };
  }, [product.product_uid, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) {
      addToast("Please sign in to like products", "error");
      return;
    }
    const prevCount = likeCount;
    const prevReacted = hasLiked;
    setLikeCount((n) => (hasLiked ? n - 1 : n + 1));
    setHasLiked((v) => !v);

    try {
      const res = await fetch(`/api/products/${product.product_uid}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!res.ok) {
        setLikeCount(prevCount);
        setHasLiked(prevReacted);
      }
    } catch {
      setLikeCount(prevCount);
      setHasLiked(prevReacted);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      addToast("Please sign in to save products", "error");
      return;
    }
    setIsSaved((v) => !v);
    try {
      await fetch(`/api/products/${product.product_uid}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
      addToast(isSaved ? "Removed from saved items" : "Added to saved items!", "success");
      window.dispatchEvent(new Event("saved-posts:updated"));
    } catch {
      setIsSaved((v) => !v);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      addToast("Product link copied to clipboard!", "success");
    });
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      addToast("Please sign in to follow shops", "error");
      return;
    }
    setIsFollowing((v) => !v);
    try {
      await fetch(`/api/shops/${product.shop_uid}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      });
    } catch {
      setIsFollowing((v) => !v);
    }
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingOrder) return;

    if (!customerName || !customerPhone || !customerEmail || !deliveryAddress) {
      addToast("Please fill in all required shipping details", "error");
      return;
    }

    setSubmittingOrder(true);
    try {
      const variantStr = Object.entries(selectedVariants)
        .map(([name, opt]) => `${name}: ${opt}`)
        .join(" / ");

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid: product.shop_uid,
          items: [
            {
              productUid: product.product_uid,
              quantity: quantity,
              variant: variantStr || null,
            },
          ],
          customerName,
          customerEmail,
          customerPhone,
          deliveryAddress,
          city: null,
          postalCode: null,
          note: note || null,
          deliveryType: "standard",
          paymentMethod: "cod",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Order placed successfully! Check status in My Orders.", "success");
        setIsPurchaseModalOpen(false);
        router.refresh();
      } else {
        addToast(data.error || "Failed to place order request.", "error");
      }
    } catch {
      addToast("Network error. Failed to place order.", "error");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleSubmitProductReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userReviewRating) {
      addToast("Please select a star rating", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.product_uid}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          rating: userReviewRating,
          reviewText: userReviewText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Review submitted successfully!", "success");
        setUserReviewRating(0);
        setUserReviewText("");
        // Reload reviews list
        const revRes = await fetch(`/api/products/${product.product_uid}/reviews`);
        const revData = await revRes.json();
        if (revData.success && revData.reviews) {
          setReviews(revData.reviews);
        }
        router.refresh();
      } else {
        addToast(data.error || "Failed to submit review.", "error");
      }
    } catch {
      addToast("Network error. Failed to submit review.", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderShopCard = () => (
    <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-xs flex flex-col font-sans">
      {/* Cover Banner */}
      <div className="h-24 w-full bg-gradient-to-br from-[#fcf7f6] to-[#f4ece9] relative shrink-0" />

      <div className="px-5 pb-5 relative flex flex-col gap-4">
        {/* Profile Photo Overlapping cover */}
        <div className="flex items-end gap-3 -mt-8 relative z-10">
          <Link href={`/shop/${product.shop_uid}`}>
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white bg-white flex items-center justify-center shrink-0 shadow-sm">
              {product.shop_profile_photo_url ? (
                <Image src={product.shop_profile_photo_url} alt={product.shop_name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#fdf0ef] text-[#BA5B55] font-bold text-xl uppercase">
                  {product.shop_name.slice(0, 2)}
                </div>
              )}
            </div>
          </Link>
          <div className="min-w-0 pb-1">
            <Link href={`/shop/${product.shop_uid}`} className="text-sm font-bold text-[#1a1a1a] hover:text-[#BA5B55] transition-colors truncate block leading-tight">
              {product.shop_name}
            </Link>
            <span className="text-[10px] text-gray-500 block mt-0.5 font-light">
              @{product.owner_name}
            </span>
          </div>
        </div>

        {/* Location & University */}
        <div className="flex flex-col gap-1 text-xs text-gray-500 font-light mt-1">
          {product.shop_university_name && (
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#BA5B55]">
                <path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
              <span>{product.shop_university_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#BA5B55]">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{product.shop_location}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-3 mt-1 text-center">
          <div className="flex flex-col border-r border-gray-100">
            <span className="text-xs font-bold text-[#BA5B55]">{product.shop_follower_count ?? 0}</span>
            <span className="text-[9px] text-[#787878] uppercase font-semibold tracking-wider mt-0.5">Followers</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#BA5B55] flex items-center justify-center gap-0.5">
              {product.shop_rating ? Number(product.shop_rating).toFixed(1) : "—"}
              <svg width="10" height="10" viewBox="0 0 24 24" fill={product.shop_rating ? "#BA5B55" : "none"} stroke="#BA5B55" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </span>
            <span className="text-[9px] text-[#787878] uppercase font-semibold tracking-wider mt-0.5">Rating</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-1 w-full">
          <button
            onClick={handleFollow}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              isFollowing
                ? "bg-[#BA5B55] text-white border-[#BA5B55]"
                : "border-gray-200 text-[#555] hover:border-[#BA5B55] hover:text-[#BA5B55]"
            }`}
          >
            {isFollowing ? "Following" : "Follow Shop"}
          </button>

          <ContactSellerWidget
            shopUid={product.shop_uid}
            shopName={product.shop_name}
            shopOwnerUid={product.owner_uid}
            shopAvatar={product.shop_profile_photo_url}
            currentUser={currentUserId ? { uid: currentUserId, username: "" } : null}
          />
        </div>
      </div>
    </div>
  );

  const discountedPrice = Number(product.price);
  const originalPrice = product.original_price ? Number(product.original_price) : null;
  const hasDiscount = product.discount_percent && Number(product.discount_percent) > 0;
  const isPreorder = product.product_type === "preorder";

  const deliveryCharge = product.free_on_campus_delivery ? 0 : Number(product.inside_delivery_charge);

  const totalCost = (discountedPrice * quantity) + deliveryCharge;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Split column grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start lg:items-stretch min-h-0 lg:h-full overflow-y-auto lg:overflow-hidden">
        
        {/* LEFT COLUMN (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 lg:h-full lg:overflow-y-auto custom-scrollbar pr-1">
          
          {/* Mobile Shop Card (shown only on mobile/tablet) */}
          <div className="lg:hidden shrink-0">
            {renderShopCard()}
          </div>

          {/* Main Info Block */}
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Gallery (Left half of block) */}
            <div className="flex flex-col gap-4">
              <div
                onClick={() => allImages[activeImg] && setLightboxSrc(allImages[activeImg])}
                className="relative w-full aspect-square bg-[#fafafa] rounded-xl overflow-hidden border border-[#f0f0f0] cursor-pointer group"
              >
                {allImages[activeImg] ? (
                  <Image
                    src={allImages[activeImg]}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span className="text-xs mt-2">No photo available</span>
                  </div>
                )}

                {isPreorder && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200 rounded-full shadow-xs">
                    Pre-order
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImg(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-[#fafafa] ${
                        activeImg === idx ? "border-[#BA5B55]" : "border-transparent hover:border-[#BA5B55]/50"
                      }`}
                    >
                      <Image src={img} alt={`thumb-${idx}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Interactions row */}
              <div className="flex items-center justify-around border-t border-[#f5f5f5] pt-4 mt-2">
                <button
                  onClick={handleLike}
                  disabled={loadingLikes}
                  className="flex items-center gap-2 text-xs font-semibold text-[#555] hover:text-[#BA5B55] transition-colors cursor-pointer px-4 py-2 rounded-xl hover:bg-[#fdf0ef]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={hasLiked ? "#BA5B55" : "none"} stroke={hasLiked ? "#BA5B55" : "currentColor"} strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{likeCount} {likeCount === 1 ? "Like" : "Likes"}</span>
                </button>

                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 text-xs font-semibold text-[#555] hover:text-[#BA5B55] transition-colors cursor-pointer px-4 py-2 rounded-xl hover:bg-[#fdf0ef]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "#BA5B55" : "none"} stroke={isSaved ? "#BA5B55" : "currentColor"} strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-xs font-semibold text-[#555] hover:text-[#BA5B55] transition-colors cursor-pointer px-4 py-2 rounded-xl hover:bg-[#fdf0ef]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Info and Purchase (Right half of block) */}
            <div className="flex flex-col gap-5 justify-between">
              <div className="flex flex-col gap-4">
                
                {/* Category & Title & Static Specifications */}
                <div className="flex flex-col gap-1.5">
                  <h1 className="text-xl font-bold text-[#1a1a1a] leading-tight mb-1">{product.title}</h1>
                  
                  {product.category && (
                    <div className="flex text-xs leading-none">
                      <span className="w-16 text-gray-500 font-semibold">Category</span>
                      <span className="w-2.5 text-gray-400">:</span>
                      <span className="text-[#1a1a1a] font-semibold">{product.category}</span>
                    </div>
                  )}

                  {parsedProductDetails && parsedProductDetails.length > 0 && (
                    parsedProductDetails.map((o: any, idx: number) => (
                      <div key={idx} className="flex text-xs leading-none">
                        <span className="w-16 text-gray-500 font-semibold truncate">{o.name}</span>
                        <span className="w-2.5 text-gray-400">:</span>
                        <span className="text-[#1a1a1a] font-semibold">{o.value}</span>
                      </div>
                    ))
                  )}

                  <div className="flex text-xs leading-none items-center">
                    <span className="w-16 text-gray-500 font-semibold">Rating</span>
                    <span className="w-2.5 text-gray-400">:</span>
                    <div className="text-[#ba5b55] flex items-center gap-1 font-semibold">
                      <p>{product.avg_rating ? Number(product.avg_rating).toFixed(1) : "New"}</p>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#ba5b55" stroke="#ba5b55" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-2.5">
                  <span className="text-2xl font-bold text-[#BA5B55]">{product.currency} {discountedPrice.toFixed(0)}</span>
                  {hasDiscount && originalPrice && (
                    <>
                      <span className="text-sm line-through text-[#aaa]">{product.currency} {originalPrice.toFixed(0)}</span>
                      <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                        -{Number(product.discount_percent).toFixed(0)}% Off
                      </span>
                    </>
                  )}
                </div>

                {/* Variant selection Pills */}
                {parsedVariants && parsedVariants.length > 0 && (
                  <div className="flex flex-col gap-3 py-3 border-y border-[#f0f0f0] my-1">
                    <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Product Options</h3>
                    <div className="flex flex-col gap-3">
                      {parsedVariants.map((v: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-semibold text-[#787878]">{v.name}:</span>
                          <div className="flex flex-wrap gap-2">
                            {v.options && Array.isArray(v.options) && v.options.map((opt: string, oIdx: number) => {
                              const isSelected = selectedVariants[v.name] === opt;
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  onClick={() => setSelectedVariants((prev) => ({ ...prev, [v.name]: opt }))}
                                  className={`px-3 py-1.5 text-xs border rounded-xl font-medium transition-all cursor-pointer ${
                                    isSelected
                                      ? "border-[#BA5B55] bg-[#BA5B55]/5 text-[#BA5B55]"
                                      : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="py-1">
                    <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-1.5">Description</h3>
                    <p className="text-xs text-[#555] leading-relaxed font-light whitespace-pre-wrap">{product.description}</p>
                  </div>
                )}

                {/* Delivery charges */}
                <div className="bg-[#fcf8f7] border border-[#f7e6e3] rounded-xl p-4 mt-1">
                  <h3 className="text-xs font-bold text-[#BA5B55] uppercase tracking-wider mb-2">Delivery Charge</h3>
                  <div className="text-xs font-light text-[#555]">
                    <span className="font-semibold block text-[#1a1a1a]">Standard Shipping</span>
                    {product.free_on_campus_delivery ? (
                      <span className="text-emerald-600 font-bold text-[11px] block mt-0.5">Free</span>
                    ) : (
                      <span className="block mt-0.5">{product.currency} {Number(product.inside_delivery_charge).toFixed(0)}</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Dominant Purchase Button */}
              <div className="border-t border-[#f5f5f5] pt-5 mt-4">
                {!currentUserId ? (
                  <Link
                    href="/email"
                    className="w-full text-center block text-xs bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] transition-all py-3 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    Sign in to Purchase
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsPurchaseModalOpen(true)}
                    className="w-full text-center text-xs bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] transition-all py-3 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    Purchase Product
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* TABS CONTAINER */}
          <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-xs flex flex-col">
            
            {/* Tabs Header */}
            <div className="flex bg-[#fafafa] border-b border-[#e8e8e8] px-6 py-3.5 gap-6 text-xs font-semibold shrink-0">
              <button
                onClick={() => setActiveTab("comments")}
                className={`pb-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === "comments" ? "border-[#BA5B55] text-[#BA5B55] font-bold" : "border-transparent text-[#787878] hover:text-[#BA5B55]"
                }`}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === "reviews" ? "border-[#BA5B55] text-[#BA5B55] font-bold" : "border-transparent text-[#787878] hover:text-[#BA5B55]"
                }`}
              >
                Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab("ratings")}
                className={`pb-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === "ratings" ? "border-[#BA5B55] text-[#BA5B55] font-bold" : "border-transparent text-[#787878] hover:text-[#BA5B55]"
                }`}
              >
                Ratings &amp; Average
              </button>
            </div>

            {/* Tabs Content */}
            <div className="p-6">
              {activeTab === "comments" && (
                <ProductCommentThread
                  productUid={product.product_uid}
                  shopUid={product.shop_uid}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  shopOwnerUid={product.owner_uid}
                />
              )}

              {activeTab === "reviews" && (
                <div className="flex flex-col gap-4">
                  {currentUserId && canUserReview && (
                    <form onSubmit={handleSubmitProductReview} className="bg-white border border-gray-150 p-4 rounded-xl flex flex-col gap-3.5 mb-4 shadow-3xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#BA5B55] uppercase tracking-wider">Leave a Review</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              onClick={() => setUserReviewRating(starVal)}
                              className="text-gray-300 hover:text-amber-400 transition-colors cursor-pointer"
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill={starVal <= userReviewRating ? "#fbbf24" : "none"}
                                stroke={starVal <= userReviewRating ? "#fbbf24" : "currentColor"}
                                strokeWidth="2"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        placeholder="Share your experience with this product..."
                        value={userReviewText}
                        onChange={(e) => setUserReviewText(e.target.value)}
                        rows={2}
                        className="w-full text-xs border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-[#BA5B55] bg-[#fafafa] text-[#1a1a1a] resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-5 py-2 bg-[#BA5B55] hover:bg-[#a34e48] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-3xs"
                        >
                          {submittingReview ? "Submitting..." : "Submit Review"}
                        </button>
                      </div>
                    </form>
                  )}

                  {loadingReviews ? (
                    <div className="text-center py-6 text-xs text-gray-400">Loading reviews...</div>
                  ) : reviews.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {reviews.map((r) => {
                        const isEditing = editingReviewUid === r.review_uid;
                        return (
                          <div key={r.review_uid} className="bg-[#fdfdfd] border border-gray-100 p-4 rounded-xl shadow-3xs flex flex-col gap-2">
                            {isEditing ? (
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#BA5B55] uppercase tracking-wider">Edit Rating</span>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((starVal) => (
                                      <button
                                        key={starVal}
                                        type="button"
                                        onClick={() => setEditRating(starVal)}
                                        className="text-gray-300 hover:text-amber-400 transition-colors cursor-pointer"
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 24 24"
                                          fill={starVal <= editRating ? "#fbbf24" : "none"}
                                          stroke={starVal <= editRating ? "#fbbf24" : "currentColor"}
                                          strokeWidth="2"
                                        >
                                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={2}
                                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a] resize-none"
                                />
                                <div className="flex justify-end gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1.5 border border-gray-200 text-gray-500 rounded-xl text-[10px] font-semibold hover:bg-gray-50 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={submittingEdit}
                                    onClick={() => handleSaveEditedReview(r.review_uid)}
                                    className="px-3.5 py-1.5 bg-[#BA5B55] hover:bg-[#9e4f4a] text-white text-[10px] font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                                  >
                                    {submittingEdit ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#e8e8e8] bg-[#fafafa]">
                                      {r.profile_photo_url ? (
                                        <Image src={r.profile_photo_url} alt="" fill className="object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#BA5B55] font-bold text-xs uppercase bg-[#BA5B55]/5">
                                          {r.username ? r.username.slice(0, 2) : "Me"}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-[#1a1a1a]">{r.username || "Anonymous"}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-gray-400 font-light">{new Date(r.created_at).toLocaleDateString()}</p>
                                        <span className="h-1 w-1 bg-gray-300 rounded-full" />
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-0.5">
                                          ✓ Verified Purchase
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="flex gap-0.5 text-amber-400">
                                      {Array.from({ length: 5 }).map((_, starIdx) => (
                                        <svg
                                          key={starIdx}
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill={starIdx < r.rating ? "currentColor" : "none"}
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                      ))}
                                    </div>

                                    {currentUserId && (currentUserId === r.user_uid || currentUserRole === "admin") && (
                                      <div className="flex gap-1.5 ml-2">
                                        <button
                                          type="button"
                                          onClick={() => handleEditReviewClick(r)}
                                          className="text-[10px] text-gray-500 hover:text-[#BA5B55] font-semibold transition-colors cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <span className="text-[10px] text-gray-300 font-light">|</span>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReview(r.review_uid)}
                                          className="text-[10px] text-red-500 hover:text-red-700 font-semibold transition-colors cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {r.review_text && (
                                  <p className="text-xs text-[#555] font-light leading-relaxed whitespace-pre-wrap pl-10">
                                    {r.review_text}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-xs text-gray-400 font-light">
                      No customer reviews yet. Be the first to buy and leave a review!
                    </div>
                  )}
                </div>
              )}

              {activeTab === "ratings" && (
                <div className="flex flex-col md:flex-row gap-8 items-center py-4">
                  {/* Big Score Card */}
                  <div className="flex flex-col items-center justify-center text-center p-6 border border-gray-100 bg-[#fafafa]/50 rounded-xl shrink-0 w-full md:w-44 shadow-2xs">
                    <span className="text-4xl font-extrabold text-[#BA5B55] leading-none">
                      {product.avg_rating ? Number(product.avg_rating).toFixed(1) : "0.0"}
                    </span>
                    <div className="flex gap-0.5 text-amber-400 mt-2">
                      {Array.from({ length: 5 }).map((_, starIdx) => {
                        const avg = product.avg_rating ? Number(product.avg_rating) : 0;
                        return (
                          <svg
                            key={starIdx}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={starIdx < Math.round(avg) ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-gray-400 font-light mt-3 block">
                      Based on {reviews.length} reviews
                    </span>
                    <span className="text-[10px] text-[#BA5B55] font-bold mt-1.5 block">
                      {product.sold_count} units sold
                    </span>
                  </div>

                  {/* Rating Breakdown Bars */}
                  <div className="flex-1 w-full flex flex-col gap-2">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const starNum = 5 - idx;
                      const count = reviews.filter((r) => Math.round(Number(r.rating)) === starNum).length;
                      const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      
                      return (
                        <div key={idx} className="flex items-center gap-3 text-xs text-[#555] font-light">
                          <span className="w-12 text-right">{starNum} Star</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (1/3 width) */}
        <div className="lg:col-span-1 flex flex-col gap-6 min-h-0 lg:h-full lg:overflow-y-auto custom-scrollbar pr-1">
          
          {/* Shop Card */}
          <div className="hidden lg:block shrink-0">
            {renderShopCard()}
          </div>

          {/* Shop Posts Stream */}
          <div className="flex flex-col gap-4 mt-2">
            <h3 className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider pl-1">Shop Posts</h3>
            
            {loadingMoreProducts ? (
              <div className="text-center py-6 text-xs text-gray-400">Loading posts...</div>
            ) : moreProducts.length > 0 ? (
              <div className="flex flex-col gap-5">
                {moreProducts.map((p) => (
                  <ProductCard
                    key={p.product_uid}
                    product={p}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    isFollowing={isFollowing}
                    isSaved={savedProducts.has(p.product_uid)}
                    hasReacted={reactedProducts.has(p.product_uid)}
                    onFollowChange={handleFollowChange}
                    onSaveChange={handleSaveChange}
                    onReactChange={handleReactChange}
                    hideFollowButton={true}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-400 font-light bg-white border border-gray-150 rounded-xl">
                No other posts from this shop.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* PURCHASE FLOW MODAL */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55 backdrop-blur-xs" onClick={() => setIsPurchaseModalOpen(false)} />
          <div className="relative z-10 bg-[#fcfcfd] border border-[#eadfdb] max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] rounded-none shadow-none">
            
            {/* Modal Header */}
            <div className="w-full px-5 py-4 border-b border-[#eadfdb] flex items-center justify-between bg-[#fcfbfa] shrink-0">
              <div>
                <p className="text-[10px] font-bold text-[#BA5B55] uppercase tracking-wider">Purchase request</p>
                <h3 className="text-sm font-bold text-[#1a1a1a] mt-0.5">Order from {product.shop_name}</h3>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-gray-400 hover:text-[#BA5B55] outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleConfirmPurchase} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar text-xs">
              
              {/* Product and Quantity Selector */}
              <div className="flex items-center justify-between p-3 border border-[#eadfdb] bg-white rounded-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-none overflow-hidden bg-white border border-[#eadfdb] shrink-0">
                    {allImages[0] ? (
                      <Image src={allImages[0]} alt="" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1a1a1a] truncate leading-none">{product.title}</p>
                    <p className="text-[#BA5B55] font-bold mt-1.5">৳{discountedPrice.toFixed(0)}</p>
                  </div>
                </div>

                <div className="flex items-center border border-[#eadfdb] bg-white rounded-none">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 hover:bg-gray-50 font-bold border-r border-[#eadfdb] select-none cursor-pointer rounded-none bg-white"
                  >
                    -
                  </button>
                  <span className="px-4 font-bold text-[#1a1a1a]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1.5 hover:bg-gray-50 font-bold border-l border-[#eadfdb] select-none cursor-pointer rounded-none bg-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Variants / Product options */}
              {parsedVariants && parsedVariants.length > 0 && (
                <div className="flex flex-col gap-3 py-1">
                  <h4 className="font-bold text-[#1a1a1a] uppercase tracking-wider">Select Options</h4>
                  <div className="flex flex-col gap-3">
                    {parsedVariants.map((v: any, idx: number) => (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-[#787878]">{v.name}:</span>
                        <div className="flex flex-wrap gap-2">
                          {v.options && Array.isArray(v.options) && v.options.map((opt: string, oIdx: number) => {
                            const isSelected = selectedVariants[v.name] === opt;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => setSelectedVariants((prev) => ({ ...prev, [v.name]: opt }))}
                                className={`px-3 py-1.5 border font-medium transition-all cursor-pointer rounded-none ${
                                  isSelected
                                    ? "border-[#BA5B55] bg-[#BA5B55]/5 text-[#BA5B55]"
                                    : "border-[#eadfdb] hover:border-gray-300 bg-white text-gray-700"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipping parameters info */}
              <div className="flex flex-col gap-3 mt-1">
                <h4 className="font-bold text-[#1a1a1a] uppercase tracking-wider">Shipping Details</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[#787878]">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-[#eadfdb] rounded-none px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-[#787878]">Customer Phone</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full border border-[#eadfdb] rounded-none px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[#787878]">Email address</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full border border-[#eadfdb] rounded-none px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[#787878]">Delivery Address</label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full border border-[#eadfdb] rounded-none px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a] resize-none"
                    placeholder="Dorm building, room number, university street..."
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-[#787878]">Note for seller (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Please wrap carefully..."
                    className="w-full border border-[#eadfdb] rounded-none px-3 py-2 outline-none focus:border-[#BA5B55] bg-white text-[#1a1a1a]"
                  />
                </div>
              </div>

              {/* Payment method selection */}
              <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 mt-2">
                <h4 className="font-bold text-[#1a1a1a] uppercase tracking-wider">Payment Method</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                  <div className="p-3 border border-[#BA5B55] bg-[#BA5B55]/5 text-[#BA5B55] rounded-none flex flex-col items-center justify-center gap-1 cursor-default">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span>COD (Cash)</span>
                  </div>
                  
                  <div className="p-3 border border-[#eadfdb] bg-gray-50 text-gray-400 rounded-none flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed select-none">
                    <span className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-[8px] text-white">b</span>
                    <span>bKash</span>
                  </div>

                  <div className="p-3 border border-[#eadfdb] bg-gray-50 text-gray-400 rounded-none flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed select-none">
                    <span className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-[8px] text-white">n</span>
                    <span>Nagad</span>
                  </div>
                </div>
              </div>

            </form>

            {/* Modal Actions */}
            <div className="w-full border-t border-[#eadfdb] px-6 py-4 flex flex-col gap-3 bg-[#fcfbfa] shrink-0">
              <div className="flex flex-col gap-1.5 text-xs text-gray-500 font-light px-1">
                <div className="flex justify-between">
                  <span>Subtotal ({quantity} unit{quantity > 1 ? "s" : ""})</span>
                  <span className="font-semibold text-[#1a1a1a]">৳{(discountedPrice * quantity).toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-[#1a1a1a]">
                    ৳{Number(deliveryCharge).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 text-sm font-bold text-[#1a1a1a]">
                  <span>Total cost</span>
                  <span className="text-[#BA5B55]">৳{Number(totalCost).toFixed(0)}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 border border-[#eadfdb] hover:bg-gray-50 text-xs font-semibold text-gray-500 rounded-none cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  disabled={submittingOrder}
                  className="px-5 py-2 bg-[#BA5B55] hover:bg-[#a34e48] disabled:opacity-50 text-white text-xs font-bold rounded-none cursor-pointer transition-colors"
                >
                  {submittingOrder ? "Placing Order..." : "Confirm Purchase"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Lightbox */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt={product.title}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </div>
  );
}
