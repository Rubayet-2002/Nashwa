"use client";

import { Mail, FileText } from "@mynaui/icons-react";
import { useState } from "react";

const SellerDocumnetForm = () => {
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [nidFile, setNidFile] = useState<File | null>(null);

  return (
    <form action="" className="flex flex-col gap-4">
      <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
        <Mail
          color="#787878"
          size={20}
          stroke={1.5}
          className="min-w-4.5 mt-0.5"
        />
        <p>rowshan.rubayet@gmail.com</p>
        <button
          type="button"
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
              {studentIdFile ? studentIdFile.name : "Select document"}
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
          onChange={(e) => setStudentIdFile(e.target.files?.[0] || null)}
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
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer mt-2"
      >
        <p className="leading-none">Verify your information</p>
      </button>
      <p className="text-xs text-[#787878]">* You will receive an OTP to your email.</p>
</div>
    </form>
  );
};

export default SellerDocumnetForm;
