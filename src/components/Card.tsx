import React from "react";
import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, glass = false }) => {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-border p-6 transition-all duration-300",
        glass ? "glass-morphism" : "bg-bg-card",
        className,
      )}>
      {children}
    </div>
  );
};

export default Card;
