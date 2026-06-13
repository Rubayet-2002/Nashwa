"use client";

import { useState, useEffect } from "react";
import { Filter } from "@mynaui/icons-react";

export interface FilterState {
  tab: "explore" | "preorder" | "following";
  minPrice: number;
  maxPrice: number;
  category: string[];
  communityId: string[];
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

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  communities: { university_uid: string; university_name: string; logo_url?: string | null }[];
}

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
    <div className="relative flex flex-col gap-1 w-full font-sans z-30 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787878]">{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-xs border border-[#eadfdb] bg-white px-3 py-2 outline-none flex justify-between items-center rounded-none font-semibold text-[#1a1a1a] min-w-0"
      >
        <span className="truncate flex-1 mr-2 min-w-0">{displayValue}</span>
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

export default function FilterBar({ onFilterChange, communities }: FilterBarProps) {
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [filters, setFilters] = useState<FilterState>({
    tab: "explore",
    minPrice: 0,
    maxPrice: 1000000,
    category: [],
    communityId: [],
  });
  const [showFilters, setShowFilters] = useState(false);

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

  const update = (partial: Partial<FilterState>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    onFilterChange(next);
  };

  const hasActive =
    filters.category.length > 0 ||
    filters.communityId.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < 1000000;

  const tabs: Array<{ id: FilterState["tab"]; label: string }> = [
    { id: "explore", label: "Explore" },
    { id: "preorder", label: "Pre orders" },
    { id: "following", label: "Following" },
  ];

  const categoryOptions = categories.map((cat) => ({ value: cat, label: cat }));
  const universityOptions = communities.map((c) => ({
    value: c.university_uid,
    label: c.university_name,
  }));

  return (
    <div className="flex flex-col overflow-visible bg-white rounded-none min-w-0">
      {/* Tab Row */}
      <div className="p-3.5 flex justify-between items-center text-xs leading-none">
        <div className="flex gap-6 leading-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => update({ tab: t.id })}
              className={`cursor-pointer transition-colors duration-300 font-semibold ${
                filters.tab === t.id ? "text-[#ba5b55]" : "text-[#787878] hover:text-[#ba5b55]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {hasActive && (
            <button
              onClick={() => update({ minPrice: 0, maxPrice: 1000000, category: [], communityId: [] })}
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
        <div className="p-5 bg-[#fafafa] flex flex-col gap-6 border-t border-[#f0f0f0] animate-in fade-in duration-150 overflow-visible min-w-0 w-full">
          {/* Custom Searchable Dropdowns (stacked vertically / column-wise) */}
          <div className="flex flex-col gap-4 w-full min-w-0">
            <SearchableDropdown
              label="Category"
              placeholder="Select category"
              value={filters.category}
              options={categoryOptions}
              onChange={(val) => update({ category: val })}
            />

            {communities.length > 0 && (
              <SearchableDropdown
                label="University"
                placeholder="Select university"
                value={filters.communityId}
                options={universityOptions}
                onChange={(val) => update({ communityId: val })}
              />
            )}
          </div>

          {/* Single Price Range Slider (Dual Thumbs) */}
          <div className="flex flex-col gap-1 w-full max-w-xl font-sans">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Price Range</span>
              <span className="text-xs font-semibold text-[#BA5B55] bg-[#BA5B55]/5 px-2 py-0.5 border border-[#BA5B55]/10">
                ৳{filters.minPrice} — ৳{filters.maxPrice}
              </span>
            </div>

            <div className="relative w-full h-5 mt-2 flex items-center">
              {/* Background Track */}
              <div className="absolute w-full h-[2px] bg-gray-200 rounded-none" />
              
              {/* Active Track Highlight */}
              <div
                className="absolute h-[2px] bg-[#BA5B55] rounded-none"
                style={{
                  left: `${(filters.minPrice / 1000000) * 100}%`,
                  right: `${100 - (filters.maxPrice / 1000000) * 100}%`,
                }}
              />

              {/* Min Range Slider */}
              <input
                type="range"
                min={0}
                max={1000000}
                step={1000}
                value={filters.minPrice}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), filters.maxPrice - 1000);
                  update({ minPrice: val });
                }}
                className="absolute pointer-events-none appearance-none w-full h-[2px] bg-transparent outline-none top-1/2 -translate-y-1/2 left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:bg-[#BA5B55] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:bg-[#BA5B55] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
                style={{ zIndex: filters.minPrice > 800000 ? 5 : 3 }}
              />

              {/* Max Range Slider */}
              <input
                type="range"
                min={0}
                max={1000000}
                step={1000}
                value={filters.maxPrice}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), filters.minPrice + 1000);
                  update({ maxPrice: val });
                }}
                className="absolute pointer-events-none appearance-none w-full h-[2px] bg-transparent outline-none top-1/2 -translate-y-1/2 left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:bg-[#BA5B55] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:bg-[#BA5B55] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
                style={{ zIndex: 4 }}
              />
            </div>
          </div>

          {/* Selected Pills */}
          {(filters.category.length > 0 || filters.communityId.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[#eadfdb]/70">
              {filters.category.map((cat) => (
                <span
                  key={`cat-${cat}`}
                  className="inline-flex items-center gap-1 bg-[#BA5B55]/5 border border-[#BA5B55]/20 text-[#BA5B55] text-[10px] font-semibold px-2.5 py-1 rounded-none"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => update({ category: filters.category.filter(c => c !== cat) })}
                    className="hover:text-red-500 font-extrabold cursor-pointer ml-1 text-[11px]"
                  >
                    ✕
                  </button>
                </span>
              ))}
              {filters.communityId.map((id) => {
                const name = communities.find(c => c.university_uid === id)?.university_name || id;
                return (
                  <span
                    key={`uni-${id}`}
                    className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-semibold px-2.5 py-1 rounded-none"
                  >
                    <span>{name}</span>
                    <button
                      type="button"
                      onClick={() => update({ communityId: filters.communityId.filter(x => x !== id) })}
                      className="hover:text-red-500 font-extrabold cursor-pointer ml-1 text-[11px]"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
