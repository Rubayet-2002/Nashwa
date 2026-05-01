"use client";

import {
  Eye,
  EyeOff,
  GraduationCap,
  Mail,
  Telephone,
  User,
  Lock,
} from "@mynaui/icons-react";
import { useState } from "react";

const SellerPersonalInfoForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action="" className="flex flex-col gap-3">

      <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
        <Mail
          color="#787878"
          size={20}
          stroke={1.5}
          className="min-w-4.5 mt-0.5"
        />
        <p>rowshan.rubayet@gmail.com</p>
        <button className="cursor-pointer text-[#BA5B55] hover:underline w-fit">
          change
        </button>
      </div>

      <p className="text-sm">Please provide your personal information.</p>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <User color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="username"
          placeholder="Enter owner name"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Telephone
          color="#787878"
          size={20}
          stroke={1.5}
          className="min-w-4.5"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Enter phone number"
          required
          minLength={11}
          maxLength={11}
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <GraduationCap
          color="#787878"
          size={20}
          stroke={1.5}
          className="min-w-4.5"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Select or search University name"
          required
          minLength={11}
          maxLength={11}
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Lock color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type={showPassword ? "text" : "password"}
          name="new-password"
          placeholder="Enter new password"
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

      <button
        type="submit"
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">Next step </p>
      </button>
    </form>
  );
};

export default SellerPersonalInfoForm;
