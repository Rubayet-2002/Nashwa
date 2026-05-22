"use client";

import { useActionState, useEffect, useState } from "react";
import { ArrowRight, Telephone, Store, Mail } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import { Step1Action } from "../lib/step1Action";
import { CreateShopPayload } from "../lib/utils";
import { UNIVERSITIES } from "../../lib/universities";

interface Step1FormProps {
  defaultValues?: CreateShopPayload | null;
}

const Step1Form = ({ defaultValues }: Step1FormProps) => {
  const addToast = useToastStore((s) => s.addToast);
  const [state, action, isPending] = useActionState(Step1Action, null);
  const [selectedUniversityUid, setSelectedUniversityUid] = useState(
    defaultValues?.universityUid || "",
  );
  const [isUniversityDialogOpen, setIsUniversityDialogOpen] = useState(
    !(defaultValues?.universityUid || state?.values?.universityUid),
  );

  useEffect(() => {
    if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast]);

  const currentValues = state?.values || defaultValues;
  const selectedUniversity = UNIVERSITIES.find(
    (university) => university.uid === selectedUniversityUid,
  );

  useEffect(() => {
    const nextUniversityUid = currentValues?.universityUid || "";
    if (nextUniversityUid) {
      setSelectedUniversityUid(nextUniversityUid);
      setIsUniversityDialogOpen(false);
    }
  }, [currentValues?.universityUid]);

  return (
    <form action={action} className="relative flex flex-col gap-3">
      <input type="hidden" name="universityUid" value={selectedUniversityUid} />
      <input type="hidden" name="universityName" value={selectedUniversity?.name || ""} />

      {isUniversityDialogOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm p-2">
          <div className="w-full max-w-md border border-[#eaeaea] bg-white shadow-xl">
            <div className="border-b border-[#f0f0f0] px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">
                University setup
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#1a1a1a]">
                Choose your university
              </h3>
              <p className="mt-1 text-xs text-[#787878]">
                We use this to sort shops and keep Nashwa focused on your campus.
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto p-4">
              <div className="grid gap-2">
                {UNIVERSITIES.map((university) => (
                  <button
                    key={university.uid}
                    type="button"
                    onClick={() => {
                      setSelectedUniversityUid(university.uid);
                      setIsUniversityDialogOpen(false);
                    }}
                    className={`flex items-center justify-between border px-3 py-2 text-left text-sm transition-colors ${
                      selectedUniversityUid === university.uid
                        ? "border-[#BA5B55] bg-[#BA5B55]/5 text-[#BA5B55]"
                        : "border-[#eaeaea] text-[#1a1a1a] hover:border-[#BA5B55]/40 hover:bg-[#fcfcfd]"
                    }`}
                  >
                    <span>{university.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#787878]">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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

      <div className="border border-[#eaeaea] bg-[#fcfcfd] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#787878]">
              University
            </p>
            <p className="text-xs text-[#787878]">
              {selectedUniversity ? selectedUniversity.name : "Choose your university"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUniversityDialogOpen(true)}
            className="text-xs font-medium text-[#BA5B55] hover:underline"
          >
            {selectedUniversity ? "Change" : "Select"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[#787878]">
          If you are starting a new shop, pick the university that best matches your campus.
        </p>
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
