import Logo from "@/app/(nashwa)/component/Logo";
import { Mail } from "@mynaui/icons-react";
import Link from "next/link";
import SellerPasswordForm from "../../component/SellerPasswordForm";

const SellerPassword = () => {
  return (
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-15 flex flex-col p-6 gap-4 w-113">
        <Logo />
        <p className="text-md">Your email is already registered as a user.</p>

        <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
          <Mail
            color="#787878"
            size={20}
            stroke={1.5}
            className="min-w-4.5 mt-0.5"
          />
          <p>rowshan.rubayet@gmail.com</p>
          <button className="text-[#BA5B55] hover:underline w-fit">
            change
          </button>
        </div>

        <p className="text-sm">
          To convert your account to a professional account, please enter your
          password.
        </p>

        <SellerPasswordForm />
      </div>
    </div>
  );
};

export default SellerPassword;
