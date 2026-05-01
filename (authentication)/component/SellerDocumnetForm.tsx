"use client";

import { FileText, Mail } from "@mynaui/icons-react";
import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";

const SellerDocumnetForm = ({
  email,
  needsOtp,
}: {
  email?: string;
  needsOtp?: boolean | null;
}) => {
  const [sidFile, setSidFile] = useState<File | null>(null);
  const [nidFile, setNidFile] = useState<File | null>(null);
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const handleClientAction = async () => {
    if (!sidFile || !nidFile)
      return { error: "Both PDF documents are required." };

    try {
      const signRes = await fetch("/api/get-cloudinary-signature", {
        method: "POST",
      });
      const { signature, timestamp, apiKey, cloudName } = await signRes.json();

      const upload = async (file: File) => {
        const body = new FormData();
        body.append("file", file);
        body.append("signature", signature);
        body.append("timestamp", timestamp);
        body.append("api_key", apiKey);
        body.append("folder", "nashwa_seller_documents");

        const res = await fetch(
          `https://cloudinary.com{deh6ektc4}/raw/upload`,
          {
            method: "POST",
            body,
          },
        );
        return res.json();
      };

      const [sidRes, nidRes] = await Promise.all([
        upload(sidFile),
        upload(nidFile),
      ]);

      if (!sidRes.secure_url || !nidRes.secure_url)
        throw new Error("Upload failed");

      const submitRes = await fetch("/api/seller-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          sidUrl: sidRes.secure_url,
          nidUrl: nidRes.secure_url,
        }),
      });

      const result = await submitRes.json();
      if (submitRes.ok)
        return {
          success: true,
          message: result.message,
          redirect: result.redirect,
        };

      return { error: result.message };
    } catch (error) {
      return { error: "Something went wrong! Please try again." };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleClientAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      if (state.redirect) {
        router.replace(state.redirect);
      }
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, router, addToast]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
        <Mail
          color="#787878"
          size={20}
          stroke={1.5}
          className="min-w-4.5 mt-0.5"
        />
        <p>{email}</p>
        <button
          type="button"
          onClick={() => {
            fetch("/api/clear-cookie", { method: "POST" }).then(() =>
              router.refresh(),
            );
          }}
          className="cursor-pointer text-[#BA5B55] hover:underline w-fit"
        >
          change
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm">
          Please upload a PDF of your student ID card (both sides).
        </p>
        <label
          htmlFor="student_id"
          className="w-full flex items-center justify-between border border-gray-200 px-4 py-2.5 cursor-pointer hover:border-[#BA5B55]/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-[#787878]">
            <FileText size={16} stroke={1.5} className="shrink-0" />
            <span className="truncate max-w-50">
              {sidFile ? sidFile.name : "Select document"}
            </span>
          </div>
          <span className="text-xs text-[#BA5B55] font-medium">Browse</span>
        </label>
        <input
          type="file"
          id="student_id"
          name="student_id"
          accept=".pdf"
          className="hidden"
          onChange={(e) => setSidFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      {/* 2. National ID Upload Section */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm">
          Please upload a PDF of your National ID (NID) card (both sides).
        </p>
        <label
          htmlFor="nid"
          className="w-full flex items-center justify-between border border-gray-200 px-4 py-2.5 cursor-pointer hover:border-[#BA5B55]/30 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-[#787878]">
            <FileText size={16} stroke={1.5} className="shrink-0" />
            <span className="truncate max-w-50">
              {nidFile ? nidFile.name : "Select document"}
            </span>
          </div>
          <span className="text-xs text-[#BA5B55] font-medium">Browse</span>
        </label>
        <input
          type="file"
          id="nid"
          name="nid"
          accept=".pdf"
          className="hidden"
          onChange={(e) => setNidFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <button
          type="submit"
          disabled={isPending}
          className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer mt-2"
        >
          <p className="leading-none">
            {isPending
              ? "Processing..."
              : needsOtp
                ? "Verify Information"
                : "Create Shop"}
          </p>
        </button>
        {needsOtp && (
          <p className="text-xs text-[#787878]">
            * You will receive an OTP to your email.
          </p>
        )}
      </div>
    </form>
  );
};

export default SellerDocumnetForm;
