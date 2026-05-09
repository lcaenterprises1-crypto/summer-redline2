import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
  icon?: ReactNode;
}

export function Button({
  children,
  variant = "secondary",
  fullWidth = false,
  icon,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${fullWidth ? "button-full" : ""} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
