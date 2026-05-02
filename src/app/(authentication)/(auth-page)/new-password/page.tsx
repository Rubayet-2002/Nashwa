import Logo from "@/app/(nashwa)/component/Logo";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "../../lib/jwtUtils";
import NewPasswordForm from "../../component/NewPasswordForm";

const NewPass = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("password-reset-token")?.value;

  if (!token) redirect("/account-email");

  const payload = token ? await verifyJWT(token) : null;
  if (!payload || payload.purpose !== "reset-password") {
    redirect("/account-email");
  }

  return (
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-15 flex flex-col p-6 gap-4 w-113">
        <Logo />
        <p className="text-sm">Enter your new password</p>
        <NewPasswordForm email={payload.email as string} />
        <p className="text-xs text-[#787878] text-center">
          Note : You will be logged out from all the devices.
        </p>
      </div>
    </div>
  );
};

export default NewPass;
