import Logo from "@/app/(nashwa)/component/Logo";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifyJWT } from "../../lib/jwtUtils";

import SellerRegisterSteps from "../../component/SellerRegisterSteps";
import SellerEmailForm from "../../component/SellerEmailForm";
import SellerPasswordForm from "../../component/SellerPasswordForm";
import SellerPersonalInfoForm from "../../component/SellerPersonalInfoForm";
import SellerShopInfoForm from "../../component/SellerShopInfoForm";
import SellerDocumnetForm from "../../component/SellerDocumnetForm";

const SellerEmail = async () => {
  let state = {
    step: 1,
    email: "",
    role: null as string | null,
    takePassword: false,
    needPassword: false,
    needsOtp: false,
  };

  const cookieStore = await cookies();
  const token = cookieStore.get("auth-email-token")?.value;

  if (token) {
    try {
      const payload = await verifyJWT(token);
      if (payload && payload.purpose === "seller-registration") {
        state = {
          step: (payload.step as number) || 1,
          email: (payload.email as string) || "",
          role: (payload.role as string) || null,
          takePassword: (payload.takePassword as boolean) || false,
          needPassword: (payload.needPassword as boolean) || false,
          needsOtp: (payload.needsOtp as boolean) || false,
        };
      }
    } catch (error) {
      // Invalid token - stay in step 1
    }
  }

  const { step, email, role, needPassword, takePassword, needsOtp } = state;

  return (
    <div className="min-w-full flex justify-center">
      <div className="flex flex-col justify-center items-center mt-4 gap-4 w-230">
        <div className="bg-white w-full px-6 py-4 flex justify-between items-center">
          <Logo />
          <SellerRegisterSteps step={step} />
        </div>

        <div className="flex justify-center items-start gap-4 min-h-120">
          <div className="bg-white w-113 p-6 gap-4 h-full">
            <p className="text-sm">
              Start your business with
              <span className="text-[#BA5B55] ml-1">Nashwa</span>
            </p>
          </div>

          <div className="bg-white w-113 p-6 flex flex-col justify-between h-full">
            <div className="flex flex-col w-full gap-4">
              {step === 1 && (
                <p>
                  Let's create your
                  <span className="text-[#BA5B55] ml-1 mr-1">Nashwa</span>
                  Business account
                </p>
              )}

              {step === 1 && <SellerEmailForm />}

              {step === 1.5 && (
                <SellerPasswordForm
                  email={email}
                  role={role}
                  needPassword={needPassword}
                />
              )}

              {step === 2 && (
                <SellerPersonalInfoForm
                  email={email}
                  takePassword={takePassword}
                />
              )}

              {step === 3 && <SellerShopInfoForm email={email} />}

              {step === 4 && (
                <SellerDocumnetForm email={email} needsOtp={needsOtp} />
              )}
            </div>

            <div className="flex flex-col leading-none gap-1 w-fit">
              <p className="text-sm">Already has a business in Nashwa?</p>
              <Link
                href="/account-email"
                className="text-xs text-[#BA5B55] hover:underline w-fit"
              >
                Login to your shop.
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerEmail;
