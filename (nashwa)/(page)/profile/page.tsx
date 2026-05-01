
import LogoutButton from "../../component/LogoutButton";
import DeleteAccountButton from "../../component/DeleteAccountButton";
import { redirect } from "next/navigation";
import { profileData } from "../../lib/profileData";
import { sessionData } from "../../lib/sessionData";
import Image from "next/image";

const Profile = async () => {
  const user = await profileData();
  const sessions = await sessionData();

  if (!user) {
    redirect("/account-email");
  }

  const activeSessions = sessions.filter((s) => !s.is_revoked);

  return (
    <div className="flex w-full gap-5 h-full overflow-hidden">
      <aside className="w-90 shrink-0 flex flex-col bg-white overflow-hidden">
        <div className="flex flex-col items-center gap-2 p-4 border-b border-gray-100">
          <div className="relative h-24 w-24 shadow-sm overflow-hidden bg-[#f0f2f4] flex items-center justify-center">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.username ?? "Avatar"}
                fill
                className="object-cover"
              />
            ) : (
              <User size={44} stroke={1} className="text-[#b0b8be]" />
            )}
          </div>
          <div className="text-center">
            <p className="font-bold text-[#23262D] text-lg leading-tight">
              {user.username ?? "N/A"}
            </p>
            <span className=" text-xs uppercase tracking-widest text-[#BA5B55]">
              {user.role}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-6 flex-1">
          <div className="flex items-center gap-3 text-[#787878] text-sm">
            <Mail stroke={1.5} size={16} className="shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>

          {user.phone && (
            <div className="flex items-center gap-3 text-[#787878] text-sm">
              <Telephone stroke={1.5} size={16} className="shrink-0" />
              <span>{user.phone}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-[#787878] text-sm">
            <CalendarArrowDown stroke={1.5} size={16} className="shrink-0" />
            <span>Joined {user.joinedAt}</span>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 pt-4 border-t border-gray-100">
          <LogoutButton />
          <DeleteAccountButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-white overflow-hidden min-w-0">
        <div className="shrink-0 px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[#23262D] text-base">
              Login Sessions
            </h2>
            <p className="text-xs text-[#787878] mt-0.5">
              {activeSessions.length} active &middot; {sessions.length} total
            </p>
          </div>
        </div>

        {/* scrollable session lists */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 custom-scrollbar">
          {sessions.length === 0 ? (
            <p className="text-sm text-[#787878] text-center mt-8">
              No sessions found.
            </p>
          ) : (
            sessions.map((session) => {
              const isRevoked = session.is_revoked;

              const DeviceIcon =
                session.device_type === "mobile"
                  ? Mobile
                  : session.device_type === "tablet"
                    ? Tablet
                    : Monitor;

              return (
                <div
                  key={session.session_id}
                  className={`flex items-start gap-4 p-4 border rounded-sm transition-colors ${
                    isRevoked
                      ? "border-gray-100 bg-gray-50/60 opacity-70"
                      : "border-gray-200 hover:border-[#BA5B55]/30 bg-white"
                  }`}
                >
                  <div
                    className={`shrink-0 p-2.5 rounded-sm ${
                      isRevoked
                        ? "bg-gray-100 text-gray-400"
                        : "bg-[#f9f0ef] text-[#BA5B55]"
                    }`}
                  >
                    <DeviceIcon size={22} stroke={1.5} />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-[#23262D] truncate">
                        {session.browser_name ?? "Unknown Browser"} on{" "}
                        {session.os_name ?? "Unknown OS"}
                      </p>

                      {isRevoked ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                          <ShieldX size={11} stroke={2} />
                          Logged out
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                          <ShieldCheck size={11} stroke={2} />
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#787878]">
                      {session.formattedDate}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
