"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "@mynaui/icons-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!val.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(val)}&preview=1`);
        const d = await r.json();
        setResults(d.results || []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 380);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const typeLabel: Record<string, { label: string; color: string; bg: string; border: string }> = {
    product:    { label: "Product",    color: "text-[#ba5b55]", bg: "bg-[#ba5b55]/10",    border: "border-[#ba5b55]/20" },
    shop:       { label: "Shop",       color: "text-purple-600", bg: "bg-purple-50",       border: "border-purple-100" },
    university: { label: "University", color: "text-cyan-600", bg: "bg-cyan-50",       border: "border-cyan-100" },
    event:      { label: "Event",      color: "text-amber-600", bg: "bg-amber-50",      border: "border-amber-100" },
    category:   { label: "Category",  color: "text-green-600", bg: "bg-green-50",      border: "border-green-100" },
  };

  return (
    <div ref={ref} className="relative">
      <form
        onSubmit={handleSubmit}
     className="min-w-90 px-2 flex justify-center items-center rounded-full shadow-sm shadow-[#e6e6e6] border border-white bg-[#f4f4f4] focus-within:border-[#BA5B55] focus-within:bg-white focus-within:shadow-none transition-colors duration-300" >
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="What are you looking for?"
          required
        className="w-full px-2 py-1.5 outline-none placeholder:text-xs placeholder:text-[#787878] bg-transparent"
     />

        {loading && (
          <div className="mr-1.5 w-3.5 h-3.5 border-2 border-gray-300 border-t-[#BA5B55] rounded-full animate-spin shrink-0" />
        )}

        <button
          type="submit"
          className="p-1 rounded-full cursor-pointer text-[#BA5B55] hover:bg-[#BA5B55] hover:text-white transition-colors duration-300 flex items-center justify-center shrink-0"
        >
          <Search stroke={2} size={16} />
        </button>
      </form>

      {open && results.length > 0 && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#e2e2e2] rounded-lg shadow-md z-[300] overflow-hidden">
          {results.map((r, i) => {
            const t = typeLabel[r.type] || { label: r.type, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100" };
            return (
              <button
                key={i}
                onClick={() => {
                  setOpen(false);
                  setQuery(r.title || r.name || "");
                  if (r.type === "product") router.push(`/product/${r.id}`);
                  else if (r.type === "shop") router.push(`/shop/${r.id}`);
                  else if (r.type === "university") router.push(`/university?id=${r.id}`);
                  else if (r.type === "event") router.push(`/feasts-events`);
                  else router.push(`/search?q=${encodeURIComponent(r.title || r.name || "")}`);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-left bg-white border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#f4f4f4] transition-colors cursor-pointer"
              >
                {r.image_url && (
                  <div className="w-8 h-8 rounded overflow-hidden shrink-0 bg-[#f4f4f4] relative">
                    <img src={r.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1a1a1a] truncate">
                    {r.title || r.name}
                  </p>
                  {r.subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{r.subtitle}</p>}
                </div>
                <span className={`text-[9px] font-bold ${t.color} ${t.bg} px-1.5 py-0.5 rounded-full shrink-0 border ${t.border}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={handleSubmit as any}
            className="flex items-center gap-2 w-full px-3 py-2.5 bg-[#fdf0ef] border-t border-[#e2e2e2] text-xs font-semibold text-[#BA5B55] hover:bg-[#BA5B55] hover:text-white transition-all cursor-pointer"
          >
            <Search size={14} />
            <span>View all results for "{query}"</span>
          </button>
        </div>
      )}
    </div>
  );
}
