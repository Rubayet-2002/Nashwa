import React from "react";
import { Check } from "@mynaui/icons-react";

const CreateShopSteps = ({ step }: { step?: number }) => {
  const currentStep = step || 1;

  const getStepStyle = (stepNumber: number): React.CSSProperties => {
    if (currentStep > stepNumber)
      return {
        backgroundColor: "#ba5b55",
        borderColor: "#ba5b55",
        color: "white",
      };
    if (currentStep === stepNumber)
      return {
        backgroundColor: "#ba5b55",
        borderColor: "#ba5b55",
        color: "white",
      };
    else
      return {
        borderColor: "#787878",
        color: "#787878",
      };
  };

  const getTextStyle = (stepNumber: number): React.CSSProperties => {
    if (currentStep >= stepNumber) return { color: "#ba5b55" };
    else return { color: "#787878" };
  };

  const renderSpan = (stepNumber: number) => {
    if (currentStep > stepNumber) {
      return <Check className="w-4 h-4" stroke={1.5} />;
    }
    return <span className="text-xs font-light">{stepNumber}</span>;
  };

  return (
    <div className="flex justify-center items-center gap-4">
      <div className="flex justify-center items-center gap-2 text-xs text-[#787878]">
        <div
          className="w-5 h-5 border flex leading-none justify-center items-center rounded-full font-medium "
          style={getStepStyle(1)}
        >
          {renderSpan(1)}
        </div>
        <p className="leading-none" style={getTextStyle(1)}>
          Shop information
        </p>
      </div>

      <div className="flex justify-center items-center gap-2 text-xs">
        <div
          className="w-5 h-5 border flex leading-none justify-center items-center rounded-full font-medium"
          style={getStepStyle(2)}
        >
          {renderSpan(2)}
        </div>

        <p className="leading-none" style={getTextStyle(2)}>
          Location & Description
        </p>
      </div>

      <div className="flex justify-center items-center gap-2 text-xs">
        <div
          className="w-5 h-5 border flex leading-none justify-center items-center rounded-full font-medium"
          style={getStepStyle(3)}
        >
          {renderSpan(3)}
        </div>

        <p className="leading-none" style={getTextStyle(3)}>
          Owner Verification (NID)
        </p>
      </div>
    </div>
  );
};

export default CreateShopSteps;
