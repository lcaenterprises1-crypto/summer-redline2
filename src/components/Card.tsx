import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  accent?: boolean;
}

export function Card({ children, className = "", accent = false, ...props }: CardProps) {
  return (
    <section className={`card ${accent ? "card-accent" : ""} ${className}`} {...props}>
      {children}
    </section>
  );
}
