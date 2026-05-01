import Link from "next/link";
import Logo from "@/app/(nashwa)/component/Logo";
import { Mail } from "@mynaui/icons-react";
import RegisterForm from "../../component/RegisterForm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJWT } from "../../lib/jwtUtils";

const Register = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-email-token")?.value;

  if (!token) redirect("/account-email");

  const payload = token ? await verifyJWT(token) : null;
  if (!payload || payload.purpose !== "create-account") {
    redirect("/account-email");
  }

  return (
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-15 flex flex-col p-6 gap-4 w-113">
        <Logo />
        <p className="text-sm">Create an account with valid credentials.</p>

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

        <RegisterForm email={payload.email as string}/>

        <div className="flex flex-col leading-none gap-1 w-fit">
          <p className="text-sm">Already a customer?</p>
          <Link
            href="/account-email"
            className="text-xs text-[#BA5B55] hover:underline w-fit"
          >
            Try with another email.
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
