"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useToastStore } from "@/zustand/toastStore";
import { Package, ShoppingBag, X } from "@mynaui/icons-react";

type Product = {
  product_uid: string;
  title: string;
  description: string | null;
  price: string;
  currency: string;
  image_url: string | null;
};

type CurrentUser = {
  username: string;
  email: string;
  phone?: string | null;
} | null;

export default function ShopOrderSystem({
  shopUid,
  shopName,
  products,
  currentUser,
}: {
  shopUid: string;
  shopName: string;
  products: Product[];
  currentUser: CurrentUser;
}) {
  const addToast = useToastStore((s) => s.addToast);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState(currentUser?.username || "");
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || "");
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = useMemo(() => {
    if (!selectedProduct) return 0;
    return Number(selectedProduct.price) * Math.max(1, quantity);
  }, [quantity, selectedProduct]);

  const openOrder = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setNote("");
  };

  const closeOrder = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setAddress("");
    setNote("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!customerName || !customerEmail || !customerPhone || !address) {
      addToast("Please fill in all required fields.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/shop/api/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid,
          productUid: selectedProduct.product_uid,
          quantity,
          customerName,
          customerEmail,
          customerPhone,
          deliveryAddress: address,
          note,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        addToast("Order placed successfully!", "success");
        closeOrder();
      } else {
        addToast(result.message || "Failed to place order", "error");
      }
    } catch (error) {
      addToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 bg-white border border-[#eaeaea] p-6 shadow-sm min-h-100">
      <div className="border-b border-[#f4f4f4] pb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-[#BA5B55]" />
          <h2 className="text-base font-semibold text-[#1a1a1a]">Shop Products</h2>
        </div>
        <span className="text-xs text-[#787878] font-light">{products.length} Products</span>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {products.map((product) => (
            <article key={product.product_uid} className="border border-[#eaeaea] bg-[#fcfcfd] overflow-hidden shadow-sm flex flex-col rounded-sm">
              <div className="relative aspect-[4/3] bg-[#f3f4f6]">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.title} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#787878]/30">
                    <Package size={36} />
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#1a1a1a] leading-snug">{product.title}</h3>
                  <span className="shrink-0 text-xs font-medium text-[#BA5B55] whitespace-nowrap">{product.currency} {Number(product.price).toFixed(2)}</span>
                </div>

                <p className="text-xs text-[#787878] font-light leading-relaxed line-clamp-3 flex-1">
                  {product.description || "No description added."}
                </p>

                <button
                  type="button"
                  onClick={() => openOrder(product)}
                  className="mt-2 inline-flex items-center justify-center gap-2 border border-[#BA5B55] bg-[#BA5B55] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white hover:text-[#BA5B55]"
                >
                  <ShoppingBag size={14} />
                  Order Now
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <Package stroke={1} size={48} className="text-[#787878]/30 mb-3" />
          <h3 className="text-sm font-medium text-[#1a1a1a]">No products listed yet</h3>
          <p className="text-xs text-[#787878] max-w-xs mx-auto mt-1 font-light leading-relaxed">
            This shop hasn't published any products to their collection yet. Check back soon!
          </p>
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeOrder} />
          <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-3xl overflow-hidden border border-[#eef0f3] bg-white shadow-2xl rounded-sm">
            <div className="flex items-center justify-between border-b border-[#eef0f3] bg-[#fcfcfd] px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">Order from {shopName}</p>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-[#1a1a1a]">{selectedProduct.title}</h3>
              </div>
              <button type="button" onClick={closeOrder} className="rounded-full border border-[#eaeaea] p-2 text-[#787878] hover:border-[#BA5B55] hover:text-[#BA5B55]">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="border-b border-[#eef0f3] p-6 lg:border-b-0 lg:border-r">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f4f6] rounded-sm border border-[#eef0f3]">
                  {selectedProduct.image_url ? (
                    <Image src={selectedProduct.image_url} alt={selectedProduct.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#787878]/30">
                      <Package size={36} />
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#787878]">Unit price</span>
                    <span className="font-semibold text-[#1a1a1a]">{selectedProduct.currency} {Number(selectedProduct.price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#787878]">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-8 w-8 border border-[#eaeaea] text-[#1a1a1a]">-</button>
                      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                      <button type="button" onClick={() => setQuantity((q) => q + 1)} className="h-8 w-8 border border-[#eaeaea] text-[#1a1a1a]">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#f4f4f4] pt-2 text-sm">
                    <span className="text-[#787878]">Total</span>
                    <span className="font-semibold text-[#BA5B55]">{selectedProduct.currency} {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Name</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Email</label>
                    <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} type="email" className="w-full border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]" />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Phone</label>
                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]" />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Delivery address</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full resize-none border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]" />
                  </div>
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Note</label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full resize-none border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none focus:border-[#BA5B55]" />
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-3 border-t border-[#f4f4f4] pt-4">
                  <button type="button" onClick={closeOrder} className="px-4 py-2 border border-[#eaeaea] text-xs font-medium text-[#787878] hover:border-[#BA5B55] hover:text-[#BA5B55]">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#BA5B55] text-white text-xs font-medium border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] disabled:opacity-70">
                    {isSubmitting ? "Placing..." : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}