import Link from 'next/link'

const NavLink = () => {
  return (
    <div className="flex justify-center items-center gap-10 leading-none text-xs mt-1 text-[#1a1a1a]">
      <Link
        href="/shops"
        className="cursor-pointer hover:text-[#BA5B55] transition-colors duration-300"
      >
        Shops
      </Link>
      <Link
        href="/university"
        className="cursor-pointer hover:text-[#BA5B55] transition-colors duration-300"
      >
        University
      </Link>
      <Link
        href="/category"
        className="cursor-pointer hover:text-[#BA5B55] transition-colors duration-300"
      >
        Category
      </Link>
      <Link
        href="/feasts-events"
        className="cursor-pointer hover:text-[#BA5B55] transition-colors duration-300"
      >
        Feasts & Events
      </Link>
    </div>
  )
}

export default NavLink