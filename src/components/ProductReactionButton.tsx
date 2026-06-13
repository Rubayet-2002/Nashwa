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
      const res = await fetch(`/api/products/${encodeURIComponent(productUid)}/reactions`);
      const data = await res.json();
      if (res.ok) {
        setCount(data.count || 0);
        setReacted(!!data.reacted);
        setIsOwner(!!data.isOwner);
      }
    } catch (err) {
      console.error("Error loading reactions:", err);
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
        

        setShowModal(true);
        try {
          const r = await fetch(`/api/products/${encodeURIComponent(productUid)}/reactors`);
          const d = await r.json();
          if (r.ok) setReactors(d.reactors || []);
        } catch (err) {}
        return;
      }

      const res = await fetch(`/api/products/${encodeURIComponent(productUid)}/reactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const data = await res.json();
      if (res.ok) {
        setCount(data.count || 0);
        setReacted(!!data.reacted);
        setIsOwner(!!data.isOwner);
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
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
          <div className="max-h-[70vh] w-[90%] max-w-md overflow-auto rounded-3xl bg-white p-6 border border-[#eadfdb] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f4ecea] pb-3">
              <h3 className="text-sm font-semibold text-[#1a1a1a]">Reacted Users</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs text-[#787878] hover:text-[#BA5B55] font-semibold"
              >
                Close
              </button>
            </div>
            <div className="mt-3 space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {reactors.length === 0 ? (
                <p className="text-xs text-[#787878] font-light">No reactions yet.</p>
              ) : (
                reactors.map((u) => (
                  <div key={u.uid} className="flex items-center justify-between border-b border-[#fcf8f6] py-2">
                    <div>
                      <p className="font-semibold text-xs text-[#1a1a1a]">{u.username || "(unknown)"}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(u.created_at).toLocaleString()}</p>
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
