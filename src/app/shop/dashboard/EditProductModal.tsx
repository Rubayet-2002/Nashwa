"use client";

import { useState, useEffect } from "react";
import { useToastStore } from "@/zustand/toastStore";
import { PlusCircle, Trash, Plus } from "@mynaui/icons-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";

const CATEGORIES = [
  "Food & Beverages",
  "Fashion & Clothing",
  "Art & Crafts",
  "Electronics",
  "Books & Stationery",
  "Beauty & Skincare",
  "Accessories",
  "Home Decor",
  "Services",
  "Other",
];

interface VariantField {
  name: string;
  rawValue: string;
}

interface OptionField {
  name: string;
  value: string;
}

interface EditProductModalProps {
  product: {
    product_uid: string;
    title: string;
    description: string | null;
    price: string | number;
    original_price: string | number | null;
    discount_percent: string | number | null;
    category: string | null;
    product_type: string;
    inside_delivery_charge: string | number | null;
    outside_delivery_charge: string | number | null;
    free_on_campus_delivery: boolean;
    variants: any;
    image_urls: string[];
    product_details?: any;
  };
  onClose: () => void;
  onUpdated?: () => void;
}

export default function EditProductModal({
  product,
  onClose,
  onUpdated,
}: EditProductModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [isSubmitting, setSubmitting] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  

  const initialOptions: OptionField[] = (() => {
    try {
      const parsed = typeof product.product_details === "string" ? JSON.parse(product.product_details) : product.product_details;
      if (Array.isArray(parsed)) {
        return parsed.map((o: any) => ({
          name: o.name || "",
          value: o.value || "",
        }));
      }
    } catch (e) {
      console.error("Error parsing product details:", e);
    }
    return [];
  })();

  const initialVariants: VariantField[] = (() => {
    try {
      const parsed = typeof product.variants === "string" ? JSON.parse(product.variants) : product.variants;
      if (Array.isArray(parsed)) {
        return parsed.map((v: any) => ({
          name: v.name || "",
          rawValue: Array.isArray(v.options) ? v.options.join(", ") : "",
        }));
      }
    } catch (e) {
      console.error("Error parsing product variants:", e);
    }
    return [];
  })();

  

  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.original_price !== null ? String(product.original_price) : String(product.price));
  const [category, setCategory] = useState(product.category || "");
  
  

  const [deliveryCharge, setDeliveryCharge] = useState(product.inside_delivery_charge !== null ? String(product.inside_delivery_charge) : "");

  

  const [discountPercent, setDiscountPercent] = useState(product.discount_percent !== null ? String(product.discount_percent) : "");

  

  const [options, setOptions] = useState<OptionField[]>(initialOptions);
  const [variants, setVariants] = useState<VariantField[]>(initialVariants);

  

  const [existingUrls, setExistingUrls] = useState<string[]>(Array.isArray(product.image_urls) ? product.image_urls : []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const limit = 4 - existingUrls.length;
      if (filesArray.length > limit) {
        addToast(`You can only select up to ${limit} more images. (Max 4 total)`, "error");
      }
      setSelectedFiles((prev) => [...prev, ...filesArray].slice(0, limit));
    }
  };

  const removeExistingUrl = (index: number) => {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const addOptionField = () => {
    setOptions([...options, { name: "", value: "" }]);
  };

  const removeOptionField = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOptionField = (index: number, key: keyof OptionField, value: string) => {
    const updated = [...options];
    updated[index][key] = value;
    setOptions(updated);
  };

  const addVariantField = () => {
    setVariants([...variants, { name: "", rawValue: "" }]);
  };

  const removeVariantField = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantField = (index: number, key: keyof VariantField, value: string) => {
    const updated = [...variants];
    updated[index][key] = value;
    setVariants(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingUrls.length + selectedFiles.length === 0) {
      return addToast("Please keep or add at least 1 image", "error");
    }
    if (!title || !price || !category) {
      return addToast("Please fill all required fields (*)", "error");
    }

    const basePrice = parseFloat(price);
    const discount = discountPercent ? parseFloat(discountPercent) : 0;
    const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
    const origPrice = discount > 0 ? basePrice : null;

    const parsedDeliveryCharge = deliveryCharge ? parseFloat(deliveryCharge) : 0;

    const processedOptions = options
      .map(o => ({ name: o.name.trim(), value: o.value.trim() }))
      .filter(o => o.name && o.value);

    const processedVariants = variants
      .map((v) => {
        const name = v.name.trim();
        const options = v.rawValue
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean);
        return { name, options };
      })
      .filter((v) => v.name && v.options.length > 0);

    setSubmitting(true);
    try {
      

      const newUrls: string[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgressText(`Uploading new image ${i + 1} of ${selectedFiles.length}...`);
        const url = await uploadImageToCloudinary(selectedFiles[i], "nashwa_products");
        newUrls.push(url);
      }

      setUploadProgressText("Saving changes...");

      

      const res = await fetch(`/api/products/${product.product_uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          title,
          description,
          category,
          price: finalPrice,
          originalPrice: origPrice,
          discountPercent: discount,
          insideDeliveryCharge: parsedDeliveryCharge,
          outsideDeliveryCharge: parsedDeliveryCharge,
          freeOnCampusDelivery: false,
          variants: processedVariants,
          productDetails: processedOptions,
          images: [...existingUrls, ...newUrls],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast("Product updated successfully", "success");
        onUpdated?.();
        onClose();
      } else {
        addToast(data.error || "Failed to update product", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to update product due to network error", "error");
    } finally {
      setSubmitting(false);
      setUploadProgressText("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSave}
        className="relative z-10 w-full max-w-4xl overflow-hidden border border-[#eadfdb] bg-white shadow-2xl rounded-none flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="border-b border-[#eadfdb] bg-[#fcfcfd] px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">
            Modify Product Listing
          </p>
          <div className="mt-1 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[#1a1a1a]">Edit Product Details</h3>
              <p className="mt-1 text-xs text-[#787878]">
                Update details, manage photos, and save changes.
              </p>
            </div>
            <div className="hidden rounded-none border border-[#eadfdb] bg-white px-4 py-2 text-right md:block">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#787878]">Total Images</p>
              <p className="text-sm font-semibold text-[#1a1a1a]">
                {existingUrls.length + selectedFiles.length} of 4
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {/* STEP 1: Product Images selection */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55] flex items-center gap-1.5">
                <span>1. Edit / View Product Photos (Max 4)</span>
                <span className="text-[#BA5B55]">*</span>
              </label>
              <span className="text-[10px] text-gray-400 font-light">Delete existing or choose new ones</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-start">
              {/* Selector Box */}
              <div className="sm:col-span-1">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="edit-image-picker"
                  disabled={existingUrls.length + selectedFiles.length >= 4}
                />
                <label
                  htmlFor="edit-image-picker"
                  className={`w-full aspect-square border border-dashed flex flex-col justify-center items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                    existingUrls.length + selectedFiles.length >= 4
                      ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-[#eadfdb] text-[#787878] hover:border-[#BA5B55] hover:text-[#BA5B55] bg-[#fbf9f8]"
                  }`}
                >
                  <Plus size={20} />
                  <span>Add New</span>
                </label>
              </div>

              {/* Previews List */}
              <div className="sm:col-span-4 grid grid-cols-4 gap-3">
                {/* Existing Images */}
                {existingUrls.map((url, i) => (
                  <div key={`existing-${i}`} className="relative aspect-square border border-[#eadfdb] bg-gray-50 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Existing product photo" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingUrl(i)}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm hover:bg-red-600 transition-colors cursor-pointer"
                      title="Delete this photo"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[8px] text-center py-0.5 font-bold">
                      Saved Image
                    </span>
                  </div>
                ))}

                {/* Newly Chosen Files */}
                {selectedFiles.map((file, i) => (
                  <div key={`new-${i}`} className="relative aspect-square border border-[#eadfdb] bg-gray-50 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt="New preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(i)}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm hover:bg-red-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[8px] text-center py-0.5 font-bold">
                      New Upload
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 2: Caption (Description) */}
          <div className="flex flex-col gap-1 border-t border-gray-100 pt-5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55]">
              2. Caption / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short product description, features, options, materials, or stall availability info."
              className="min-h-20 w-full resize-none border border-[#eadfdb] bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-[#BA5B55] rounded-none"
              rows={3}
            />
          </div>

          {/* STEP 3: Product Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55]">
                3. Product Name <span className="text-[#BA5B55]">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Product title"
                className="w-full border border-[#eadfdb] bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-[#BA5B55] rounded-none"
              />
            </div>

            {/* STEP 4: Price */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55]">
                4. Price <span className="text-[#BA5B55]">*</span>
              </label>
              <div className="flex items-center border border-[#eadfdb] bg-white px-3 py-1.5 transition-colors focus-within:border-[#BA5B55] rounded-none">
                <span className="text-xs text-[#787878] font-bold">BDT</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="ml-2 w-full border-0 bg-transparent text-xs outline-none text-[#1a1a1a]"
                />
              </div>
            </div>
          </div>

          {/* STEP 5: Delivery Charge */}
          <div className="flex flex-col gap-1 border-t border-gray-100 pt-5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55]">
              5. Delivery Charge (BDT)
            </label>
            <input
              type="number"
              placeholder="0 (or blank for N/A)"
              value={deliveryCharge}
              onChange={(e) => setDeliveryCharge(e.target.value)}
              className="w-full border border-[#eadfdb] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#BA5B55] rounded-none"
            />
          </div>

          {/* STEP 6: Category selection */}
          <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55]">
                6. Category <span className="text-[#BA5B55]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full border border-[#eadfdb] bg-white px-3 py-2 text-xs outline-none transition-colors focus:border-[#BA5B55] text-[#1a1a1a] rounded-none"
              >
                <option value="" disabled>Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP 7: Discount (Optional / N/A) */}
          <div className="flex flex-col gap-1 border-t border-gray-100 pt-5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55]">
              7. Discount Percent (%) (Optional / N/A)
            </label>
            <input
              type="number"
              placeholder="e.g. 10 (blank for N/A)"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full border border-[#eadfdb] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#BA5B55] rounded-none"
            />
          </div>

          {/* STEP 8: Product Options (Specifications) */}
          <div className="flex flex-col gap-3.5 border-t border-gray-100 pt-5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55]">
                8. Product Options / Specifications (e.g. Fabric: Cotton)
              </label>
              <button
                type="button"
                onClick={addOptionField}
                className="flex items-center gap-1 text-[11px] font-bold text-[#BA5B55] uppercase tracking-wider hover:underline cursor-pointer"
              >
                <PlusCircle size={14} /> Add Option
              </button>
            </div>
            
            <div className="flex flex-col gap-3.5">
              {options.map((o, index) => (
                <div key={index} className="flex gap-2 items-start border border-[#eadfdb] p-3 bg-gray-50 rounded-none">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Specification Name (e.g. Fabric)"
                      value={o.name}
                      onChange={(e) => updateOptionField(index, "name", e.target.value)}
                      className="w-full border border-[#eadfdb] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#BA5B55] rounded-none"
                    />
                    <input
                      type="text"
                      placeholder="Specification Value (e.g. Cotton)"
                      value={o.value}
                      onChange={(e) => updateOptionField(index, "value", e.target.value)}
                      className="w-full border border-[#eadfdb] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#BA5B55] rounded-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOptionField(index)}
                    className="p-1.5 text-[#787878] hover:text-red-500 border border-[#eadfdb] hover:border-red-500 bg-white transition-colors cursor-pointer rounded-none"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              {options.length === 0 && (
                <p className="text-[10px] text-[#787878] font-light">
                  No static specifications configured yet.
                </p>
              )}
            </div>
          </div>

          {/* STEP 9: Selectable Product Variants */}
          <div className="flex flex-col gap-3.5 border-t border-gray-100 pt-5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#BA5B55]">
                9. Selectable Product Variants (e.g. Size: S, M, L)
              </label>
              <button
                type="button"
                onClick={addVariantField}
                className="flex items-center gap-1 text-[11px] font-bold text-[#BA5B55] uppercase tracking-wider hover:underline cursor-pointer"
              >
                <PlusCircle size={14} /> Add Variant Option
              </button>
            </div>
            
            <div className="flex flex-col gap-3.5">
              {variants.map((v, index) => (
                <div key={index} className="flex gap-2 items-start border border-[#eadfdb] p-3 bg-gray-50 rounded-none">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Variant Name (e.g. Size)"
                      value={v.name}
                      onChange={(e) => updateVariantField(index, "name", e.target.value)}
                      className="w-full border border-[#eadfdb] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#BA5B55] rounded-none"
                    />
                    <input
                      type="text"
                      placeholder="Variant Options (comma separated: e.g. S, M, L)"
                      value={v.rawValue}
                      onChange={(e) => updateVariantField(index, "rawValue", e.target.value)}
                      className="w-full border border-[#eadfdb] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#BA5B55] rounded-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariantField(index)}
                    className="p-1.5 text-[#787878] hover:text-red-500 border border-[#eadfdb] hover:border-red-500 bg-white transition-colors cursor-pointer rounded-none"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              {variants.length === 0 && (
                <p className="text-[10px] text-[#787878] font-light">
                  No selectable variants configured yet.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-[#eadfdb] bg-[#fcfcfd] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-[#787878] font-medium truncate flex-1">
            {uploadProgressText && (
              <span className="text-[#BA5B55] font-semibold animate-pulse">{uploadProgressText}</span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-[#eadfdb] text-xs font-semibold text-[#787878] hover:border-[#BA5B55] hover:text-[#BA5B55] rounded-none bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#BA5B55] text-white text-xs font-semibold border border-[#BA5B55] transition-colors hover:bg-white hover:text-[#BA5B55] disabled:opacity-50 disabled:cursor-not-allowed rounded-none cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
