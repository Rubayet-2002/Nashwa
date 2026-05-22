"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { User, Lock, Eye, EyeOff } from "@mynaui/icons-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { RegisterInputCheck } from "../lib/inputValidation";
import { UNIVERSITIES } from "@/app/shop/lib/universities";

interface RegisterFormProps {
  email: string;
}

const RegisterForm = ({ email }: RegisterFormProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);
  const [showPassword, setShowPassword] = useState(false);
  const [showUniversityModal, setShowUniversityModal] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMap: Record<string, string> = {
        invalid_session: "Your session expired. Please try again.",
        csrf: "Security check failed. Please refresh the page.",
        no_code: "Google authentication was cancelled or failed.",
        auth_failed: "Could not verify Google account. Please try again.",
        server_error: "A database error occurred. Please try later.",
      };
      
      const message = errorMap[error] || "An unexpected error occurred.";
      addToast(message, "error");

      router.replace(pathname);
    }
  }, [searchParams, addToast, router, pathname]);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const username = (formData.get("username") as string).trim();
    const email = (formData.get("email") as string).trim();
    const password = (formData.get("password") as string);

    const validation = RegisterInputCheck.safeParse({
      username,
      email,
      password,
    });

    if (!validation.success) {
      return {
        error: validation.error.issues[0].message,
        values: { username },
      };
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(validation.data),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: result.message,
        };
      }
      return { error: result.message, values: { username } };
    } catch (error) {
      return { error: "Network error! Please try again", values: { username } };
    }
  };

  const [state, formAction, isPending] = useActionState(handleClientAction, null);

  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      // Show university picker modal before redirecting to verification
      setShowUniversityModal(true);
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />

      {/* University picker shown after successful registration */}
      {showUniversityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowUniversityModal(false); router.replace('/verify-otp'); }} />
          <div className="relative z-10 w-full max-w-md overflow-hidden border border-[#eef0f3] bg-white shadow-2xl rounded-sm">
            <div className="border-b border-[#eef0f3] px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#BA5B55]">University</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-[#1a1a1a]">Select your university</h3>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="grid gap-2">
                {UNIVERSITIES.map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/set-user-university', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                          body: JSON.stringify({ universityUid: u.uid }),
                        });
                        const j = await res.json();
                        if (res.ok) {
                          addToast('University saved', 'success');
                        } else {
                          addToast(j.message || 'Failed to save university', 'error');
                        }
                      } catch (err) {
                        addToast('Network error', 'error');
                      } finally {
                        setShowUniversityModal(false);
                        router.replace('/verify-otp');
                      }
                    }}
                    className="w-full text-left px-3 py-2 border border-[#eaeaea] hover:border-[#BA5B55]"
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#eef0f3] bg-white px-6 py-4">
              <button type="button" onClick={() => { setShowUniversityModal(false); router.replace('/verify-otp'); }} className="px-3 py-1 text-xs border border-[#eaeaea] hover:bg-gray-50 text-[#787878]">Skip</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <User color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="text"
          name="username"
          placeholder="Enter username"
          defaultValue={state?.values?.username || ""}
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Lock color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Enter password (At least 6 characters)"
          minLength={6}
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="outline-none text-[#787878] hover:text-[#BA5B55] cursor-pointer"
        >
          {showPassword ? <EyeOff size={20} stroke={1.5} /> : <Eye size={20} stroke={1.5} />}
        </button>
      </div>

      <p className="text-xs text-[#787878] text-center">
        By continuing, you agree to Nashwa's{" "}
        <Link href="/terms-conditions" className="text-[#BA5B55] hover:underline">Terms & Conditions</Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-[#BA5B55] hover:underline">Privacy Policy</Link>
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 cursor-pointer"
      >
        <p className="leading-none">{isPending ? "Creating account..." : "Create account"}</p>
      </button>

      <div className="text-xs flex justify-center items-center leading-none text-[#787878]">OR</div>

      <button
        type="button"
        disabled={isPending}
        onClick={() => (window.location.href = "/api/google-auth?from=" + pathname)}
        className="w-full text-sm bg-white hover:text-[#BA5B55] border border-[#23262D] hover:border-[#BA5B55] transition-colors flex items-center justify-center gap-2 py-2.5 text-[#23262D] disabled:text-[#787878] cursor-pointer"
      >
        <Image src={google} alt="google-logo" className="w-5 h-5" />
        <p className="leading-none">Continue with Google</p>
      </button>
    </form>
  );
};

export default RegisterForm;
