import React from "react";
import { Camera } from "@mynaui/icons-react";

const ShopDashboard = () => {
  return (
    <div className="flex w-full gap-5 h-full overflow-hidden">
      <div className="w-120 shrink-0 flex flex-col overflow-hidden p-2">
        {/* Added 'relative' here so children position based on this div */}
        <div className="bg-white relative">
          
          <div className="relative">
            <div className="h-44 w-full bg-gradient-to-br from-[#f7f1f0] to-[#eceff3]" />
            <button className="flex items-center cursor-pointer hover:bg-[rgba(40,37,37,0.69)] justify-center px-3 py-1.5 gap-1 absolute right-2 bottom-2 bg-[rgba(103,101,101,0.56)] rounded-xl text-white text-xs">
              <Camera size={18} stroke={1.5} />
              <p className="leading-none"> Change photo</p>
            </button>
          </div>

          <div className="flex justify-start items-center gap-2 p-6 pt-2">
 
            <div className="p-1 border-3 rounded-full border-[#a6a6a6] absolute left-4 bottom-0 bg-white">
              <div className="w-20 h-20 rounded-full bg-[#f1f1f1] flex items-center justify-center text-[#BA5B55] text-xs font-semibold uppercase tracking-[0.2em]">
                Profile
              </div>
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
