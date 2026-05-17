import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
  showNotch?: boolean;
}

export function PhoneFrame({ children, className = "", showNotch = true }: PhoneFrameProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[360px] rounded-[44px] bg-gradient-to-b from-white/10 to-white/5 p-[3px] shadow-phone ${className}`}
    >
      <div className="relative overflow-hidden rounded-[42px] bg-[oklch(0.12_0.04_180)]">
        {showNotch && (
          <div className="absolute left-1/2 top-2 z-20 h-6 w-28 -translate-x-1/2 rounded-full bg-black/80" />
        )}
        <div className="relative z-10 min-h-[640px] px-5 pb-8 pt-12">{children}</div>
        {/* status bar */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-7 pt-3 text-[11px] font-medium text-white/80">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-white/80" />
            <span className="h-2 w-3 rounded-sm bg-white/80" />
          </span>
        </div>
      </div>
    </div>
  );
}
