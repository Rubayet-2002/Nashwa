import Link from "next/link";
import { redirect } from "next/navigation";
import { adminAuthMe } from "@/app/admin/lib/adminAuthMe";
import AdminLogoutButton from "../component/AdminLogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, clearCookies } = await adminAuthMe();

  if (clearCookies) {
    redirect("/api/clear-cookie");
  }

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen w-full bg-[#121212] text-[#e0e0e0] overflow-hidden font-sans">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-[#181818] border-r border-[#2a2a2a] flex flex-col shrink-0">
        {/* Branding */}
        <div className="p-6 border-b border-[#2a2a2a] flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-widest text-[#BA5B55]">
              NASHWA <span className="font-light text-[#888]">ADMIN</span>
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono truncate">{admin.admin_email}</span>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-[#aaa] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/shops"
            className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-[#aaa] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
          >
            Pending Shop Approvals
          </Link>

          <Link
            href="/admin/universities"
            className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-[#aaa] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
          >
            Communities (Universities)
          </Link>

          <Link
            href="/admin/events"
            className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-[#aaa] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
          >
            Feast &amp; Event Creator
          </Link>

          <Link
            href="/admin/reports"
            className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-2xl transition-all text-[#aaa] hover:bg-[#BA5B55]/5 hover:text-[#BA5B55]"
          >
            Reported Items
          </Link>
        </nav>

        {/* Footer controls */}
        <div className="p-4 border-t border-[#2a2a2a] bg-[#181818] shrink-0">
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#121212]">
        {/* Top Navbar */}
        <header className="h-16 bg-[#181818] border-b border-[#2a2a2a] flex items-center justify-between px-6 shrink-0 shadow-sm">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Nashwa Central Administration
          </h2>
          <div className="flex items-center gap-3 text-xs text-[#888] font-light">
            <span>Root System Administrator</span>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
