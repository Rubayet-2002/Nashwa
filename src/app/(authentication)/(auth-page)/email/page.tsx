import Logo from "@/app/(nashwa)/navbar/Logo";
import Link from "next/link";
import EmailForm from "./EmailForm";

const AccountEmail = () => {
  return (
    <div className="min-w-full flex justify-center gap-5">
      <div className="bg-white mt-12 flex flex-col p-6 gap-4 w-full max-w-md border border-gray-100 shadow-sm">
        <Logo />
        <p className="text-sm">Enter your email to continue.</p>

        <EmailForm />
      </div>
    </div>
  );
};

export default AccountEmail;
