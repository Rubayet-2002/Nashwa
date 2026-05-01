"use client";

import { EditOne, Mail, MapPin, Store } from "@mynaui/icons-react";
import { useState, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";

const SellerShopInfoForm = ({ email }: { email?: string }) => {
  const [descLength, setDescLength] = useState(0);
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const shopName = formData.get("shopName") as string;
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;

    const requestBody = {
      step: 3,
      shopName,
      location,
      description,
    };

    try {
      const response = await fetch("/api/seller-save-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) return { success: true };

      const result = await response.json();
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

      <p className="text-sm">Please provide your shop information.</p>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Store color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="shopName"
          placeholder="Enter shop name"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <MapPin color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="location"
          placeholder="Enter your business location"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div>
        <span className="text-xs text-[#787878] leading-none">
          ({descLength}/300)
        </span>

        <div className="flex items-start gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
          <EditOne
            color="#787878"
            size={20}
            stroke={1.5}
            className="min-w-4.5 mt-px"
          />
          <textarea
            name="description"
            placeholder="Describe your shop and business."
            maxLength={300}
            required
            onChange={(e) => setDescLength(e.target.value.length)}
            className="w-full min-h-15 max-h-15 bg-white text-sm outline-none placeholder:text-[#787878] resize-none custom-scrollbar"
          />
        </div>
      </div>

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

export default SellerShopInfoForm;
