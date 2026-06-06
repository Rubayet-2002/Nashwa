"use client";

import Link from "next/link";
import { useAuthStore } from "@/zustand/authStore";
import { useRouter } from "next/navigation";

const Logo = () => {
  const { activeShop } = useAuthStore();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (activeShop) {
      e.preventDefault();
      router.push("/shop/dashboard");
    }
  };

  return (
    <Link href="/" onClick={handleClick} className="w-fit">
      <div className=" leading-none flex flex-col justify-center items-start gap-1">
        <p className="font-bold text-lg leading-none text-[#BA5B55]">Nashwa</p>
        <p className="text-xs leading-none">THE PATH TO GROWTH</p>
      </div>
    </Link>
  );
};

export default Logo;