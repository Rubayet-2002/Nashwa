"use client";

import { useActionState, useEffect } from "react";
import { ArrowRight, Telephone, Store, Mail } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import { Step1Action } from "../lib/step1Action";
import { CreateShopPayload } from "../lib/utils";

interface Step1FormProps {
  defaultValues?: CreateShopPayload | null;
}

const Step1Form = ({ defaultValues }: Step1FormProps) => {
  const addToast = useToastStore((s) => s.addToast);
  
  const [state, action, isPending] = useActionState(Step1Action, null);

  useEffect(() => {
    if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast]);

  const currentValues = state?.values || defaultValues;

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-none">
          Please provide your shop information
        </p>
        <div>
          <div className="h-0.5 bg-gray-100 rounded">
            <div
              className="h-0.5 bg-[#BA5B55] rounded"
              style={{ width: "33%" }}
            />
          </div>
          <p className="text-xs text-[#787878] mt-1">
            Step 1 of 3 - Shop information
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55] mt-2">
        <Store color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="shopName"
          defaultValue={currentValues?.shopName || ""}
          placeholder="Enter Shop name"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Mail color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="email"
          name="shopEmail"
          defaultValue={currentValues?.shopEmail || ""}
          placeholder="Enter Shop email"
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
          name="shopPhone"
          defaultValue={currentValues?.shopPhone || ""}
          placeholder="Enter Shop phone number"
          required
          minLength={11}
          maxLength={11}
          inputMode="numeric"
          pattern="[0-9]*"
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full  flex items-center justify-center gap-2 py-2.5 text-white text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] transition-colors disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
        >
          <p className="leading-none mb-0.5">
            {isPending ? "Saving..." : "Next step"}
          </p>
          <ArrowRight size={20} stroke={1.5} />
        </button>
      </div>
    </form>
  );
};

export default Step1Form;
