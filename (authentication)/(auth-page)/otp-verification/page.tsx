import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";
import { Mail } from "@mynaui/icons-react";
import Logo from "@/app/(nashwa)/navbar/Logo";
import OTPForm from "./OTPForm";

import React from "react";

const OTP = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-intent-token")?.value;

  if (!token) redirect("/email");

  const payload = token ? await verifyJWT(token) : null;

  const isVerifyAccount = payload?.purpose === "verify-account";
  const isPasswordReset = payload?.purpose === "password-reset";

  if (!payload || (!isVerifyAccount && !isPasswordReset)) {
    redirect("/email");
  }

  let headerText;
  if (isVerifyAccount) {
    headerText = "Please check your email to find Account verification OTP.";
  } else if (isPasswordReset) {
    headerText = "Please check your email to find password reset OTP.";
  }

  return (
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-12 flex flex-col p-6 gap-4 w-full max-w-md border border-gray-100 shadow-sm">
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
          uid={payload.uid as string}
          purpose={payload.purpose as string}
        />
      </div>
    </div>
  );
};

export default OTP;
