"use client";

import {
  Eye,
  EyeOff,
  GraduationCap,
  Telephone,
  User,
  Lock,
  Mail,
} from "@mynaui/icons-react";
import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";

const SellerPersonalInfoForm = ({
  email,
  takePassword,
}: {
  email?: string;
  takePassword?: boolean | null;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const username = formData.get("username") as string;
    const phone = formData.get("phone") as string;
    const university = formData.get("university") as string;
    const password = formData.get("password") as string;

    const requestBody: any = {
      step: 2,
      username,
      phone,
      university,
    };

    if (takePassword) {
      requestBody.password = password;
    }

    try {
      const response = await fetch("/api/seller-save-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      if (response.ok) return { success: true };
      return { error: result.message };
    } catch (error) {
      return { error: "Network error! Please try again" };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleClientAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast, router]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
        <Mail
          color="#787878"
          size={20}
          stroke={1.5}
          className="min-w-4.5 mt-0.5"
        />
        <p>{email || "email@example.com"}</p>
        <button
          type="button"
          onClick={() =>
            fetch("/api/clear-cookie", { method: "POST" }).then(() =>
              router.refresh(),
            )
          }
          className="cursor-pointer text-[#BA5B55] hover:underline w-fit"
        >
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
          inputMode="numeric"
          pattern="[0-9]*"
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
          type="text"
          name="university"
          placeholder="Select or search University name"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      {takePassword && (
        <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
          <Lock color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
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
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">{isPending ? "Saving..." : "Next step"}</p>
      </button>
    </form>
  );
};

export default SellerPersonalInfoForm;
