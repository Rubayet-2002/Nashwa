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
    <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden bg-[#BA5B55]/5 border border-gray-200 flex items-center justify-center text-[10px] font-bold text-[#BA5B55]">
      {url ? <img src={url} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
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
    <div className="flex flex-col gap-3 font-sans">
      {/* New comment input */}
      <div className="flex gap-2 mb-2 w-full">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); post(text); } }}
          placeholder={currentUserId ? "Write a comment…" : "Sign in to comment"}
          disabled={!currentUserId}
          className={`flex-1 px-4 py-2 text-xs rounded-full border border-gray-200 outline-none transition-all ${
            currentUserId ? "bg-white text-[#1a1a1a] focus:border-[#BA5B55]" : "bg-gray-50 text-gray-400 cursor-not-allowed"
          }`}
        />
        <button
          onClick={() => post(text)}
          disabled={!currentUserId || !text.trim()}
          className="px-4 py-2 text-xs bg-[#BA5B55] hover:bg-[#a34e48] text-white rounded-full font-bold transition-all disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-3xs"
        >
          Post
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
      ) : threads.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first! 💬</p>
      ) : (
        <div className="flex flex-col gap-4">
          {threads.map(comment => {
            const isParentShopAuthor = comment.author_role === "seller" || comment.author_uid === shopOwnerUid;
            return (
              <div key={comment.comment_uid} className="flex flex-col gap-2">
                {/* Parent comment */}
                <div className="flex gap-2">
                  <Avatar name={comment.author_name} url={comment.author_photo_url} />
                  <div className="flex-1">
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-xs p-3.5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-xs font-bold text-[#1a1a1a]">{comment.author_name}</span>
                        {isParentShopAuthor && (
                          <span className="text-[9px] bg-[#BA5B55]/5 text-[#BA5B55] px-2 py-0.5 rounded-full font-bold">
                            Shop
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-light ml-auto">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-xs text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">{comment.comment_text}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-1 pl-1">
                      <button
                        onClick={() => likeComment(comment.comment_uid)}
                        className={`flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
                          likedComments.has(comment.comment_uid) ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
                        }`}
                      >
                        <Heart size={14} fill={likedComments.has(comment.comment_uid) ? "currentColor" : "none"} />
                        <span>{comment.like_count > 0 && comment.like_count}</span>
                      </button>
                      {canReply() && (
                        <button
                          onClick={() => {
                            setActiveReplyTo(a => ({ ...a, [comment.comment_uid]: null }));
                            setReplyOpen(o => ({ ...o, [comment.comment_uid]: !o[comment.comment_uid] }));
                          }}
                          className="text-[10px] font-bold text-gray-400 hover:text-[#BA5B55] transition-colors cursor-pointer"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply input for parent comment */}
                {replyOpen[comment.comment_uid] && (!activeReplyTo[comment.comment_uid] || activeReplyTo[comment.comment_uid]?.commentUid === comment.comment_uid) && (
                  <div className="flex gap-2 mt-1 ml-9">
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
                      className="flex-1 px-3.5 py-1.5 text-xs rounded-full border border-gray-200 outline-none bg-white text-[#1a1a1a] focus:border-[#BA5B55] transition-all"
                    />
                    <button
                      onClick={() => post(replyDrafts[comment.comment_uid] || "", comment.comment_uid, activeReplyTo[comment.comment_uid]?.authorName)}
                      className="px-3.5 py-1.5 text-xs bg-[#BA5B55] hover:bg-[#a34e48] text-white rounded-full font-bold transition-all cursor-pointer"
                    >
                      Send
                    </button>
                  </div>
                )}

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="ml-9 mt-1 flex flex-col gap-3 pl-3 border-l-2 border-gray-100">
                    {comment.replies.map(reply => {
                      const isReplyShopAuthor = reply.author_role === "seller" || reply.author_uid === shopOwnerUid;
                      const isChildReplying = replyOpen[comment.comment_uid] && activeReplyTo[comment.comment_uid]?.commentUid === reply.comment_uid;
                      return (
                        <div key={reply.comment_uid} className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Avatar name={reply.author_name} url={reply.author_photo_url} />
                            <div className="flex-1 bg-white border border-gray-100 rounded-2xl rounded-bl-xs p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-xs font-bold text-[#1a1a1a]">{reply.author_name}</span>
                                {isReplyShopAuthor && (
                                  <span className="text-[9px] bg-[#BA5B55]/5 text-[#BA5B55] px-1.5 py-0.5 rounded-full font-bold">
                                    Shop
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400 font-light ml-auto">{timeAgo(reply.created_at)}</span>
                              </div>
                              {reply.reply_to_name && (
                                <p className="text-xs text-[#1a1a1a] leading-relaxed">
                                  <strong className="text-[#BA5B55] font-semibold">@{reply.reply_to_name}</strong>{" "}
                                  {reply.comment_text}
                                </p>
                              )}
                              {!reply.reply_to_name && (
                                <p className="text-xs text-[#1a1a1a] leading-relaxed">{reply.comment_text}</p>
                              )}
                              
                              {/* Actions for reply */}
                              <div className="flex items-center gap-3 mt-1.5 pl-0.5">
                                <button
                                  onClick={() => likeComment(reply.comment_uid)}
                                  className={`flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
                                    likedComments.has(reply.comment_uid) ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
                                  }`}
                                >
                                  <Heart size={14} fill={likedComments.has(reply.comment_uid) ? "currentColor" : "none"} />
                                  <span>{reply.like_count > 0 && reply.like_count}</span>
                                </button>
                                {canReply() && (
                                  <button
                                    onClick={() => {
                                      setActiveReplyTo(a => ({ ...a, [comment.comment_uid]: { commentUid: reply.comment_uid, authorName: reply.author_name } }));
                                      setReplyOpen(o => ({ ...o, [comment.comment_uid]: true }));
                                    }}
                                    className="text-[10px] font-bold text-gray-400 hover:text-[#BA5B55] transition-colors cursor-pointer"
                                  >
                                    Reply
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reply input for child comment */}
                          {isChildReplying && (
                            <div className="flex gap-2 mt-1 ml-9">
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
                                className="flex-1 px-3.5 py-1.5 text-xs rounded-full border border-gray-200 outline-none bg-white text-[#1a1a1a] focus:border-[#BA5B55] transition-all"
                              />
                              <button
                                onClick={() => post(replyDrafts[comment.comment_uid] || "", comment.comment_uid, activeReplyTo[comment.comment_uid]?.authorName)}
                                className="px-3.5 py-1.5 text-xs bg-[#BA5B55] hover:bg-[#a34e48] text-white rounded-full font-bold transition-all cursor-pointer"
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
