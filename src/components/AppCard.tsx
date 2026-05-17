import { ReactNode } from "react";

interface AppCardProps {
  children: ReactNode;
  className?: string;
}

export function AppCard({ children, className = "" }: AppCardProps) {
  return (
    <div
      className={`glass rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow ${className}`}
    >
      {children}
    </div>
  );
}
