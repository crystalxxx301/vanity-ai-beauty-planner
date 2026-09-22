import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "medium" | "large";
  emphasis?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
};

export function Button({
  className = "",
  size = "large",
  emphasis = "primary",
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${size} button--${emphasis} ${fullWidth ? "button--full" : ""} ${className}`}
      {...props}
    />
  );
}
