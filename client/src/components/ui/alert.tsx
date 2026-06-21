import * as React from "react";
import { cn } from "@/lib/utils";

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "rounded-md p-3 text-sm",
      variant === "destructive" ? "bg-red-50 text-red-900 border border-red-200" : "bg-slate-50 text-slate-900",
      className,
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

export { Alert };
