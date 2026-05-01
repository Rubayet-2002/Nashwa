"use client";

import { useEffect, useRef } from "react";


  useEffect(() => {
    if (!setup.current) {
      useUserStore.setState({ user, isAuthenticated: !!user });
      setup.current = true;

      if (user?.needs_refresh) {
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
              console.error(
                "Silent refresh failed with status:",
                response.status,
              );
              return;
            }
            console.log("Session silently refreshed.");
          } catch (error) {
            console.error("Network error during silent refresh:", error);
          }
        };

        performRefresh();
      }
    }
  }, [user]);

  return null;
}
