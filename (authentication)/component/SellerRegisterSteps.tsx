import React from 'react'

const steps = [
  { id: 1, label: "Email checking" },
  { id: 2, label: "Personal info" },
  { id: 3, label: "Shop info" },
  { id: 4, label: "Documents pdf" },
];

const SellerRegisterSteps = ({ step }: { step: number }) => {
  // Use Math.floor because step could be 1.5
  const currentStep = Math.floor(step);

  return (
    <div className="flex justify-center items-center gap-4">
      {steps.map((s) => {
        const isActive = currentStep >= s.id;

        return (
          <div key={s.id} className="flex justify-center items-center gap-2 text-xs">
            <div
              className={`w-5 h-5 border flex leading-none justify-center items-center rounded-full font-medium ${
                isActive
                  ? "border-[#BA5B55] text-white bg-[#ba5b55]"
                  : "border-[#787878] text-[#787878]"
              }`}
            >
              <span>{s.id}</span>
            </div>
            <p className={`leading-none ${isActive ? "text-[#ba5b55]" : "text-[#787878]"}`}>
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default SellerRegisterSteps;