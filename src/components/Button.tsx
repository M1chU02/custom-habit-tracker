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
      "bg-primary text-white border-primary/50 shadow-lg shadow-primary/20 hover:bg-primary-deep",
    secondary:
      "bg-white/5 text-text-main border border-white/10 hover:bg-white/10 hover:border-white/20",
    ghost:
      "text-text-muted hover:text-text-main hover:bg-white/5 border-transparent",
    danger:
      "bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3",
    lg: "px-10 py-5 text-xl font-extrabold tracking-tight",
  };

  return (
    <motion.button
      whileHover={
        !props.disabled
          ? {
              scale: 1.03,
              y: -3,
              boxShadow:
                "0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 15px var(--primary-glow)",
            }
          : {}
      }
      whileTap={!props.disabled ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={clsx(
        "inline-flex items-center justify-center rounded-2xl font-bold transition-all relative overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border outline-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}>
      {isLoading ? (
        <span className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin mr-3" />
      ) : null}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export default Button;
