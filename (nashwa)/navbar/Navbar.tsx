import Logo from "./Logo";
import SearchBar from "./SearchBar";
import NavButton from "./NavButton";
import NavLink from "./NavLink";
import type { User } from "@/zustand/authStore";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
 <nav className="min-w-screen flex justify-between items-center px-5 py-3 bg-white">
      <Logo />
      <NavLink />
      <SearchBar />
      <NavButton serverUser={user} />
    </nav>
  );
}
