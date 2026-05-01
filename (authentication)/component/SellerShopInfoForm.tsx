import { EditOne, Mail, MapPin, Store } from "@mynaui/icons-react";
import React from "react";

const SellerShopInfoForm = () => {
  return (
    <form action="" className="flex flex-col gap-3">
      <div className="flex justify-center items-center leading-none gap-2 w-fit text-sm">
        <Mail
          color="#787878"
          size={20}
          stroke={1.5}
          className="min-w-4.5 mt-0.5"
        />
        <p>rowshan.rubayet@gmail.com</p>
        <button className="cursor-pointer text-[#BA5B55] hover:underline w-fit">
          change
        </button>
      </div>

      <p className="text-sm">Please provide your shop information.</p>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Store color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="shop-name"
          placeholder="Enter shop name"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <MapPin color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="phone"
          placeholder="Enter your business location"
          required
          minLength={11}
          maxLength={11}
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div>
        <span className="text-xs text-[#787878] leading-none">(0/300)</span>

        <div className="flex items-start gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
          <EditOne
            color="#787878"
            size={20}
            stroke={1.5}
            className="min-w-4.5 mt-px"
          />
          <textarea
            name="description"
            placeholder="Describe your shop and business."
            maxLength={300}
            required
            className="w-full min-h-15 max-h-15 bg-white text-sm outline-none placeholder:text-[#787878] resize-none custom-scrollbar"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">Next step </p>
      </button>
    </form>
  );
};

export default SellerShopInfoForm;
