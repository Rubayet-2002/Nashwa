"use client";

import { useState, useTransition, useRef, ChangeEvent } from "react";
import ImageUpload from "@/components/ImageUpload";
import Lightbox from "@/components/Lightbox";
import { useToastStore } from "@/zustand/toastStore";
import { Check, X, Eye, Download, Store, Plus, Trash } from "@mynaui/icons-react";
import ImageCropModal from "@/components/ImageCropModal";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";

interface University {
  university_uid: string;
  university_name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
}

interface JoinRequest {
  id: number;
  shop_uid: string;
  university_uid: string;
  student_id: string;
  sid_pdf_url: string;
  status: string;
  created_at: string;
  shop_name: string;
  shop_email: string;
  shop_phone: string;
  owner_uid: string;
  university_name: string;
}

interface AdminUniversitiesClientProps {
  initialUniversities: University[];
  initialRequests: JoinRequest[];
}

export default function AdminUniversitiesClient({
  initialUniversities,
  initialRequests,
}: AdminUniversitiesClientProps) {
  const [activeTab, setActiveTab] = useState<"communities" | "requests">("communities");
  const [universities, setUniversities] = useState<University[]>(initialUniversities);
  const [requests, setRequests] = useState<JoinRequest[]>(initialRequests);
  const addToast = useToastStore((s) => s.addToast);
  const [isPending, startTransition] = useTransition();

  

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  

  const [pdfPreviewId, setPdfPreviewId] = useState<number | null>(null);

  

  const [editingUniUid, setEditingUniUid] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoEditSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoCropComplete = async (croppedBlob: Blob) => {
    setCropImageSrc(null);
    const uniUid = editingUniUid;
    setEditingUniUid(null);
    if (!uniUid) return;

    addToast("Uploading logo...", "success");
    try {
      const secureUrl = await uploadImageToCloudinary(croppedBlob, "universities");
      const res = await fetch("/admin/api/universities", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          university_uid: uniUid,
          logo_url: secureUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast("Logo updated successfully!", "success");
        setUniversities((prev) =>
          prev.map((u) => (u.university_uid === uniUid ? { ...u, logo_url: secureUrl } : u))
        );
      } else {
        addToast(data.message || "Failed to update logo", "error");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err?.message || "Failed to upload logo", "error");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  

  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast("University name is required", "error");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/universities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            name,
            description,
            logo_url: logoUrl,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          addToast(data.message, "success");
          setUniversities([data.university, ...universities]);
          setName("");
          setDescription("");
          setLogoUrl(null);
        } else {
          addToast(data.message || "Failed to create university", "error");
        }
      } catch (err) {
        addToast("Error creating university", "error");
      }
    });
  };

  const handleDeleteUniversity = (uniUid: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the university "${name}"? This will also remove all shop connections.`)) return;

    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/universities", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            university_uid: uniUid,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          addToast(data.message, "success");
          setUniversities(universities.filter((u) => u.university_uid !== uniUid));
        } else {
          addToast(data.message || "Failed to delete university", "error");
        }
      } catch (err) {
        addToast("Error deleting university", "error");
      }
    });
  };

  

  const handleRequestAction = (requestId: number, action: "approve" | "reject") => {
    startTransition(async () => {
      try {
        const response = await fetch("/admin/api/university-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            request_id: requestId,
            action,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          addToast(data.message, "success");
          setRequests(
            requests.map((r) =>
              r.id === requestId ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
            )
          );
        } else {
          addToast(data.message || "Failed to process request", "error");
        }
      } catch (err) {
        addToast("Error processing request", "error");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 text-[#e0e0e0] font-sans selection:bg-[#BA5B55] selection:text-white">
      {/* Tab Switcher and Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#2a2a2a] pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Campus Communities</h2>
          <p className="text-xs text-[#888]">Configure partner university portals and oversee shop verification requests.</p>
        </div>

        <div className="flex bg-[#181818] p-1.5 rounded-lg border border-[#333] gap-1">
          <button
            onClick={() => setActiveTab("communities")}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "communities" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
            }`}
          >
            <span>Communities</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "communities" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
              {universities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "requests" ? "bg-[#BA5B55] text-white shadow-sm" : "text-[#aaa] hover:text-white"
            }`}
          >
            <span>Join Requests</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === "requests" ? "bg-white/20 text-white" : "bg-[#252525] text-[#888]"}`}>
              {requests.filter((r) => r.status === "pending").length} pending
            </span>
          </button>
        </div>
      </div>

      {/* Communities Tab */}
      {activeTab === "communities" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* List of Universities */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[#BA5B55] uppercase tracking-wider mb-2">Existing Communities</h3>

            {universities.length === 0 ? (
              <div className="flex flex-col justify-center items-center border border-dashed border-[#333] rounded-xl p-12 text-center gap-3 bg-[#161616]/50 min-h-[300px]">
                <h3 className="text-base font-semibold text-[#aaa]">No campus communities configured</h3>
                <p className="text-xs text-[#666] max-w-sm">Use the creator panel on the right to add the first university community.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {universities.map((uni) => (
                  <div key={uni.university_uid} className="bg-[#1e1e1e] border border-[#333] p-5 rounded-2xl flex items-start gap-4">
                    <div className="relative group/avatar shrink-0 w-14 h-14 rounded-full overflow-hidden border border-[#444] bg-[#141414]">
                      {uni.logo_url ? (
                        

                        <img
                          src={uni.logo_url}
                          alt={uni.university_name}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setLightboxSrc(uni.logo_url)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-[#BA5B55]">
                          {uni.university_name.charAt(0)}
                        </div>
                      )}
                      
                      {/* Hover Overlay to Edit Logo */}
                      <div
                        onClick={() => {
                          setEditingUniUid(uni.university_uid);
                          fileInputRef.current?.click();
                        }}
                        className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 cursor-pointer text-[9px] font-medium"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        Edit
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{uni.university_name}</h4>
                      <p className="text-xs text-[#999] line-clamp-2 mt-1 leading-normal">
                        {uni.description || "No description provided."}
                      </p>
                      <div className="flex justify-between items-center mt-3 border-t border-[#333] pt-2">
                        <span className="inline-block text-[10px] text-gray-500">
                          Added: {new Date(uni.created_at).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteUniversity(uni.university_uid, uni.university_name)}
                          className="text-red-500 hover:text-red-400 transition-colors text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash size={12} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create University Form */}
          <div className="bg-[#1e1e1e] border border-[#333] p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[#BA5B55] uppercase tracking-wider mb-2">Create New Community</h3>

            <form onSubmit={handleAddUniversity} className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-2">
                <label className="text-[#aaa] font-semibold">University Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bangladesh University of Professionals"
                  className="w-full p-3 bg-[#141414] border border-[#333] rounded-xl text-white outline-none focus:border-[#BA5B55] text-xs transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#aaa] font-semibold">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Introduce the university, campus details, etc..."
                  rows={4}
                  className="w-full p-3 bg-[#141414] border border-[#333] rounded-xl text-white outline-none focus:border-[#BA5B55] text-xs transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[#aaa] font-semibold">University Logo</label>
                <ImageUpload
                  circularCrop={true}
                  aspectRatio={1}
                  folder="universities"
                  onUploaded={(url: any) => {
                    if (typeof url === "string") {
                      setLogoUrl(url);
                      addToast("Logo uploaded and cropped successfully", "success");
                    }
                  }}
                />
                {logoUrl && (
                  <div className="mt-2 flex items-center gap-3 bg-[#141414] p-3 rounded-xl border border-[#333]">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#444] bg-neutral-900 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold truncate flex-1">Logo uploaded &amp; verified</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 bg-[#BA5B55] hover:bg-[#a34e48] text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Plus size={16} stroke={2} />
                <span>{isPending ? "Creating..." : "Add University Portal"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Requests Tab */}
      {activeTab === "requests" && (
        <div className="flex flex-col gap-6">
          <h3 className="text-sm font-semibold text-[#BA5B55] uppercase tracking-wider mb-2">Shop Association Requests</h3>

          {requests.length === 0 ? (
            <div className="flex flex-col justify-center items-center border border-dashed border-[#333] rounded-xl p-12 text-center gap-3 bg-[#161616]/50 min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex justify-center items-center text-[#555] mb-2 border border-[#2a2a2a]">
                <Store size={32} stroke={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-[#aaa]">No association requests found</h3>
              <p className="text-xs text-[#666] max-w-sm">No shops have requested connection to university communities yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {requests.map((req) => (
                <div key={req.id} className="bg-[#1e1e1e] border border-[#333] p-6 rounded-2xl flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-[#333] pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white">{req.shop_name}</h4>
                      <p className="text-xs text-[#999] mt-1">
                        Requested connection to <strong className="text-white">{req.university_name}</strong>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-3 py-1 border text-[10px] rounded-full font-semibold uppercase tracking-wider ${
                        req.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : req.status === "rejected"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Merchant details */}
                    <div className="bg-[#141414] p-4 rounded-xl border border-[#2c2c2c] flex flex-col gap-2.5">
                      <span className="text-[10px] font-bold text-[#BA5B55] uppercase tracking-wider mb-0.5">Shop Information</span>
                      <p className="text-[#ccc]"><strong className="text-[#888]">Contact Email:</strong> {req.shop_email}</p>
                      <p className="text-[#ccc]"><strong className="text-[#888]">Contact Phone:</strong> {req.shop_phone}</p>
                    </div>

                    {/* ID Card details */}
                    <div className="bg-[#141414] p-4 rounded-xl border border-[#2c2c2c] flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#BA5B55] uppercase tracking-wider mb-2 block">Student ID Verification</span>
                        <p className="text-[#ccc] mb-2"><strong className="text-[#888]">Student ID:</strong> {req.student_id}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setPdfPreviewId(pdfPreviewId === req.id ? null : req.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#252525] hover:bg-[#303030] border border-[#444] rounded-lg text-[11px] text-[#BA5B55] font-semibold transition-colors cursor-pointer"
                        >
                          <Eye size={14} stroke={1.5} />
                          <span>{pdfPreviewId === req.id ? "Hide ID Card" : "Preview ID Card"}</span>
                        </button>
                        <a
                          href={req.sid_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-1.5 px-3 py-2 bg-[#252525] hover:bg-[#303030] border border-[#444] rounded-lg text-[11px] text-blue-400 font-semibold transition-colors cursor-pointer"
                        >
                          <Download size={14} stroke={1.5} />
                          <span>Download Document</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Inline ID Card PDF Preview */}
                  {pdfPreviewId === req.id && (
                    <div className="w-full h-96 border border-[#444] rounded-xl overflow-hidden bg-[#141414] flex flex-col shadow-inner animate-fadeIn">
                      <div className="bg-[#222] px-4 py-2 border-b border-[#333] flex justify-between items-center text-[10px] text-[#aaa]">
                        <span>Student ID Verification Document Preview</span>
                        <button onClick={() => setPdfPreviewId(null)} className="hover:text-white cursor-pointer">✕ Close</button>
                      </div>
                      <iframe
                        src={req.sid_pdf_url}
                        className="w-full flex-1 border-none"
                        title="Student ID Preview"
                      />
                    </div>
                  )}

                  {/* Action controls (for pending requests) */}
                  {req.status === "pending" && (
                    <div className="flex justify-end gap-3 border-t border-[#333] pt-4 mt-2">
                      <button
                        onClick={() => handleRequestAction(req.id, "reject")}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-transparent hover:bg-red-500/10 text-red-400 border border-red-500/30 hover:border-red-500 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X size={16} stroke={1.5} />
                        <span>Reject request</span>
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, "approve")}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <Check size={16} stroke={1.5} />
                        <span>Approve request</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hidden File Input for Logo Editing */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoEditSelect}
        className="hidden"
      />

      {/* Interactive Crop Modal */}
      {cropImageSrc && editingUniUid && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          circularCrop={true}
          aspectRatio={1}
          title="Crop Community Logo"
          onClose={() => {
            setCropImageSrc(null);
            setEditingUniUid(null);
          }}
          onCropComplete={handleLogoCropComplete}
        />
      )}

      {/* Lightbox Modal */}
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} alt="University Logo Preview" />
      )}
    </div>
  );
}
