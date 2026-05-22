"use client";

import { useEffect, useState } from "react";
import { Heart } from "@mynaui/icons-react";

interface ProductReactionButtonProps {
  productUid: string;
}

export default function ProductReactionButton({ productUid }: ProductReactionButtonProps) {
  const [count, setCount] = useState(0);
  const [reacted, setReacted] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReaction = async () => {
    try {
      const res = await fetch(`/shop/api/product-reactions?productUid=${encodeURIComponent(productUid)}`);
      const data = await res.json();
      if (res.ok) {
        setCount(data.count || 0);
        setReacted(!!data.reacted);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReaction();
  }, [productUid]);

  const toggleReaction = async () => {
    try {
      const res = await fetch("/shop/api/product-reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ productUid }),
      });
      const data = await res.json();
      if (res.ok) {
        setCount(data.count || 0);
        setReacted(!!data.reacted);
      }
    } catch (error) {
      // ignore for now
    }
  };

  return (
    <button
      type="button"
      onClick={toggleReaction}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
        reacted
          ? "border-[#BA5B55] bg-[#BA5B55]/10 text-[#BA5B55]"
          : "border-[#e8e1df] text-[#4f4f4f] hover:border-[#BA5B55] hover:text-[#BA5B55]"
      }`}
    >
      <Heart size={14} fill={reacted ? "currentColor" : "none"} />
      React ({count})
    </button>
  );
}
