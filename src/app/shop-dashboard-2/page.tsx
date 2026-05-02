import React from "react";
import Image from "next/image";
import cover from "@/image/cover.png";
import profile from "@/image/profile.png";
import { Camera } from "@mynaui/icons-react";

const ShopDashboard = () => {
  return (
    <div className="flex w-full gap-5 h-full overflow-hidden">
      <div className="w-120 shrink-0 flex flex-col overflow-hidden p-2">
        {/* Added 'relative' here so children position based on this div */}
        <div className="bg-white relative">
          
          <div className="relative">
            <Image src={cover} alt="cover" className="w-full" />
            <button className="flex items-center cursor-pointer hover:bg-[rgba(40,37,37,0.69)] justify-center px-3 py-1.5 gap-1 absolute right-2 bottom-2 bg-[rgba(103,101,101,0.56)] rounded-xl text-white text-xs">
              <Camera size={18} stroke={1.5} />
              <p className="leading-none"> Change photo</p>
            </button>
          </div>

          <div className="flex justify-start items-center gap-2 p-6 pt-2">
 
            <div className="p-1 border-3 rounded-full border-[#a6a6a6] absolute left-4 bottom-0 bg-white">
              <Image
                src={profile}
                alt="profile"
                className="w-20 h-20 rounded-full"
              />
                          <button className="flex items-center cursor-pointer hover:bg-[rgba(40,37,37,0.69)] justify-center  absolute right-0 w-7 h-7 bottom-0 bg-[rgba(38,34,34,0.56)] rounded-full text-white text-xs">
              <Camera size={18} stroke={1.5} />
            </button>
            </div>
            <div className="flex flex-col justify-center items-start gap-1 ml-23">
              <p className="leading-none text-sm text-[#BA5B55] font-medium">
                Retro Retrive
              </p>
              <p className="text-xs leading-none text-[#787878]">
                Armina Aradha
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ShopDashboard;
