"use client";

import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket-client";
import { useAuthStore } from "@/zustand/authStore";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();

    // Identify this user to socket server
    socket.emit("identify", { uid: user.uid });

    return () => {
      // Do not disconnect on unmount (keep persistent connection)
    };
  }, [user]);

  return <>{children}</>;
}
