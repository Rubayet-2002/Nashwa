import AdminLoginForm from "./AdminLoginForm";

export const metadata = {
  title: "Admin Login - Nashwa",
  description: "Secure administrative login for Nashwa platform.",
};

const AdminLoginPage = () => {
  return (
    <div className="flex justify-center items-center w-full h-screen bg-[#f5f5f5] px-5">
      <div className="w-full max-w-md bg-white p-8 shadow-sm border border-[#e5e5e5] flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Nashwa Admin</h1>
          <p className="text-xs text-[#787878]">
            Enter your administrative credentials to access the dashboard.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
};

export default AdminLoginPage;
