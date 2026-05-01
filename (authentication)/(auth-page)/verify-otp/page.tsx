import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/app/(nashwa)/component/Logo";
import { verifyJWT } from "../../lib/jwtUtils";
import { Mail } from "@mynaui/icons-react";
import OTPForm from "../../component/OTPForm";

const OTP = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-email-token")?.value;

  if (!token) redirect("/account-email");

  const payload = await verifyJWT(token);

  const isVerifyAccount = payload?.purpose === "verify-account";
  const isPasswordReset = payload?.purpose === "password-reset";

  if (!payload || (!isVerifyAccount && !isPasswordReset)) {
    redirect("/account-email");
  }

  let headerText = "";
  if (isVerifyAccount) {
    headerText = "Please check your email to find Email verification OTP.";
  } else if (isPasswordReset) {
    headerText = "Please check your email to find password reset OTP.";
  }

  return (
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-15 flex flex-col p-6 gap-4 w-113 shadow-sm border border-gray-100">
        <Logo />

        <p className="text-sm">{headerText}</p>

        <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
          <Mail
            color="#787878"
            size={20}
            stroke={1.5}
            className="min-w-4.5 mt-0.5"
          />
          <p>{payload.email as string}</p>
          <Link
            href="/account-email"
            className="text-[#BA5B55] hover:underline w-fit"
          >
            change
          </Link>
        </div>

        <OTPForm
          email={payload.email as string}
          purpose={payload.purpose as string}
        />
      </div>
    </div>
  );
};

export default OTP;
