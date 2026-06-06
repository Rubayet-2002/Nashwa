"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useToastStore } from "@/zustand/toastStore";
import { useAuthStore } from "@/zustand/authStore";
import Lightbox from "@/components/Lightbox";

interface Message {
  message_uid: string;
  sender_uid: string;
  receiver_uid: string;
  shop_uid: string;
  sender_role: string;
  message_text: string;
  message_type: string;
  image_url: string | null;
  form_data: any;
  product_ref_uid: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
}

interface ChatBubbleProps {
  msg: Message;
  currentUserId: string;
  isSellerView: boolean;
}

export default function ChatBubble({ msg, currentUserId, isSellerView }: ChatBubbleProps) {
  const addToast = useToastStore((s) => s.addToast);
  const { user } = useAuthStore();
  const [isPending, startTransition] = useTransition();

  // Parse Form Data
  const formData = typeof msg.form_data === "string" ? JSON.parse(msg.form_data) : msg.form_data;

  // Shipping Autofill state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryType, setDeliveryType] = useState<"standard" | "on_campus">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cod">("cod");

  // Lightbox State
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const isMe = isSellerView ? msg.sender_role === "seller" : msg.sender_role === "customer";
  const isOrderForm = msg.message_type === "order_form";
  const isPendingForm = isOrderForm && formData?.status === "pending";

  useEffect(() => {
    if (isPendingForm && !isSellerView) {
      // Fetch default shipping details from profile
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCustomerName(data.user.username || "");
            setCustomerPhone(data.user.phone || "");
            setDeliveryAddress(data.user.address || "");
            setCity(data.user.city || "");
            setPostalCode(data.user.postal_code || "");
          }
        })
        .catch(() => {});
    }
  }, [isPendingForm, isSellerView]);

  // Delivery charge calculations
  const unitPrice = Number(formData?.unit_price ?? 0);
  const qty = Number(formData?.quantity ?? 1);
  const subtotal = unitPrice * qty;

  const insideCharge = Number(formData?.inside_delivery_charge ?? 0);
  const outsideCharge = Number(formData?.outside_delivery_charge ?? 0);
  const isFreeCampus = !!formData?.free_on_campus_delivery;

  const deliveryCharge =
    deliveryType === "on_campus" ? (isFreeCampus ? 0 : insideCharge) : outsideCharge;
  const totalAmount = subtotal + deliveryCharge;

  // Handle Order Submit (Customer Side)
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      addToast("Please fill in Name, Phone, and Delivery Address", "error");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            shopUid: msg.shop_uid,
            items: [{ productUid: formData.product_uid, quantity: qty }],
            customerName,
            customerEmail: user?.email || "customer@nashwa.com",
            customerPhone,
            deliveryAddress,
            city,
            postalCode,
            deliveryType,
            paymentMethod,
            messageUid: msg.message_uid,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          addToast("Order placed successfully!", "success");
        } else {
          addToast(data.error || "Failed to place order", "error");
        }
      } catch (err) {
        addToast("Error placing order", "error");
      }
    });
  };

  // Handle Order Status Update (Seller/Buyer Side)
  const handleUpdateStatus = (status: "confirmed" | "cancelled" | "completed") => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/orders/${formData.order_uid}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            status,
            messageUid: msg.message_uid,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          addToast(`Order ${status} successfully!`, "success");
        } else {
          addToast(data.error || "Failed to update order", "error");
        }
      } catch (err) {
        addToast("Error updating order status", "error");
      }
    });
  };

  // 1. Image Message Type
  if (msg.message_type === "image" && msg.image_url) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className="relative max-w-xs h-48 border border-gray-200 rounded-none overflow-hidden cursor-pointer hover:opacity-95 transition-opacity bg-gray-50"
          onClick={() => msg.image_url && setLightboxSrc(msg.image_url)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.image_url} alt="Shared" className="w-full h-full object-cover" />
        </div>
        {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      </div>
    );
  }

  // 2. Product Reference Message Type
  if (msg.message_type === "product_ref" && msg.product_ref_uid) {
    const productData = formData || {};
    return (
      <div className="flex flex-col gap-1 max-w-sm">
        <div className="bg-white border border-[#eadfdb] rounded-none p-3 flex gap-3">
          <div
            className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-none overflow-hidden shrink-0 cursor-pointer"
            onClick={() => productData.image_url && setLightboxSrc(productData.image_url)}
          >
            {productData.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productData.image_url} alt={productData.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#BA5B55]">Pic</div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between text-xs">
            <div>
              <h5 className="font-bold text-[#1a1a1a] truncate leading-tight">{productData.title || "Product Listing"}</h5>
              <p className="text-[#BA5B55] font-semibold mt-1">{productData.price || "N/A"} BDT</p>
            </div>
            <Link
              href={`/product/${msg.product_ref_uid}`}
              className="text-[10px] text-[#BA5B55] hover:underline font-bold mt-2 inline-block self-start"
            >
              View Listing details &rarr;
            </Link>
          </div>
        </div>
        {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      </div>
    );
  }

  // 3. Interactive Order Form Message Type
  if (isOrderForm && formData) {
    const status = formData.status;

    return (
      <div className="bg-white border border-[#efe5e2] rounded-none p-5 max-w-md w-full text-xs text-[#1a1a1a] font-sans text-left">
        {/* Form Header */}
        <div className="border-b border-[#f7ecea] pb-3 mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-[#BA5B55]/10 text-[#BA5B55] rounded-none font-bold text-[10px]">ORDER FORM</span>
            <span className="font-bold text-gray-800">#{formData.order_uid ? formData.order_uid.slice(0, 8) : "Draft"}</span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
            status === "pending"
              ? "bg-amber-100 text-amber-700"
              : status === "submitted"
              ? "bg-blue-100 text-blue-700"
              : status === "confirmed"
              ? "bg-emerald-100 text-emerald-700"
              : status === "completed"
              ? "bg-emerald-600 text-white"
              : "bg-red-100 text-red-700"
          }`}>
            {status}
          </span>
        </div>

        {/* Product Summary */}
        <div className="bg-[#fdf9f8] border border-[#f5ecea] p-3 rounded-none mb-4">
          <h5 className="font-bold text-[#BA5B55] mb-1">{formData.product_title}</h5>
          <div className="flex justify-between text-gray-500 text-[10px]">
            <span>Unit Price: {unitPrice} BDT</span>
            <span>Quantity: {qty}</span>
            <span className="font-semibold text-gray-800">Subtotal: {subtotal} BDT</span>
          </div>
        </div>

        {/* STATUS 1: PENDING (Fill details) */}
        {status === "pending" && (
          isSellerView ? (
            <div className="text-center py-6 text-gray-400">
              <div className="w-8 h-8 border-2 border-[#BA5B55] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[11px] font-light">Awaiting customer shipping &amp; delivery confirmation...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="flex flex-col gap-3">
              <h6 className="font-bold text-gray-800 mb-1 border-b border-gray-100 pb-1">Shipping &amp; Delivery Details</h6>
              
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] font-semibold">Recipient Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-none outline-none focus:border-[#BA5B55] text-xs transition-colors"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-none outline-none focus:border-[#BA5B55] text-xs transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-500 text-[10px] font-semibold">Delivery Address</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, Campus Dorm, Room/Department"
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-none outline-none focus:border-[#BA5B55] text-xs transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] font-semibold">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Dhaka"
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-none outline-none focus:border-[#BA5B55] text-xs transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-[10px] font-semibold">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 1216"
                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-none outline-none focus:border-[#BA5B55] text-xs transition-colors"
                  />
                </div>
              </div>

              {/* Delivery Type */}
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-gray-500 text-[10px] font-semibold">Delivery Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("on_campus")}
                    className={`p-2.5 rounded-none border text-xs font-semibold cursor-pointer text-center ${
                      deliveryType === "on_campus"
                        ? "bg-[#BA5B55]/10 border-[#BA5B55] text-[#BA5B55]"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    On Campus Delivery {isFreeCampus && <span className="block text-[8px] text-emerald-500">(FREE)</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("standard")}
                    className={`p-2.5 rounded-none border text-xs font-semibold cursor-pointer text-center ${
                      deliveryType === "standard"
                        ? "bg-[#BA5B55]/10 border-[#BA5B55] text-[#BA5B55]"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    Home Shipping
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-gray-500 text-[10px] font-semibold">Payment Method</label>
                <div className="grid grid-cols-1">
                  <button
                    type="button"
                    className="p-2 bg-[#BA5B55]/10 border border-[#BA5B55] text-[#BA5B55] rounded-none text-[10px] font-bold text-center truncate cursor-default"
                  >
                    Cash on Delivery (COD)
                  </button>
                </div>
              </div>

              {/* Order total info */}
              <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal:</span>
                  <span>{subtotal} BDT</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Charge:</span>
                  <span>{deliveryCharge} BDT</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 text-sm mt-1">
                  <span>Grand Total:</span>
                  <span>{totalAmount} BDT</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 bg-[#BA5B55] hover:bg-[#a34e48] text-white font-bold rounded-none transition-colors cursor-pointer text-center text-xs mt-2"
              >
                {isPending ? "Confirming..." : "Place Cash on Delivery Order"}
              </button>
            </form>
          )
        )}

        {/* STATUS 2: SUBMITTED (Awaiting Seller Confirmation) */}
        {status === "submitted" && (
          <div className="flex flex-col gap-3 text-left">
            <div className="bg-[#f0f9ff] border border-[#d0e5ff] p-3 rounded-none text-[10px] text-blue-700 leading-normal mb-1">
              <strong className="block mb-0.5">Shipping Details Submitted</strong>
              <p>Recipient: {formData.customer_name} ({formData.customer_phone})</p>
              <p className="mt-0.5">Address: {formData.delivery_address}, {formData.city} {formData.postal_code}</p>
              <p className="mt-0.5">Method: {formData.delivery_type === "on_campus" ? "On Campus" : "Home Shipping"} &bull; {formData.payment_method?.toUpperCase()}</p>
              <p className="font-bold mt-1 text-[11px] text-blue-800">Total Charged: {formData.total_amount} BDT</p>
            </div>

            {isSellerView ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={isPending}
                  className="flex-1 py-2 text-xs font-semibold border border-red-200 text-red-600 rounded-none hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Cancel Order
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus("confirmed")}
                  disabled={isPending}
                  className="flex-1 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-none hover:bg-emerald-500 transition-colors cursor-pointer"
                >
                  Confirm Order
                </button>
              </div>
            ) : (
              <div className="text-center py-2 text-amber-600 font-semibold bg-amber-50 rounded-none border border-amber-100 animate-pulse text-[11px]">
                Awaiting shop owner order confirmation...
              </div>
            )}
          </div>
        )}

        {/* STATUS 3: CONFIRMED */}
        {status === "confirmed" && (
          <div className="flex flex-col gap-3 text-left">
            <div className="bg-[#f0fdf4] border border-[#dcfce7] p-3 rounded-none text-[10px] text-emerald-800 leading-normal">
              <strong className="block mb-0.5">Order Confirmed by Seller</strong>
              <p>Recipient: {formData.customer_name} ({formData.customer_phone})</p>
              <p className="mt-0.5">Address: {formData.delivery_address}, {formData.city} {formData.postal_code}</p>
              <p className="font-bold mt-1 text-[11px]">Amount Due: {formData.total_amount} BDT (COD)</p>
            </div>

            {isSellerView ? (
              <button
                type="button"
                onClick={() => handleUpdateStatus("completed")}
                disabled={isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none transition-colors cursor-pointer text-center"
              >
                Mark Delivered &amp; Completed
              </button>
            ) : (
              <div className="text-center py-2 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-none text-[11px]">
                Your package is being prepared for delivery!
              </div>
            )}
          </div>
        )}

        {/* STATUS 4: COMPLETED */}
        {status === "completed" && (
          <div className="flex flex-col gap-3 text-left">
            <div className="bg-emerald-600 text-white p-3.5 rounded-none text-[10px] leading-normal">
              <strong className="block mb-0.5 text-xs text-white">Order Completed &amp; Delivered</strong>
              <p>Recipient: {formData.customer_name} &bull; Total: {formData.total_amount} BDT</p>
            </div>

            {!isSellerView && (
              <Link
                href={`/product/${formData.product_uid}`}
                className="w-full py-2 bg-[#BA5B55] hover:bg-[#a34e48] text-white font-semibold rounded-none text-center cursor-pointer block transition-colors mt-1"
              >
                Leave a Product Review &amp; Rating &rarr;
              </Link>
            )}
          </div>
        )}

        {/* STATUS 5: CANCELLED */}
        {status === "cancelled" && (
          <div className="bg-red-50 border border-red-100 text-red-800 p-3.5 rounded-none text-[10px] leading-normal text-left">
            <strong className="block text-red-900 mb-0.5">Order Cancelled</strong>
            <p>This order request has been cancelled and voided.</p>
          </div>
        )}
      </div>
    );
  }

  // 4. Fallback Standard Text Message
  return (
    <div
      className={`px-3.5 py-2.5 text-xs leading-relaxed max-w-sm whitespace-pre-wrap break-words text-left ${
        isMe
          ? "bg-[#BA5B55] text-white rounded-[12px_12px_3px_12px]"
          : "bg-white border border-[#e8e8e8] text-[#1a1a1a] rounded-[12px_12px_12px_3px]"
      }`}
    >
      {msg.message_text}
    </div>
  );
}
