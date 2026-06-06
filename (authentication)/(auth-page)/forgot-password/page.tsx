import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ForgotPass from "./ForgotPass";
import { verifyJWT } from "@/app/(authentication)/lib/jwtUtils";

const Forgot = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-intent-token")?.value;
  if (!token) redirect("/email");

  const payload = await verifyJWT(token);

  const isEnterPassword = payload?.purpose === "enter-password";
  const isPasswordReset = payload?.purpose === "password-reset";

  if (!payload || (!isEnterPassword && !isPasswordReset)) {
    redirect("/email");
  }

  return (
    <ForgotPass email={payload.email as string} uid={payload.uid as string} />
  );
};

export default Forgot;
