"use client";

import { useEffect, useRef } from "react";
import { useAuthStore, User } from "./authStore";

interface AuthStoreSetupProps {
  user: User | null;
  activeShopUid?: string | null;
}

export default function AuthStoreSetup({
  user,
  activeShopUid,
}: AuthStoreSetupProps) {
  const setup = useRef(false);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setUser(user, activeShopUid);

    if (!setup.current) {
      setup.current = true;

      if (user?.need_refresh) {
        const performRefresh = async () => {
          try {
            const response = await fetch("/api/refresh-token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
              },
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error(
                "Silent refresh failed:",
                response.status,
                errorData.message,
              );
              return;
            }

            console.log("Session refreshed successfully.");
          } catch (error) {
            console.error("Network error during silent refresh:", error);
          }
        };

        performRefresh();
      }
    }
  }, [user, activeShopUid, setUser]);

  return null;
}
