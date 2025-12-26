import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "xl" | "icon";
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

    const variants = {
      default: "bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow-md",
      outline: "border-2 border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700 hover:border-gray-400",
      ghost: "hover:bg-orange-50 text-gray-700 hover:text-orange-600",
      link: "text-orange-500 underline-offset-4 hover:underline p-0 h-auto",
      destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-9 px-3 text-sm rounded-md",
      lg: "h-11 px-8 text-base rounded-lg",
      xl: "h-12 px-10 text-base rounded-lg font-semibold",
      icon: "h-10 w-10 p-0",
    };

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button className={classes} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps };
