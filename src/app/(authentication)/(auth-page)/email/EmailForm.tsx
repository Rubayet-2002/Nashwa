"use client";

import Link from "next/link";
import Image from "next/image";
import google from "@/image/google.png";
import { Mail } from "@mynaui/icons-react";
import { useToastStore } from "@/zustand/toastStore";
import { emailCheck } from "@/app/(authentication)/lib/inputValidation";
import { useActionState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const EmailForm = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);

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
    const email = (formData.get("email") as string).trim();

    const validation = emailCheck.safeParse({
      email,
    });

    const safeValues = { email };

    if (!validation.success) {
      return {
        error: validation.error.issues[0].message,
        values: safeValues,
      };
    }

    try {
      const response = await fetch("/api/email", {
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
          isExist: result.exist,
          message: result.message,
          auth_type: result.auth_type,
          redirect: result.redirect,
        };
      } else {
        return {
          error: result.message,
          values: safeValues,
        };
      }
    } catch (error) {
      return {
        error: "Network error! Please try again",
        values: safeValues,
      };
    }
  };

  const [state, formAction, isPending] = useActionState(
    handleClientAction,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state?.success) {
      if (state.auth_type === "google") {
        addToast(state.message, "success");
        return;
      }
      if (state.redirect) {
        router.push(state.redirect);
      }
    } else if (state?.error) {
      addToast(state.error, "error");
    }
  }, [state, addToast, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center gap-2 px-3 py-2 border border-[#787878] focus-within:border-[#BA5B55]">
        <Mail color="#787878" size={20} stroke={1.5} className="min-w-4.5" />
        <input
          type="email"
          name="email"
          placeholder="Enter email"
          defaultValue={state?.values?.email || ""}
          required
          className="w-full bg-white text-sm outline-none placeholder:text-[#787878]"
        />
      </div>

      <p className="text-xs text-[#787878] text-center">
        By continuing, you agree to Nashwa's
        <Link
          href="/terms-conditions"
          className="text-[#BA5B55] hover:underline ml-0.75 mr-0.75"
        >
          Terms & Conditions
        </Link>
        and
        <Link
          href="/privacy-policy"
          className="text-[#BA5B55] hover:underline ml-0.75"
        >
          Privacy Policy
        </Link>
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm bg-[#BA5B55] border border-[#BA5B55] hover:bg-white hover:text-[#BA5B55] hover:border transition-colors flex items-center justify-center gap-2 py-2.5 text-white disabled:bg-[#BA5B55]/70 disabled:border-transparent cursor-pointer"
      >
        <p className="leading-none">
          {isPending ? "Checking email..." : "Continue"}
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
        className="w-full text-sm bg-white hover:text-[#BA5B55] border border-[#23262D] hover:border-[#BA5B55] transition-colors flex items-center justify-center gap-2 py-2.5 text-[#23262D] disabled:text-[#787878] disabled:border-transparent cursor-pointer"
      >
        <Image src={google} alt="google-logo" className="w-5 h-5" />
        <p className="leading-none">Continue with Google</p>
      </button>
    </form>
  );
};

export default EmailForm;
