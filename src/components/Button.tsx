import React from "react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className,
  isLoading,
  ...props
}) => {
  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20",
    secondary:
      "bg-bg-card-hover text-text-main hover:bg-white/10 hover:border-border-hover border border-border",
    ghost: "hover:bg-white/5 text-text-muted hover:text-text-main",
    danger: "bg-error/10 text-error hover:bg-error hover:text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-10 py-4 text-xl",
  };

  return (
    <motion.button
      whileHover={{
        scale: 1.02,
        y: -2,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}>
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
