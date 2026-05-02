import { z } from "zod";

export const emailCheck = z.object({
  email: z.email("Invalid email format"),
});

export const RegisterInputCheck = z.object({
  username: z.string().min(3, "Username must be 3+ characters"),
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be 6+ characters"),
});

export const passwordCheck = z.object({
  password: z.string().min(6, "Password has to be atleast 6 characters long"),
});
