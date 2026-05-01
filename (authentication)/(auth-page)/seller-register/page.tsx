import Logo from "@/app/(nashwa)/component/Logo";
import Link from "next/link";
import SellerRegisterSteps from "../../component/SellerRegisterSteps";
import SellerPersonalInfoForm from "../../component/SellerPersonalInfoForm";
import SellerEmailForm from "../../component/SellerEmailForm";
import SellerShopInfoForm from "../../component/SellerShopInfoForm";
import SellerDocumnetForm from "../../component/SellerDocumnetForm";

const SellerEmail = () => {
  return (
    <div className="min-w-full flex justify-center">
      <div className="flex flex-col justify-center items-center mt-4 gap-4 w-230">
        <div className="bg-white w-full px-6 py-4 flex justify-between items-center">
          <Logo />
          <SellerRegisterSteps />
        </div>

        <div className="flex justify-center items-start gap-4 min-h-120">
          <div className="bg-white w-113 p-6 gap-4 h-full">
            <p className="text sm ">
              Start your business with{" "}
              <span className="text-[#BA5B55]">Nashwa</span>
            </p>
          </div>

          <div className="bg-white w-113 p-6 flex flex-col justify-between h-full">
            <div className="flex flex-col w-full gap-4">
              <p>
                Let’s create your <span className="text-[#BA5B55]">Nashwa</span>{" "}
                Business account
              </p>
              {/* <SellerEmailForm/> */}
              {/* <SellerPersonalInfoForm/> */}
              {/* <SellerShopInfoForm/> */}
<SellerDocumnetForm/>
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
