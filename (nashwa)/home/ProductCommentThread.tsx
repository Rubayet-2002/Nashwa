"use client";

import { useEffect, useMemo, useState } from "react";
import { useToastStore } from "@/zustand/toastStore";
import { connectSocket } from "@/lib/socket-client";
import { Heart } from "@mynaui/icons-react";

export type CommentRow = {
  comment_uid: string;
  product_uid: string;
  author_uid: string | null;
  author_role: string;
  author_name: string;
  author_photo_url: string | null;
  comment_text: string;
  parent_comment_uid: string | null;
  reply_to_name: string | null;
  like_count: number;
  created_at: string;
};

type CommentNode = CommentRow & { replies: CommentRow[] };

interface Props {
  productUid: string;
  shopUid: string;
  currentUserId: string | null;
  currentUserRole: string | null;
  shopOwnerUid?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "var(--brand-light)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "var(--brand)" }}>
      {url ? <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ProductCommentThread({ productUid, shopUid, currentUserId, currentUserRole, shopOwnerUid }: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [activeReplyTo, setActiveReplyTo] = useState<Record<string, { commentUid: string, authorName: string } | null>>({});
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    fetch(`/api/products/${productUid}/comments`)
      .then(r => r.json())
      .then(d => { setComments(d.comments || []); setLikedComments(new Set(d.liked_comment_uids || [])); })
      .catch(() => {})
      .finally(() => setLoading(false));

    const socket = connectSocket();
    socket.on("comment:new", (c: CommentRow) => {
      if (c.product_uid === productUid) setComments(prev => [...prev, c]);
    });
    return () => { socket.off("comment:new"); };
  }, [productUid]);

  const threads = useMemo<CommentNode[]>(() => {
    const top = comments.filter(c => !c.parent_comment_uid);
    return top.map(c => ({ ...c, replies: comments.filter(r => r.parent_comment_uid === c.comment_uid) }));
  }, [comments]);

  const post = async (commentText: string, parentUid?: string, replyToName?: string) => {
    if (!commentText.trim()) return;
    if (!currentUserId) { addToast("Please sign in to comment", "error"); return; }
    try {
      const res = await fetch(`/api/products/${productUid}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify({
          commentText: commentText.trim(),
          parentCommentUid: parentUid || null,
          replyToName: replyToName || null
        }),
      });
      if (res.ok) {
        setText("");
        if (parentUid) {
          setReplyDrafts(d => ({ ...d, [parentUid]: "" }));
          setReplyOpen(o => ({ ...o, [parentUid]: false }));
          setActiveReplyTo(a => ({ ...a, [parentUid]: null }));
        }
      } else {
        const d = await res.json();
        addToast(d.message || "Failed to post comment", "error");
      }
    } catch { addToast("Network error", "error"); }
  };

  const likeComment = async (commentUid: string) => {
    if (!currentUserId) { addToast("Please sign in", "error"); return; }
    const isLiked = likedComments.has(commentUid);
    setLikedComments(prev => { const n = new Set(prev); isLiked ? n.delete(commentUid) : n.add(commentUid); return n; });
    setComments(prev => prev.map(c => c.comment_uid === commentUid ? { ...c, like_count: c.like_count + (isLiked ? -1 : 1) } : c));
    try {
      await fetch(`/api/products/${productUid}/comments/${commentUid}/like`, {
        method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" },
      });
    } catch {}
  };

  const canReply = () => {
    return !!currentUserId;
  };

  const isOwner = (currentUserId && shopOwnerUid && currentUserId === shopOwnerUid) || currentUserRole === "seller";

  return (
    <div>
      {/* New comment input */}
      {!isOwner && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); post(text); } }}
            placeholder={currentUserId ? "Write a comment…" : "Sign in to comment"}
            disabled={!currentUserId}
            style={{ flex: 1, padding: "7px 14px", fontSize: 12, borderRadius: 99, border: "1px solid var(--border)", outline: "none", background: currentUserId ? "#fff" : "var(--bg)", color: "var(--text-primary)" }}
          />
          <button onClick={() => post(text)} disabled={!currentUserId || !text.trim()} style={{ padding: "7px 14px", fontSize: 12, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 99, cursor: "pointer", opacity: (!currentUserId || !text.trim()) ? 0.45 : 1 }}>
            Post
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>Loading…</p>
      ) : threads.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>No comments yet. Be the first! 💬</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {threads.map(comment => {
            const isParentShopAuthor = comment.author_role === "seller" || comment.author_uid === shopOwnerUid;
            return (
              <div key={comment.comment_uid}>
                {/* Parent comment */}
                <div style={{ display: "flex", gap: 8 }}>
                  <Avatar name={comment.author_name} url={comment.author_photo_url} />
                  <div style={{ flex: 1 }}>
                    <div style={{ background: "var(--bg)", borderRadius: "16px 16px 16px 4px", padding: "8px 12px", border: "1px solid var(--border-soft)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{comment.author_name}</span>
                        {isParentShopAuthor && <span style={{ fontSize: 9, background: "var(--brand-light)", color: "var(--brand)", padding: "1px 6px", borderRadius: 99, fontWeight: 700 }}>Shop</span>}
                        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>{timeAgo(comment.created_at)}</span>
                      </div>
                      <p style={{ fontSize: 12, lineHeight: 1.5 }}>{comment.comment_text}</p>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, paddingLeft: 4 }}>
                      <button onClick={() => likeComment(comment.comment_uid)} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: likedComments.has(comment.comment_uid) ? "#ef4444" : "var(--text-muted)" }}>
                        <Heart size={14} fill={likedComments.has(comment.comment_uid) ? "#ef4444" : "none"} /> {comment.like_count > 0 && comment.like_count}
                      </button>
                      {canReply() && (
                        <button
                          onClick={() => {
                            setActiveReplyTo(a => ({ ...a, [comment.comment_uid]: null }));
                            setReplyOpen(o => ({ ...o, [comment.comment_uid]: !o[comment.comment_uid] }));
                          }}
                          style={{ fontSize: 10, fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply input for parent comment */}
                {replyOpen[comment.comment_uid] && (!activeReplyTo[comment.comment_uid] || activeReplyTo[comment.comment_uid]?.commentUid === comment.comment_uid) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8, marginLeft: 36 }}>
                    <input
                      value={replyDrafts[comment.comment_uid] || ""}
                      onChange={e => setReplyDrafts(d => ({ ...d, [comment.comment_uid]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          post(replyDrafts[comment.comment_uid] || "", comment.comment_uid, activeReplyTo[comment.comment_uid]?.authorName);
                        }
                      }}
                      placeholder={`Reply to ${comment.author_name}…`}
                      style={{ flex: 1, padding: "6px 12px", fontSize: 11, borderRadius: 99, border: "1px solid var(--border)", outline: "none" }}
                    />
                    <button
                      onClick={() => post(replyDrafts[comment.comment_uid] || "", comment.comment_uid, activeReplyTo[comment.comment_uid]?.authorName)}
                      style={{ padding: "6px 12px", fontSize: 11, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 99, cursor: "pointer" }}
                    >
                      Send
                    </button>
                  </div>
                )}



                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div style={{ marginLeft: 36, marginTop: 8, display: "flex", flexDirection: "column", gap: 8, paddingLeft: 12, borderLeft: "2px solid var(--border-soft)" }}>
                    {comment.replies.map(reply => {
                      const isReplyShopAuthor = reply.author_role === "seller" || reply.author_uid === shopOwnerUid;
                      return (
                        <div key={reply.comment_uid} style={{ display: "flex", gap: 8 }}>
                          <Avatar name={reply.author_name} url={reply.author_photo_url} />
                          <div style={{ flex: 1, background: "#fff", border: "1px solid var(--border-soft)", borderRadius: "12px 12px 12px 4px", padding: "7px 11px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 11, fontWeight: 700 }}>{reply.author_name}</span>
                              {isReplyShopAuthor && <span style={{ fontSize: 9, background: "var(--brand-light)", color: "var(--brand)", padding: "1px 5px", borderRadius: 99, fontWeight: 700 }}>Shop</span>}
                              <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: "auto" }}>{timeAgo(reply.created_at)}</span>
                            </div>
                            {reply.reply_to_name && (
                              <p style={{ fontSize: 11 }}>
                                <strong style={{ color: "var(--brand)" }}>@{reply.reply_to_name}</strong>{" "}
                                {reply.comment_text}
                              </p>
                            )}
                            {!reply.reply_to_name && <p style={{ fontSize: 11, lineHeight: 1.5 }}>{reply.comment_text}</p>}
                            
                            {/* Actions for reply */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                              <button onClick={() => likeComment(reply.comment_uid)} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: likedComments.has(reply.comment_uid) ? "#ef4444" : "var(--text-muted)" }}>
                                <Heart size={14} fill={likedComments.has(reply.comment_uid) ? "#ef4444" : "none"} /> {reply.like_count > 0 && reply.like_count}
                              </button>
                              {canReply() && (
                                <button
                                  onClick={() => {
                                    setActiveReplyTo(a => ({ ...a, [comment.comment_uid]: { commentUid: reply.comment_uid, authorName: reply.author_name } }));
                                    setReplyOpen(o => ({ ...o, [comment.comment_uid]: true }));
                                  }}
                                  style={{ fontSize: 10, fontWeight: 600, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                                >
                                  Reply
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Reply input for child comment */}
                          {replyOpen[comment.comment_uid] && activeReplyTo[comment.comment_uid]?.commentUid === reply.comment_uid && (
                            <div style={{ display: "flex", gap: 8, marginTop: 8, marginLeft: 36 }}>
                              <input
                                value={replyDrafts[comment.comment_uid] || ""}
                                onChange={e => setReplyDrafts(d => ({ ...d, [comment.comment_uid]: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    post(replyDrafts[comment.comment_uid] || "", comment.comment_uid, activeReplyTo[comment.comment_uid]?.authorName);
                                  }
                                }}
                                placeholder={`Reply to @${activeReplyTo[comment.comment_uid]?.authorName}…`}
                                style={{ flex: 1, padding: "6px 12px", fontSize: 11, borderRadius: 99, border: "1px solid var(--border)", outline: "none" }}
                              />
                              <button
                                onClick={() => post(replyDrafts[comment.comment_uid] || "", comment.comment_uid, activeReplyTo[comment.comment_uid]?.authorName)}
                                style={{ padding: "6px 12px", fontSize: 11, background: "var(--brand)", color: "#fff", border: "none", borderRadius: 99, cursor: "pointer" }}
                              >
                                Send
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
