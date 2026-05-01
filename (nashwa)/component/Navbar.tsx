import { User } from "@/zustand/userStore";
import Logo from "./Logo";
import NavButton from "./NavButton";
import NavLink from "./NavLink";
import SearchBar from "./SearchBar";

const Navbar = ({ user }: { user: User | null }) => {
  return (
    <nav className="min-w-screen flex justify-between items-center px-5 py-3 bg-white">
      <Logo />
      <NavLink />
      <SearchBar />
      <NavButton userProfile={user} />
    </nav>
  );
};

export default Navbar;
