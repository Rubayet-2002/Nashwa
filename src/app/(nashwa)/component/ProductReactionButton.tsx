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
  const [isOwner, setIsOwner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reactors, setReactors] = useState<Array<{ uid: string; username: string; created_at: string }>>([]);

  const loadReaction = async () => {
    try {
      const res = await fetch(`/shop/api/product-reactions?productUid=${encodeURIComponent(productUid)}`);
      const data = await res.json();
      if (res.ok) {
        setCount(data.count || 0);
        setReacted(!!data.reacted);
        setIsOwner(!!data.isOwner);
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
      if (isOwner) {
        // owners should not toggle; show reactors list instead
        setShowModal(true);
        try {
          const r = await fetch(`/shop/api/product-reactors?productUid=${encodeURIComponent(productUid)}`);
          const d = await r.json();
          if (r.ok) setReactors(d.reactors || []);
        } catch (err) {}
        return;
      }

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
        setIsOwner(!!data.isOwner);
      }
    } catch (error) {
      // ignore for now
    }
  };

  return (
    <>
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
      {isOwner ? (
        <span className="text-xs text-[#787878]">(Owner)</span>
      ) : null}
      <Heart size={14} fill={reacted ? "currentColor" : "none"} />
      React ({count})
      </button>

      {showModal && (
        <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black/40">
          <div className="max-h-[70vh] w-[90%] max-w-md overflow-auto rounded bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Reacted users</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-xs text-[#666]">Close</button>
            </div>
            <div className="mt-3 space-y-2">
              {reactors.length === 0 ? (
                <p className="text-xs text-[#777]">No reactions yet.</p>
              ) : (
                reactors.map((u) => (
                  <div key={u.uid} className="flex items-center justify-between border-b py-2">
                    <div>
                      <p className="font-medium text-sm">{u.username || "(unknown)"}</p>
                      <p className="text-xs text-[#777]">{new Date(u.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
