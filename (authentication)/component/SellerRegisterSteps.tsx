import React from 'react'

const SellerRegisterSteps = () => {
  return (
          <div className="flex justify-center items-center gap-4">
            <div className="flex justify-center items-center gap-2 text-xs">
              <div className="w-5 h-5 border flex leading-none justify-center items-center border-[#BA5B55] rounded-full text-white bg-[#ba5b55] font-medium">
                <span>1</span>
              </div>
              <p className="leading-none text-[#ba5b55]">Email checking</p>
            </div>

            <div className="flex justify-center items-center gap-2 text-xs">
              <div className="w-5 h-5 border flex leading-none justify-center items-center border-[#787878] rounded-full text-[#787878] font-medium">
                <span>2</span>
              </div>
              <p className="leading-none text-[#787878]">Personal info</p>
            </div>
            <div className="flex justify-center items-center gap-2 text-xs">
              <div className="w-5 h-5 border flex leading-none justify-center items-center border-[#787878] rounded-full text-[#787878] font-medium">
                <span>3</span>
              </div>
              <p className="leading-none text-[#787878]">Shop info</p>
            </div>
            <div className="flex justify-center items-center gap-2 text-xs">
              <div className="w-5 h-5 border flex leading-none justify-center items-center border-[#787878] rounded-full text-[#787878] font-medium">
                <span>4</span>
              </div>
              <p className="leading-none text-[#787878]">Documents pdf</p>
            </div>
          </div>
  )
}

export default SellerRegisterSteps