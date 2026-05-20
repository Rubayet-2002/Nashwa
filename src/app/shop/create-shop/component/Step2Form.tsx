"use client";

import { useState, useActionState, useEffect } from "react";
import { ArrowLeft, ArrowRight, EditOne, MapPin } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import { Step2Action } from "../lib/step2Action";
import { prevStepAction, CreateShopPayload } from "../lib/utils";
import { useRouter } from "next/navigation";


interface Step2FormProps {
  defaultValues?: CreateShopPayload | null;
}

const Step2Form = ({ defaultValues }: Step2FormProps) => {
  const addToast = useToastStore((s) => s.addToast);
  const [state, action, isPending] = useActionState(Step2Action, null);
  const router = useRouter(); 
  const currentValues = state?.values || defaultValues;
  const [descLength, setDescLength] = useState(
    currentValues?.description?.length || 0,
  );

  useEffect(() => {
    if (state?.error) {
      if(state.redirect){
        addToast(state.error, "error");
       router.replace(state.redirect); 
      }
      addToast(state.error, "error");
    }
  }, [state, addToast]);


  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-none">
          Please provide your shop location and description
        </p>
        <div>
          <div className="h-0.5 bg-gray-100 rounded">
            <div
              className="h-0.5 bg-[#BA5B55] rounded"
              style={{ width: "66%" }}
            />
          </div>
          <p className="text-xs text-[#787878] mt-1">
            Step 2 of 3 - Location & Description
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55] mt-2">
        <MapPin color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="location"
          defaultValue={currentValues?.location || ""}
          placeholder="Enter your Shop location"
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
            defaultValue={currentValues?.description || ""}
            placeholder="Describe your shop and business."
            maxLength={300}
            required
            onChange={(e) => setDescLength(e.target.value.length)}
            className="w-full min-h-15 max-h-15 bg-white text-sm outline-none placeholder:text-[#787878] resize-none custom-scrollbar"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={async () => {
            await prevStepAction();
          }}
          disabled={isPending}
          className="flex items-center justify-center gap-2 leading-none text-sm border border-gray-200 text-[#787878] hover:bg-white hover:text-[#BA5B55] hover:border-[#BA5B55] hover:border transition-colors py-2.5 cursor-pointer"
          style={{ width: "40%" }}
        >
          <ArrowLeft size={20} stroke={1.5} />
          <p className="leading-none">Back</p>
        </button>

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

export default Step2Form;
