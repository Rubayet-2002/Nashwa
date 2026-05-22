"use client";

import { useEffect, useMemo, useState } from "react";

export type CommentRow = {
  comment_uid: string;
  product_uid: string;
  author_uid: string | null;
  author_role: string;
  author_name: string;
  comment_text: string;
  parent_comment_uid: string | null;
  created_at: string;
};

type CommentNode = CommentRow & { replies: CommentRow[] };

interface ProductCommentThreadProps {
  productUid: string;
  mode?: "customer" | "owner";
}

export default function ProductCommentThread({ productUid, mode = "customer" }: ProductCommentThreadProps) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/shop/api/product-comments?productUid=${encodeURIComponent(productUid)}`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      } else {
        setError(data.message || "Failed to load comments");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [productUid]);

  const threadedComments = useMemo<CommentNode[]>(() => {
    const topLevel = comments.filter((comment) => !comment.parent_comment_uid);
    return topLevel.map((comment) => ({
      ...comment,
      replies: comments.filter((reply) => reply.parent_comment_uid === comment.comment_uid),
    }));
  }, [comments]);

  const submitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    try {
      const res = await fetch("/shop/api/product-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ action: "comment", productUid, commentText: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentText("");
        await loadComments();
      } else {
        setError(data.message || "Failed to save comment");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const submitReply = async (parentCommentUid: string) => {
    const trimmed = (replyDrafts[parentCommentUid] || "").trim();
    if (!trimmed) return;

    try {
      const res = await fetch("/shop/api/product-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          action: "reply",
          productUid,
          parentCommentUid,
          commentText: trimmed,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplyDrafts((current) => ({ ...current, [parentCommentUid]: "" }));
        setReplyOpen((current) => ({ ...current, [parentCommentUid]: true }));
        await loadComments();
      } else {
        setError(data.message || "Failed to save reply");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div className="rounded-2xl border border-[#eee] bg-[#fcfcfd] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#787878]">Comments</p>
        <button type="button" onClick={loadComments} className="text-[11px] font-medium text-[#BA5B55] hover:underline">
          Refresh
        </button>
      </div>

      {mode === "customer" && (
        <div className="mt-3 flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitComment();
              }
            }}
            placeholder="Write a comment..."
            className="min-w-0 flex-1 rounded-full border border-[#e8e1df] bg-white px-4 py-2 text-sm outline-none focus:border-[#BA5B55]"
          />
          <button
            type="button"
            onClick={submitComment}
            className="rounded-full bg-[#BA5B55] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#a94d48]"
          >
            Post
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      {loading ? (
        <p className="mt-4 text-xs text-[#8b8b8b]">Loading comments...</p>
      ) : threadedComments.length === 0 ? (
        <p className="mt-4 text-xs text-[#8b8b8b]">No comments yet. Be the first one.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {threadedComments.map((comment) => (
            <div key={comment.comment_uid} className="rounded-xl border border-[#eee] bg-white px-3 py-2 text-sm text-[#4f4f4f]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[#1a1a1a]">{comment.author_name}</p>
                  <p className="mt-1 text-sm">{comment.comment_text}</p>
                </div>
              </div>

              {mode === "owner" && comment.author_role !== "seller" && (
                <div className="mt-3 space-y-2 border-t border-[#f3f3f3] pt-3">
                  <button
                    type="button"
                    onClick={() => setReplyOpen((current) => ({ ...current, [comment.comment_uid]: !current[comment.comment_uid] }))}
                    className="text-xs font-medium text-[#BA5B55] hover:underline"
                  >
                    {replyOpen[comment.comment_uid] ? "Hide reply" : "Reply"}
                  </button>

                  {replyOpen[comment.comment_uid] && (
                    <div className="flex gap-2">
                      <input
                        value={replyDrafts[comment.comment_uid] || ""}
                        onChange={(e) => setReplyDrafts((current) => ({ ...current, [comment.comment_uid]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            submitReply(comment.comment_uid);
                          }
                        }}
                        placeholder="Write a reply..."
                        className="min-w-0 flex-1 rounded-full border border-[#e8e1df] bg-white px-4 py-2 text-sm outline-none focus:border-[#BA5B55]"
                      />
                      <button
                        type="button"
                        onClick={() => submitReply(comment.comment_uid)}
                        className="rounded-full bg-[#BA5B55] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#a94d48]"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              )}

              {comment.replies.length > 0 && (
                <div className="mt-3 space-y-2 border-l border-[#eee] pl-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.comment_uid} className="rounded-lg bg-[#fafafa] px-3 py-2 text-xs text-[#4f4f4f]">
                      <p className="font-medium text-[#1a1a1a]">{reply.author_name}</p>
                      <p className="mt-1">{reply.comment_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
