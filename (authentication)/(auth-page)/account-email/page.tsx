import Logo from '@/app/(nashwa)/component/Logo'
import Link from 'next/link'
import EmailForm from '../../component/EmailForm'

const AccountEmail = () => {
  return (
    <div className="min-w-full flex justify-center">
      <div className="bg-white mt-15 flex flex-col p-6 gap-4 w-113">
        <Logo />
        <p className="text-sm">Enter your email to continue.</p>

        <EmailForm />

        <div className="flex flex-col leading-none gap-1 w-fit">
          <p className="text-sm">Start your Business with Nashwa.</p>
          <Link
            href="/seller-register"
            className="text-xs text-[#BA5B55] hover:underline w-fit"
          >
            Create a professional account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AccountEmail