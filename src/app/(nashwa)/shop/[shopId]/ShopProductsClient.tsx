"use client";

import { useState, useCallback } from "react";
import ProductCard from "@/app/(nashwa)/home/ProductCard";
import type { FeedProduct } from "@/app/(nashwa)/home/HomeFeedClient";
import { Filter } from "@mynaui/icons-react";

interface ShopProductsClientProps {
  products: FeedProduct[];
  currentUserId: string | null;
  currentUserRole: string | null;
  initialFollowedShops: string[];
  initialSavedProducts: string[];
  initialReactedProducts: string[];
}

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

function SearchableDropdown({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string[];
  options: { value: string; label: string }[];
  onChange: (val: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const displayValue = value.length === 0
    ? placeholder
    : value.map(v => options.find(o => o.value === v)?.label).filter(Boolean).join(", ");

  return (
    <div className="relative flex flex-col gap-1 w-full font-sans z-30">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787878]">{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-xs border border-[#eadfdb] bg-white px-3 py-2 outline-none flex justify-between items-center rounded-none font-semibold text-[#1a1a1a]"
      >
        <span className="truncate">{displayValue}</span>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className={`transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#eadfdb] z-50 flex flex-col max-h-60 shadow-none rounded-none animate-in fade-in slide-in-from-top-1 duration-100">
            <div className="p-2 border-b border-[#f4ecea]">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs border border-[#eadfdb] px-2.5 py-1.5 outline-none focus:border-[#BA5B55] bg-[#fafafa] rounded-none text-[#1a1a1a]"
              />
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => {
                  onChange([]);
                  setSearch("");
                }}
                className="w-full text-left text-xs px-3 py-2 hover:bg-[#BA5B55]/5 hover:text-[#BA5B55] transition-colors font-semibold"
              >
                Clear All
              </button>
              {filtered.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? value.filter((v) => v !== opt.value)
                        : [...value, opt.value];
                      onChange(next);
                    }}
                    className={`w-full text-left text-xs px-3 py-2 transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-[#BA5B55]/10 text-[#BA5B55] font-bold"
                        : "hover:bg-[#BA5B55]/5 hover:text-[#BA5B55] text-gray-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="accent-[#BA5B55] h-3.5 w-3.5 shrink-0"
                      />
                      <span className="truncate pr-2">{opt.label}</span>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-[10px] text-center text-gray-400 py-3">No results found</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopProductsClient({
  products,
  currentUserId,
  currentUserRole,
  initialFollowedShops,
  initialSavedProducts,
  initialReactedProducts,
}: ShopProductsClientProps) {
  const [followedShops, setFollowedShops] = useState<Set<string>>(new Set(initialFollowedShops));
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set(initialSavedProducts));
  const [reactedProducts, setReactedProducts] = useState<Set<string>>(new Set(initialReactedProducts));

  // In-memory Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);

  const handleFollowChange = useCallback((shopUid: string, following: boolean) => {
    setFollowedShops((prev) => {
      const next = new Set(prev);
      if (following) next.add(shopUid);
      else next.delete(shopUid);
      return next;
    });
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

  // Filter in-memory products
  const filteredProducts = products.filter((p) => {
    const priceNum = Number(p.price);
    const categoryMatch = selectedCategory.length === 0 || selectedCategory.includes(p.category || "");
    const priceMatch = priceNum >= minPrice && priceNum <= maxPrice;
    return categoryMatch && priceMatch;
  });

  const hasActive = selectedCategory.length > 0 || minPrice > 0 || maxPrice < 10000;

  const categoryOptions = CATEGORIES.map((cat) => ({ value: cat, label: cat }));

  return (
    <div className="flex flex-col gap-6 overflow-visible w-full">
      {/* Header Row */}
      <div className="flex flex-col bg-white rounded-none overflow-visible">
        <div className="flex justify-between items-center p-3.5 text-xs leading-none">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#1a1a1a]">All Posts</h2>
            <span className="text-[10px] font-bold text-[#BA5B55] bg-[#BA5B55]/5 px-2 py-0.5 border border-[#BA5B55]/10 leading-none">
              {filteredProducts.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {hasActive && (
              <button
                onClick={() => {
                  setSelectedCategory([]);
                  setMinPrice(0);
                  setMaxPrice(10000);
                }}
                className="text-[#ba5b55] bg-transparent font-semibold cursor-pointer hover:underline"
              >
                ✕ Clear
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex justify-center items-center gap-1 leading-none text-xs transition cursor-pointer font-semibold ${
                showFilters ? "text-[#ba5b55]" : "hover:text-[#ba5b55] text-[#1a1a1a]"
              }`}
            >
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="p-5 bg-[#fafafa] flex flex-col gap-6 border-t border-[#f0f0f0] animate-in fade-in duration-150 overflow-visible">
            {/* Category Custom Dropdown (stacked vertically) */}
            <div className="w-full flex flex-col gap-4">
              <SearchableDropdown
                label="Category"
                placeholder="Select category"
                value={selectedCategory}
                options={categoryOptions}
                onChange={(val) => setSelectedCategory(val)}
              />
            </div>

            {/* Price Range Slider (Dual Thumbs) */}
            <div className="flex flex-col gap-1 w-full max-w-xl font-sans">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Price Range</span>
                <span className="text-xs font-semibold text-[#BA5B55] bg-[#BA5B55]/5 px-2 py-0.5 border border-[#BA5B55]/10">
                  ৳{minPrice} — ৳{maxPrice}
                </span>
              </div>

              <div className="relative w-full h-5 mt-2 flex items-center">
                {/* Background Track */}
                <div className="absolute w-full h-[2px] bg-gray-200 rounded-none" />
                
                {/* Active Track Highlight */}
                <div
                  className="absolute h-[2px] bg-[#BA5B55] rounded-none"
                  style={{
                    left: `${(minPrice / 10000) * 100}%`,
                    right: `${100 - (maxPrice / 10000) * 100}%`,
                  }}
                />

                {/* Min Range Slider */}
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={100}
                  value={minPrice}
                  onChange={(e) => {
                    const val = Math.min(Number(e.target.value), maxPrice - 100);
                    setMinPrice(val);
                  }}
                  className="absolute pointer-events-none appearance-none w-full h-[2px] bg-transparent outline-none top-1/2 -translate-y-1/2 left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:bg-[#BA5B55] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:bg-[#BA5B55] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
                  style={{ zIndex: minPrice > 8000 ? 5 : 3 }}
                />

                {/* Max Range Slider */}
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={100}
                  value={maxPrice}
                  onChange={(e) => {
                    const val = Math.max(Number(e.target.value), minPrice + 100);
                    setMaxPrice(val);
                  }}
                  className="absolute pointer-events-none appearance-none w-full h-[2px] bg-transparent outline-none top-1/2 -translate-y-1/2 left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:bg-[#BA5B55] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:bg-[#BA5B55] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
                  style={{ zIndex: 4 }}
                />
              </div>
            </div>

            {/* Selected Pills */}
            {selectedCategory.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#eadfdb]/70">
                {selectedCategory.map((cat) => (
                  <span
                    key={`cat-${cat}`}
                    className="inline-flex items-center gap-1 bg-[#BA5B55]/5 border border-[#BA5B55]/20 text-[#BA5B55] text-[10px] font-semibold px-2.5 py-1 rounded-none"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(selectedCategory.filter(c => c !== cat))}
                      className="hover:text-red-500 font-extrabold cursor-pointer ml-1 text-[11px]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="flex flex-col gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.product_uid}
              product={product}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              isFollowing={followedShops.has(product.shop_uid)}
              isSaved={savedProducts.has(product.product_uid)}
              hasReacted={reactedProducts.has(product.product_uid)}
              onFollowChange={handleFollowChange}
              onSaveChange={handleSaveChange}
              onReactChange={handleReactChange}
              hideFollowButton={true}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#eaeaea] p-12 text-center rounded-none shadow-xs">
          <p className="text-sm text-[#787878] font-light">No products match the active filters.</p>
        </div>
      )}
    </div>
  );
}
