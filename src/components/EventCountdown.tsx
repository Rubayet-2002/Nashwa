"use client";

import { useEffect, useState } from "react";

interface EventCountdownProps {
  endsAt: string | Date;
}

export default function EventCountdown({ endsAt }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const target = new Date(endsAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.expired) {
    return (
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#BA5B55]">
        Event Ended
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#BA5B55]">
      <span>Ends In :</span>
      <span className="bg-[#BA5B55]/10 px-1.5 py-0.5 rounded text-[#BA5B55]">{timeLeft.days}d</span>
      <span>:</span>
      <span className="bg-[#BA5B55]/10 px-1.5 py-0.5 rounded text-[#BA5B55]">{timeLeft.hours}h</span>
      <span>:</span>
      <span className="bg-[#BA5B55]/10 px-1.5 py-0.5 rounded text-[#BA5B55]">{timeLeft.minutes}m</span>
      <span>:</span>
      <span className="bg-[#BA5B55]/10 px-1.5 py-0.5 rounded text-[#BA5B55]">{timeLeft.seconds}s</span>
    </div>
  );
}
