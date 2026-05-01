import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "../../lib/jwtUtils";
import ForgotPassForm from "../../component/ForgotPassForm";

const ForgotPass = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-email-token")?.value;
  if (!token) redirect("/account-email");

  const payload = await verifyJWT(token);

  const isEnterPassword = payload?.purpose === "enter-password";
  const isPasswordReset = payload?.purpose === "password-reset";

  if (!payload || (!isEnterPassword && !isPasswordReset)) {
    redirect("/account-email");
  }

  return <ForgotPassForm email={payload.email as string} />;
};

export default ForgotPass;
