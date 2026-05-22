"use client";

import { useState } from "react";
import ImageUpload from "../../(nashwa)/component/ImageUpload";
import { useToastStore } from "@/zustand/toastStore";

export default function AddProductModal({ shopUid, onClose, onCreated }: { shopUid: string; onClose: () => void; onCreated?: () => void; }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("BDT");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || imageUrls.length === 0) return addToast("Please fill required fields", "error");
    setSubmitting(true);
    try {
      const res = await fetch("/shop/api/create-product", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({ shopUid, title, description, price: parseFloat(price), currency, images: imageUrls }),
      });
      const j = await res.json();
      if (res.ok) {
        addToast("Product created", "success");
        onCreated?.();
        onClose();
      } else {
        addToast(j.message || "Failed to create product", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleCreate} className="relative z-10 w-full max-w-4xl overflow-hidden border border-[#eef0f3] bg-white shadow-2xl rounded-sm">
        <div className="border-b border-[#eef0f3] bg-[#fcfcfd] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">Product listing</p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[#1a1a1a]">Add New Product</h3>
              <p className="mt-1 text-xs text-[#787878]">Keep the product upload flow consistent with the rest of the shop dashboard.</p>
            </div>
            <div className="hidden rounded-sm border border-[#eef0f3] bg-white px-3 py-2 text-right md:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#787878]">Gallery</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">{imageUrls.length} image(s)</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-[#eef0f3] p-6 lg:border-b-0 lg:border-r">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Product title"
                  className="w-full border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#BA5B55]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Price</label>
                <div className="flex items-center border border-[#eaeaea] bg-white px-3 py-2 transition-colors focus-within:border-[#BA5B55]">
                  <span className="text-sm text-[#787878]">{currency}</span>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="ml-2 w-full border-0 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short product description, materials, size, or anything customers should know."
                  className="min-h-32 w-full resize-none border border-[#eaeaea] bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[#BA5B55]"
                  rows={5}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#fcfcfd] p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#787878]">Product images</p>
                <p className="mt-1 text-xs text-[#787878]">Upload the gallery first, then create the product listing.</p>
              </div>
              <span className="rounded-full border border-[#eef0f3] bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#BA5B55]">
                Required
              </span>
            </div>

            <div className="rounded-sm border border-[#eef0f3] bg-white p-4 shadow-sm">
              <ImageUpload label="Select product photos" multiple folder="nashwa_products" onUploaded={(u) => setImageUrls(Array.isArray(u) ? u : [u])} />
            </div>

            <div className="mt-4 rounded-sm border border-dashed border-[#dbe1e8] bg-white px-4 py-3 text-xs text-[#787878]">
              The product will be stored in the same visual system used for shop profile and cover uploads.
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef0f3] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-[#eaeaea] text-xs font-medium text-[#787878] hover:border-[#BA5B55] hover:text-[#BA5B55]">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#BA5B55] text-white text-xs font-medium border border-[#BA5B55] transition-colors hover:bg-white hover:text-[#BA5B55] disabled:opacity-70">
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
