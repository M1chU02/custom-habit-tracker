import React from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className, glass = false }) => {
  return (
    <motion.div
      whileHover={glass ? { y: -4, transition: { duration: 0.2 } } : undefined}
      className={clsx(
        "rounded-2xl border border-border p-6 transition-all duration-300",
        glass ? "glass" : "bg-bg-card",
        className,
      )}>
      {children}
    </motion.div>
  );
};

export default Card;
