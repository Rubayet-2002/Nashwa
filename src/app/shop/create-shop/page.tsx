import Logo from "@/app/(nashwa)/navbar/Logo";
import { authMe } from "@/app/(authentication)/lib/authMe";
import { redirect } from "next/navigation";

import CreateShopSteps from "./component/CreateShopSteps";
import Step1Form from "./component/Step1Form";
import Step2Form from "./component/Step2Form";
import Step3Form from "./component/Step3Form";

import { cookies } from "next/headers";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";
import { CreateShopPayload } from "./lib/utils";

const CreateShop = async () => {
  const { user } = await authMe();
  if (!user) {
    redirect("/");
  }

  if (user.owned_shops && user.owned_shops.length >= 2) {
    redirect("/profile");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("create-shop-token")?.value;
  const payload = token
    ? ((await verifyJWT(token)) as CreateShopPayload)
    : null;

  const currentStep = payload?.step || 1;

  const renderStepForm = () => {
    if (currentStep == 1) return <Step1Form defaultValues={payload} />;
    else if (currentStep == 2) return <Step2Form defaultValues={payload} />;
    else if (currentStep == 3) return <Step3Form />;
    else return <Step1Form defaultValues={payload} />;
  };

  return (
    <div className="min-w-full flex justify-center">
      <div className="flex flex-col justify-center items-center mt-4 gap-4 w-230">
        <div className="bg-white w-full px-6 py-4 flex justify-between items-center">
          <Logo />
          <CreateShopSteps step={currentStep} />
        </div>

        <div className="flex justify-center items-start gap-4 min-h-120">
          <div className="bg-white w-113 p-6 gap-4 h-full">
            <p className="text-sm">
              Start your business with
              <span className="text-[#BA5B55] ml-1">Nashwa</span>
            </p>
          </div>

          <div className="bg-white w-113 p-6 flex flex-col justify-between h-full">
            {renderStepForm()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateShop;
