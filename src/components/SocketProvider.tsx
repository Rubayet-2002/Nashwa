"use client";

import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket-client";
import { useAuthStore } from "@/zustand/authStore";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();

    socket.emit("identify", { uid: user.uid });

    return () => {
      

    };
  }, [user]);

  return <>{children}</>;
}
