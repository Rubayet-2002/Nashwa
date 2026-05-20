import { Search } from "@mynaui/icons-react";

const SearchBar = () => {
  return ( 
    <form className="min-w-90 px-2 flex justify-center items-center rounded-full shadow-sm shadow-[#e6e6e6] border border-white bg-[#f4f4f4] focus-within:border-[#BA5B55] focus-within:bg-white focus-within:shadow-none transition-colors duration-300">
      <input
        type="text"
        placeholder="What are you looking for?"
        required
        className="w-full px-2 py-1.5 outline-none placeholder:text-xs placeholder:text-[#787878] bg-transparent"
      />

      <button
        type="submit"
        className="p-1 rounded-full cursor-pointer text-[#BA5B55] hover:bg-[#BA5B55] hover:text-white transition-colors duration-300"
      >
        <Search stroke={2} size={20} />
      </button>
    </form>
  );
};

export default SearchBar;
