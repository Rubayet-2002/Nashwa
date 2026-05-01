 "use client"

import Link from "next/link";
import { Bookmark, Bell, ChatMessages, UserCircle } from "@mynaui/icons-react";
import { User, useUserStore } from "@/zustand/userStore";

const NavButton = ({ userProfile }: { userProfile: User | null }) => {
  const { user, isAuthenticated } = useUserStore();

  const isUser = user || userProfile;
  const isAuth = isAuthenticated || !!userProfile;

  return (
    <div className="flex justify-center items-center gap-10">
      <Link href="/cart">
        <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1">
          <div className="flex justify-center items-center gap-1 leading-none">
            <Bookmark stroke={1} size={20} />
            <div>{"(0)"}</div>
          </div>
          <p className="leading-none">Saved posts</p>
        </button>
      </Link>

      <Link href="/notification">
        <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1">
          <div className="flex justify-center items-center gap-1 leading-none">
            <Bell stroke={1} size={20} />
            <div>{"(0)"}</div>
          </div>
          <p className="leading-none">Notifications</p>
        </button>
      </Link>

      <Link href="/chat">
        <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-start justify-center gap-1">
          <div className="flex justify-center items-center gap-1 leading-none">
            <ChatMessages stroke={1} size={20} />
            <div>{"(0)"}</div>
          </div>
          <p className="leading-none">Messages</p>
        </button>
      </Link>

      {isAuth && isUser ? (
        <Link href="/profile">
          <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-center justify-center gap-1">
            <div className="w-5 h-5 bg-[#BA5B55] text-white text-sm font-medium rounded-full flex justify-center items-center">
  <p className="leading-none mb-0.5">            {isUser.username?.charAt(0).toUpperCase()}</p>
            </div>

            <p className="leading-none">My Account</p>
          </button>
        </Link>
      ) : (
        <Link href="/account-email">
          <button className="text-[#1a1a1a] text-xs cursor-pointer hover:text-[#BA5B55] transition-colors duration-300 flex flex-col items-center justify-center gap-1">
            <UserCircle stroke={1} size={20} />
            <p className="leading-none">My Account</p>
          </button>
        </Link>
      )}
    </div>
  );
};

export default NavButton;
