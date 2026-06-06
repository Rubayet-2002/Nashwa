"use client";

import Link from "next/link";
import Image from "next/image";
import google from "@/image/google.png";
import { useActionState, useEffect, useState } from "react";
import { User, Lock, Eye, EyeOff } from "@mynaui/icons-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useToastStore } from "@/zustand/toastStore";
import { RegisterInputCheck } from "@/app/(authentication)/lib/inputValidation";

interface RegisterFormProps {
  email: string;
}

const RegistrationForm = ({ email }: RegisterFormProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    const errorMap: Record<string, string> = {
      invalid_session: "Your session expired. Please try again.",
      auth_failed: "Could not verify Google account. Please try again.",
    };

    const message = errorMap[error] || "An unexpected error occurred.";
    addToast(message, "error");

    router.replace(pathname);
  }, [searchParams, addToast, router, pathname]);

  const handleClientAction = async (prevState: any, formData: FormData) => {
    const username = (formData.get("username") as string).trim();
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;

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
      const response = await fetch("/api/registration", {
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

  const [state, formAction, isPending] = useActionState(
    handleClientAction,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      addToast(state.message, "success");
      router.replace("/otp-verification");
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />

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
          {showPassword ? (
            <EyeOff size={20} stroke={1.5} />
          ) : (
            <Eye size={20} stroke={1.5} />
          )}
        </button>
      </div>

      <p className="text-xs text-[#787878] text-center">
        By continuing, you agree to Nashwa's{" "}
        <Link
          href="/terms-conditions"
          className="text-[#BA5B55] hover:underline"
        >
          Terms & Conditions
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-[#BA5B55] hover:underline">
          Privacy Policy
        </Link>
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 cursor-pointer"
      >
        <p className="leading-none">
          {isPending ? "Creating account..." : "Create account"}
        </p>
      </button>

      <div className="text-xs flex justify-center items-center leading-none text-[#787878]">
        OR
      </div>

      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          (window.location.href = "/api/google-auth?from=" + pathname)
        }
        className="w-full text-sm bg-white hover:text-[#BA5B55] border border-[#23262D] hover:border-[#BA5B55] transition-colors flex items-center justify-center gap-2 py-2.5 text-[#23262D] disabled:text-[#787878] cursor-pointer"
      >
        <Image src={google} alt="google-logo" className="w-5 h-5" />
        <p className="leading-none">Continue with Google</p>
      </button>
    </form>
  );
};

export default RegistrationForm;
