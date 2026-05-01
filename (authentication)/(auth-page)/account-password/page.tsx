import Link from "next/link";
import { Mail } from "@mynaui/icons-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "../../lib/jwtUtils";
import Logo from "@/app/(nashwa)/component/Logo";
import PasswordForm from "../../component/PasswordForm";

const Password = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-email-token")?.value;

  if (!token) redirect("/account-email");

  const payload = token ? await verifyJWT(token) : null;
  if (!payload || payload.purpose !== "enter-password") {
    redirect("/account-email");
  }
  return (
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-15 flex flex-col p-6 gap-4 w-113">
        <Logo />
        <p className="text-sm">Enter your password to login</p>

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
        <PasswordForm email={payload.email as string}/>
      </div>
    </div>
  );
};

export default Password;
