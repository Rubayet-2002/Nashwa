import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";
import Logo from "@/app/(nashwa)/navbar/Logo";
import ChangePass from "./ChangePass";

const Change = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-intent-token")?.value;

  const payload = token ? await verifyJWT(token) : null;
  if (!payload || payload.purpose !== "change-password") {
    redirect("/email");
  }

  return (
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-15 flex flex-col p-6 gap-4 w-113">
        <Logo />
        <p className="text-sm">Enter your new password</p>
        <ChangePass
          email={payload.email as string}
          uid={payload.uid as string}
        />
        <p className="text-xs text-[#787878] text-center">
          Note : You will be logged out from all the devices.
        </p>
      </div>
    </div>
  );
};

export default Change;
