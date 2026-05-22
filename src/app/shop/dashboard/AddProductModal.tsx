"use client";

import { useState } from "react";
import ImageUpload from "@/(nashwa)/component/ImageUpload";
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form onSubmit={handleCreate} className="relative bg-white border border-[#eaeaea] w-full max-w-2xl p-6 shadow-xl rounded-sm z-10">
        <h3 className="text-lg font-bold">Add New Product</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#787878]">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="p-2 border border-[#eaeaea]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#787878]">Price</label>
            <input value={price} onChange={(e) => setPrice(e.target.value)} required type="number" step="0.01" className="p-2 border border-[#eaeaea]" />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs text-[#787878]">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 border border-[#eaeaea]" rows={4} />
          </div>
          <div className="md:col-span-2">
            <ImageUpload label="Product images" multiple folder="nashwa_products" onUploaded={(u) => setImageUrls(Array.isArray(u) ? u : [u])} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-[#eaeaea]">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#BA5B55] text-white">{isSubmitting ? 'Creating...' : 'Create Product'}</button>
        </div>
      </form>
    </div>
  );
}
