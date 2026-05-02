import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="w-fit">
      <div className=" leading-none flex flex-col justify-center items-start gap-1">
        <p className="font-bold text-lg leading-none text-[#BA5B55]">Nashwa</p>
        <p className="text-xs leading-none">THE PATH TO GROWTH</p>
      </div>
    </Link>
  );
};

export default Logo;
