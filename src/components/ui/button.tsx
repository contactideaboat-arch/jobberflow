import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { IconSpin } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * Buttons.
 *
 *   default      steel blue. The one action a screen is for.
 *   outline      white with a fine rule. Everything secondary.
 *   secondary    subtle fill. Secondary actions inside dense toolbars.
 *   ghost        no chrome until hover. Icon buttons and row actions.
 *   destructive  red. Only for an action that removes or reverses a record.
 *   link         inline text action.
 *
 * States: hover darkens or washes the ground, pressed sinks 1px, focus draws
 * the 2px steel ring, disabled drops to 50% and stops pointer events, and
 * `loading` swaps in a spinner, marks the button busy and disables it.
 * On touch screens every size grows to a 44px target.
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/85 focus-visible:ring-destructive",
        outline:
          "border border-border-strong bg-card text-foreground hover:border-input hover:bg-subtle active:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent active:bg-border",
        ghost: "text-foreground hover:bg-accent active:bg-border",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-control px-3.5 pointer-coarse:min-h-11",
        sm: "h-control-sm px-3 text-[0.8125rem] pointer-coarse:min-h-11",
        lg: "h-control-lg px-5 pointer-coarse:min-h-11",
        icon: "size-control pointer-coarse:size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner, marks the button busy and blocks repeat presses. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }));
    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <IconSpin className="animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
