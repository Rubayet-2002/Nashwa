import Image from "next/image";
import Link from "next/link";
import { profileData } from "./lib/ProfileData";
import { redirect } from "next/navigation";
import LogoutButton from "./logout/LogoutButton";
import DeleteAccountButton from "./deleteAccount/DeleteAccountButton";
import ShopListItem from "./lib/ShopListItem";
import ProfilePhotoEditor from "./ProfilePhotoEditor";
import CustomerUniversityPopup from "./CustomerUniversityPopup";
import {
  CalendarArrowDown,
  CogFour,
  EditOne,
  ImageRectangle,
  Mail,
  Package,
  Pencil,
  Plus,
  Store,
  Telephone,
  Users,
} from "@mynaui/icons-react";

const ProfilePage = async () => {
  const userData = await profileData();
  if (!userData) {
    redirect("/email");
  }
  const showCustomerUniversityPopup = !userData.university_uid;
  const hasShops = userData.shops && userData.shops.length > 0;
  return (
    
    <>
    <CustomerUniversityPopup show={showCustomerUniversityPopup} />
    <div className="flex w-full gap-5 h-full overflow-hidden">
      {/* left section */}
      <div className="w-95 shrink-0 flex flex-col justify-between overflow-hidden gap-4 overflow-y-auto custom-scrollbar">
        {/* profile photo */}
        <div className="flex flex-col justify-center items-center gap-3 bg-[#ffffff] p-3">
          {userData.profile_photo_url ? (
            <div className="relative p-1 border-4 w-24 h-24 flex justify-center items-center rounded-full border-[rgba(103,101,101,0.56)] cursor-pointer hover:border-[rgba(40,37,37,0.69)] bg-white">
              <div className="relative w-full h-full rounded-full overflow-hidden">
                <Image
                  src={userData.profile_photo_url}
                  alt={userData.username ?? "profile"}
                  fill
                  className="object-cover rounded-full"
                />
              </div>
            </div>
          ) : (
            <div className="w-full rounded-sm border border-dashed border-[#d9d9d9] bg-[#fcfcfd] px-4 py-5 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-[#eaeaea] bg-white flex items-center justify-center text-[#BA5B55] overflow-hidden">
                <span className="text-xs font-medium uppercase tracking-[0.2em]">New</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1a1a1a]">Add your profile photo</p>
                <p className="text-xs text-[#787878] mt-1">
                  Upload a photo so your account looks complete.
                </p>
              </div>
            </div>
          )}

          {/* Profile photo upload */}
          {/* Client component handles upload and refresh */}
          <div className="w-full flex justify-center">
            <ProfilePhotoEditor />
          </div>

          <p className="leading-none font-medium text-[#4f4f4f]">
            {userData.username}
          </p>

          <div className="flex justify-center items-center gap-5">
            <Link
              href=""
              className="flex justify-center items-center gap-1 text-xs hover:text-[#ba5b55] hover:underline"
            >
              <Users stroke={1.5} size={14} className="text-[#ba5b55]" />
              <p>{0} Followings</p>
            </Link>

            <Link
              href=""
              className="flex justify-center items-center gap-1 text-xs hover:text-[#ba5b55] hover:underline"
            >
              <EditOne stroke={1.5} size={14} className="text-[#ba5b55]" />
              <p>{0} Posts</p>
            </Link>

            <Link
              href=""
              className="flex justify-center items-center gap-1 text-xs hover:text-[#ba5b55] hover:underline"
            >
              <Package stroke={1.5} size={14} className="text-[#ba5b55]" />
              <p>{0} Buyings</p>
            </Link>
          </div>
        </div>

        {/* my info */}
        <div className="flex flex-col justify-center items-start bg-[#ffffff] p-4 gap-3">
          <div className="w-full flex justify-between items-center text-xs leading-none mb-1 text-[#787878]">
            <p className="text-[#ba5b55]">My info</p>
            <Link
              href=""
              className="flex justify-center items-center gap-1 hover:text-[#ba5b55] hover:underline"
            >
              <Pencil stroke={1.5} size={14} />
              <p>Edit info</p>
            </Link>
          </div>

          <div className="flex justify-center items-center gap-3 text-[#787878] text-sm">
            <Mail stroke={1.5} size={16} />
            <p className="leading-none mb-0.5">{userData.email}</p>
          </div>

          {userData.university_name && (
            <div className="flex justify-center items-center gap-3 text-[#787878] text-sm">
              <Store stroke={1.5} size={16} />
              <p className="leading-none mb-0.5">{userData.university_name}</p>
            </div>
          )}

          {userData.phone && (
            <div className="flex justify-center items-center gap-3 text-[#787878] text-sm">
              <Telephone stroke={1.5} size={16} />
              <p className="leading-none mb-0.5">{userData.phone}</p>
            </div>
          )}

          <div className="flex justify-center items-center gap-3 text-[#787878] text-sm">
            <CalendarArrowDown stroke={1.5} size={16} />
            <p className="leading-none mb-0.5">Joined {userData.joinedAt}</p>
          </div>
        </div>

        {/* shipping details */}

        <div className="flex flex-col justify-center items-center bg-[#ffffff] p-4 gap-3">
          <Link
            href=""
            className="flex justify-center items-center gap-1 text-[#ba5b55] hover:underline text-xs leading-none"
          >
            <Plus stroke={1.5} size={14} />
            <p>Add Shipping details</p>
          </Link>
        </div>

        {/* business section */}

        <div className="flex flex-col justify-center items-center bg-[#ffffff] p-4 gap-3">
          {hasShops ? (
            <>
              <div className="w-full flex justify-between items-center text-xs leading-none mb-1 text-[#787878]">
                <p className="text-[#ba5b55]">My Shops</p>

                {userData.shops.length === 1 && (
                  <Link
                    href="/shop/create-shop"
                    className="flex justify-center items-center gap-1 text-[#ba5b55] hover:underline text-xs leading-none"
                  >
                    <Plus stroke={1.5} size={14} />
                    <p>Create another shop</p>
                  </Link>
                )}
              </div>

              {userData.shops.map((shop) => (
                <ShopListItem key={shop.shop_uid} shop={shop as any} />
              ))}
            </>
          ) : (
            <div className="w-full flex flex-col items-start text-center gap-3">
              <div className="flex gap-2 justify-center items-center">
                <Store stroke={1.5} size={18} color="#ba5b55" />
                <p className="text-start leading-none text-sm">
                  Start your Entrepreneurship with
                  <span className="text-[#ba5b55] ml-1">Nashwa</span> Business.
                </p>
              </div>
              <p className="text-xs text-[#787878] text-start leading-4">
                Create a shop on our platform and start selling your products.
                Grow your business with Nashwa to become a successful
                entrepreneur.
              </p>
              <Link
                href="/shop/create-shop"
                className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2 text-white cursor-pointer mt-1"
              >
                <Plus stroke={1.5} size={18} />
                <p>Create a shop</p>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* right section */}

      <div className="flex-1 flex flex-col overflow-hidden gap-4">
        <div className="flex justify-between items-center bg-white w-full py-3 px-5">
          <div className="flex justify-center gap-10 items-center text-xs">
            <button className="hover:underline cursor-pointer flex justify-center items-center gap-1.25 hover:text-[#ba5b55]">
              <EditOne stroke={1.5} size={14} className="text-[#ba5b55]" />
              <p className="leading-none">My Posts</p>
            </button>
            <button className="hover:underline cursor-pointer flex justify-center items-center gap-1.25 hover:text-[#ba5b55]">
              <Package stroke={1.5} size={16} className="text-[#ba5b55]" />
              <p className="leading-none">My Orders</p>
            </button>
            <button className="hover:underline cursor-pointer flex justify-center items-center gap-1 hover:text-[#ba5b55]">
              <CogFour stroke={1.5} size={18} className="text-[#ba5b55]" />
              <p className="leading-none">Account & Settings</p>
            </button>
          </div>

          <div className="flex justify-center items-center gap-5">
            <LogoutButton />
            <DeleteAccountButton />
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0"></div>
      </div>
    </div>
    </>
  );
};

export default ProfilePage;
