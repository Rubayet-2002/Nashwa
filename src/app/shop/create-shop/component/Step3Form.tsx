"use client";

import { ArrowLeft, FileText, Store } from "@mynaui/icons-react";
import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { getCloudinarySignature } from "../lib/cloudinary.config";
import { prevStepAction } from "../lib/utils";

const Step3Form = () => {
  const router = useRouter();
  const [nidFile, setNidFile] = useState<File | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    if (!nidFile) {
      return { error: "Please select a PDF file of your NID." };
    }

    try {
      const signatureData = await getCloudinarySignature();
      const uploadFormData = new FormData();
      uploadFormData.append("file", nidFile);
      uploadFormData.append("api_key", signatureData.apiKey);
      uploadFormData.append("timestamp", signatureData.timestamp.toString());
      uploadFormData.append("signature", signatureData.signature);
      uploadFormData.append("folder", "nashwa_shop_NID");
      uploadFormData.append("public_id", signatureData.publicId);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
        { method: "POST", body: uploadFormData },
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error?.message || "Document upload failed.");
      }

      const response = await fetch("/shop/api/create-shop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ nidPdfUrl: uploadData.secure_url }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: result.message,
        };
      } else {
        return {
          error: result.message,
          redirect: result.redirect ? result.redirect : undefined,
        };
      }
    } catch (error: any) {
      console.error(error);
      return {
        error: error.message || "Network error! Please try again.",
      };
    }
  };

  const [state, action, isPending] = useActionState(handleClientAction, null);

  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      router.replace("/profile");
      router.refresh();
    } else if (state?.error) {
      addToast(state.error, "error");
      if (state.redirect) {
        router.replace(state.redirect);
      }
    }
  }, [state, addToast, router]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-none">
          Please provide your shop location and description
        </p>
        <div>
          <div className="h-0.5 bg-gray-100 rounded">
            <div className="h-0.5 bg-[#BA5B55] rounded w-full" />
          </div>
          <p className="text-xs text-[#787878] mt-1">
            Step 3 of 3 - NID in PDF format
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
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

      <div className="flex gap-2">
        <button
          type="button" 
          onClick={async () => {
            await prevStepAction();
          }}
          disabled={isPending}
          className="flex items-center justify-center gap-2 leading-none text-sm border border-gray-200 text-[#787878] hover:bg-white hover:text-[#BA5B55] hover:border-[#BA5B55] hover:border transition-colors py-2.5 cursor-pointer disabled:opacity-50"
          style={{ width: "40%" }}
        >
          <ArrowLeft size={20} stroke={1.5} />
          <p className="leading-none">Back</p>
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] transition-colors disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
        >
          <Store size={20} stroke={1.5} />
          <p className="leading-none mb-0.5">
            {isPending ? "Processing..." : "Request shop opening"}
          </p>
        </button>
      </div>
    </form>
  );
};

export default Step3Form;
