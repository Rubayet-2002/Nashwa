"use client";

import { Mail } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import { emailCheck } from "../lib/inputValidation";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

const SellerEmailForm = () => {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const email = (formData.get("email") as string).trim();
    const validation = emailCheck.safeParse({ email });

    if (!validation.success) {
      return { error: validation.error.issues[0].message, values: { email } };
    }

    try {
      const response = await fetch("/api/seller-check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();
      if (response.ok) return { success: true };

      return { error: result.message, values: { email } };
    } catch (error) {
      return { error: "Network error! Please try again", values: { email } };
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
      <p className="text-xs">
        Please enter your personal active Email to continue.
      </p>
      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Mail color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="email"
          name="email"
          placeholder="Enter email"
          defaultValue={state?.values?.email || ""}
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">
          {isPending ? "Checking email..." : "Continue"}
        </p>
      </button>
    </form>
  );
};

export default SellerEmailForm;
