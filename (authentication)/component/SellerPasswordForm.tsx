"use client";

import { Eye, EyeOff, Lock } from "@mynaui/icons-react";
import Link from "next/link";
import { useState } from "react";

const SellerPasswordForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action="" className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Lock color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Enter password"
          minLength={6}
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="outline-none text-[#787878] hover:text-[#BA5B55] cursor-pointer"
        >
          {showPassword ? (
            <EyeOff size={20} stroke={1.5} />
          ) : (
            <Eye size={20} stroke={1.5} />
          )}
        </button>
      </div>

      <div className="flex justify-center items-center w-full">
        <Link
          href="/forgot-password"
          className="text-xs text-[#BA5B55] hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">Continue</p>
      </button>
    </form>
  );
};

export default SellerPasswordForm;
