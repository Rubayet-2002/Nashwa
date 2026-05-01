import { Mail } from "@mynaui/icons-react";

const SellerEmailForm = () => {
  return (
    <form action="" className="flex flex-col gap-3">
      <p className="text-xs">
        Please enter your personal active Email to continue.
      </p>
      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Mail color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="email"
          name="email"
          placeholder="Enter email"
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <button
        type="submit"
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">Continue</p>
      </button>
    </form>
  );
};

export default SellerEmailForm;
