import Logo from "@/app/(nashwa)/navbar/Logo";
import EmailForm from "./EmailForm";

const AccountEmail = () => {
  return (
    <div className="min-w-full flex justify-center gap-5">
      <div className="bg-white mt-15 flex flex-col p-6 gap-4 w-113">
        <Logo />
        <p className="text-sm">Enter your email to continue.</p>

        <EmailForm />
      </div>
    </div>
  );
};

export default AccountEmail;
