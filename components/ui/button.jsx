import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, children, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "ghost"
          ? "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-transparent data-[state=open]:bg-transparent"
          : variant === "secondary"
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            : variant === "destructive"
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/80"
              : variant === "outline"
                ? "bg-transparent border border-input hover:bg-accent hover:text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/80",
        size === "sm" ? "h-9 px-3" : size === "lg" ? "h-11 px-8" : size === "icon" ? "h-10 w-10" : "h-10 px-4",
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button }
