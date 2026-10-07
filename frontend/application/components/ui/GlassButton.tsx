"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "elevated" | "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      children,
      variant = "default",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-6 py-2.5 gap-2.5 rounded-2xl",
    };

    const variantStyles = {
      default:
        "liquid-glass text-slate-200 hover:text-white hover:bg-white/10 hover:border-white/25",
      elevated:
        "liquid-glass-elevated text-white hover:bg-white/15 hover:border-white/35 shadow-lg",
      primary:
        "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:text-white hover:border-cyan-300/60 backdrop-blur-md",
      danger:
        "bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-400/50 backdrop-blur-md",
      ghost:
        "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {/* Specular sheen overlay */}
        <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";