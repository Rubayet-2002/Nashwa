"use client";

import { useState, useEffect, useRef } from "react";
import { useToastStore } from "@/zustand/toastStore";
import { uploadDocumentToCloudinary } from "@/lib/cloudinary-upload";
import { X, Building, FileText, Upload, CheckCircle } from "@mynaui/icons-react";
import { useRouter } from "next/navigation";

interface University {
  university_uid: string;
  university_name: string;
}

interface JoinUniversityModalProps {
  shopUid: string;
  onClose: () => void;
}

export default function JoinUniversityModal({ shopUid, onClose }: JoinUniversityModalProps) {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUnis, setLoadingUnis] = useState(true);

  const [selectedUni, setSelectedUni] = useState("");
  const [studentId, setStudentId] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUnis = async () => {
      try {
        const res = await fetch("/api/universities");
        const data = await res.json();
        if (res.ok && data.success) {
          setUniversities(data.universities || []);
        } else {
          addToast("Failed to load universities", "error");
        }
      } catch (err) {
        console.error(err);
        addToast("Error loading universities", "error");
      } finally {
        setLoadingUnis(false);
      }
    };
    fetchUnis();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUni) return addToast("Please select a university.", "error");
    if (!studentId.trim()) return addToast("Please enter your Student ID.", "error");
    if (!documentFile) return addToast("Please upload your student ID document.", "error");

    setIsSubmitting(true);

    try {
      // 1. Upload to Cloudinary
      addToast("Uploading document...", "success");
      const documentUrl = await uploadDocumentToCloudinary(documentFile, "nashwa_university_requests");

      // 2. Submit to API
      const res = await fetch("/shop/api/set-shop-university", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          shopUid,
          universityUid: selectedUni,
          studentId: studentId.trim(),
          sidPdfUrl: documentUrl,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast("Request submitted successfully! Waiting for admin approval.", "success");
        onClose();
        router.refresh();
      } else {
        addToast(data.message || "Failed to submit request.", "error");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Error submitting request. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white border border-[#e2e2e2] shadow-2xl rounded-3xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="w-full px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-[#fafafa]">
          <div>
            <h2 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider">Join University Community</h2>
            <p className="text-[10px] text-gray-500 mt-1">Connect your shop to a local campus.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-[#BA5B55] outline-none">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* University Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Building size={16} /> Select Campus
            </label>
            <select
              value={selectedUni}
              onChange={(e) => setSelectedUni(e.target.value)}
              disabled={loadingUnis}
              required
              className="w-full p-3 bg-[#fdfdfd] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#BA5B55] text-gray-800 disabled:opacity-50"
            >
              <option value="" disabled>-- Select a university --</option>
              {universities.map((uni) => (
                <option key={uni.university_uid} value={uni.university_uid}>
                  {uni.university_name}
                </option>
              ))}
            </select>
            {loadingUnis && <span className="text-[10px] text-gray-400">Loading available communities...</span>}
          </div>

          {/* Student ID */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <FileText size={16} /> Student ID Number
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 1910001"
              required
              className="w-full p-3 bg-[#fdfdfd] border border-gray-200 rounded-xl text-sm outline-none focus:border-[#BA5B55]"
            />
          </div>

          {/* Verification Document */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Upload size={16} /> ID Verification Document
            </label>
            <p className="text-[10px] text-gray-500 font-light mb-1">
              Upload a clear photo or PDF of your valid Student ID card.
            </p>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-[#BA5B55] transition-colors"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
                required
              />
              {documentFile ? (
                <>
                  <CheckCircle size={24} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-gray-800 truncate w-full text-center">{documentFile.name}</span>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-600">Click to select file</span>
                  <span className="text-[10px] text-gray-400">Max size: 10MB (PDF/Images)</span>
                </>
              )}
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || loadingUnis}
              className="w-full py-3 bg-[#BA5B55] hover:bg-[#a34e48] text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 text-sm shadow-sm"
            >
              {isSubmitting ? "Submitting Request..." : "Submit Join Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
